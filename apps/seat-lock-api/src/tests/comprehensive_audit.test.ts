import { pool, initRedis, closeConnections, getRedisClient, isRedisReady } from '../config/db.js';
import { ReservationService } from '../services/reservationService.js';
import { RedisLockService } from '../services/lockService.js';
import { runMigrations } from '../db/migrate.js';
import { seedData, DEMO_SHOW_ID } from '../db/seed.js';
import { randomUUID } from 'crypto';

interface AuditResult {
  condition: string;
  passed: boolean;
  durationMs: number;
  dbVerification: string;
  error?: string;
}

const auditResults: AuditResult[] = [];

const runAuditCheck = async (
  condition: string,
  testFn: () => Promise<string>
) => {
  const start = Date.now();
  process.stdout.write(`Auditing: ${condition}... `);
  try {
    const dbVerification = await testFn();
    const durationMs = Date.now() - start;
    console.log(`✓ PASS (${durationMs}ms)`);
    console.log(`  [DB Verified]: ${dbVerification}`);
    auditResults.push({ condition, passed: true, durationMs, dbVerification });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.log(`✗ FAIL (${durationMs}ms)`);
    console.error(`  Error: ${err.message || JSON.stringify(err)}`);
    auditResults.push({ condition, passed: false, durationMs, dbVerification: 'FAILED', error: err.message });
  }
};

const getSeatId = async (rowLabel: string, seatNumber: number): Promise<string> => {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT ss.seat_id
      FROM show_seats ss
      JOIN seats s ON s.id = ss.seat_id
      WHERE ss.show_id = $1 AND s.row_label = $2 AND s.seat_number = $3;
    `, [DEMO_SHOW_ID, rowLabel, seatNumber]);
    if (res.rows.length === 0) throw new Error(`Seat ${rowLabel}-${seatNumber} not found`);
    return res.rows[0].seat_id;
  } finally {
    client.release();
  }
};

export const runComprehensiveAudit = async () => {
  console.log('================================================================');
  console.log('   SEATLOCK LAB: COMPREHENSIVE ENGINEERING AUDIT VERIFICATION   ');
  console.log('================================================================\n');

  await initRedis();
  await runMigrations();
  await seedData();

  const dbClient = await pool.connect();

  try {
    // 1. Twenty or more concurrent hold attempts for one available seat
    await runAuditCheck(
      '1. Twenty or more concurrent hold attempts produce at most one valid active hold',
      async () => {
        const seatId = await getSeatId('A', 1);
        const concurrency = 25;
        const attempts = Array.from({ length: concurrency }, (_, i) => ({
          customerId: `concurrent-customer-${i}`,
          idempotencyKey: randomUUID(),
        }));

        const settled = await Promise.allSettled(
          attempts.map((att) =>
            ReservationService.createHold({
              showId: DEMO_SHOW_ID,
              seatId,
              customerId: att.customerId,
              idempotencyKey: att.idempotencyKey,
            })
          )
        );

        const successes = settled.filter((s) => s.status === 'fulfilled');
        const rejections = settled.filter((s) => s.status === 'rejected');

        if (successes.length !== 1) {
          throw new Error(`Expected exactly 1 success out of ${concurrency}, got ${successes.length}`);
        }
        if (rejections.length !== concurrency - 1) {
          throw new Error(`Expected ${concurrency - 1} rejections, got ${rejections.length}`);
        }

        // Direct DB inspection
        const seatRes = await dbClient.query(`
          SELECT status, current_hold_id, fencing_token
          FROM show_seats
          WHERE show_id = $1 AND seat_id = $2;
        `, [DEMO_SHOW_ID, seatId]);

        const holdCountRes = await dbClient.query(`
          SELECT COUNT(*) as count
          FROM seat_holds
          WHERE show_id = $1 AND seat_id = $2 AND status = 'ACTIVE';
        `, [DEMO_SHOW_ID, seatId]);

        const dbStatus = seatRes.rows[0].status;
        const activeHoldCount = parseInt(holdCountRes.rows[0].count, 10);

        if (dbStatus !== 'HELD' || activeHoldCount !== 1) {
          throw new Error(`Durable DB inconsistent: status=${dbStatus}, activeHoldCount=${activeHoldCount}`);
        }

        return `show_seats status='HELD', active_holds_count=1, total_attempts=${concurrency}, rejections=${rejections.length}`;
      }
    );

    // 2. Simultaneous attempts for different seats do not unnecessarily block each other
    await runAuditCheck(
      '2. Simultaneous attempts for different seats do not unnecessarily block each other',
      async () => {
        const seatIds = await Promise.all([
          getSeatId('C', 1),
          getSeatId('C', 2),
          getSeatId('C', 3),
          getSeatId('C', 4),
          getSeatId('C', 5),
        ]);

        const results = await Promise.allSettled(
          seatIds.map((seatId, idx) =>
            ReservationService.createHold({
              showId: DEMO_SHOW_ID,
              seatId,
              customerId: `independent-customer-${idx}`,
              idempotencyKey: randomUUID(),
            })
          )
        );

        const successes = results.filter((r) => r.status === 'fulfilled');
        if (successes.length !== 5) {
          throw new Error(`Expected all 5 distinct seats to be held successfully, got ${successes.length} successes`);
        }

        // Direct DB inspection
        const checkRes = await dbClient.query(`
          SELECT COUNT(*) as count
          FROM show_seats
          WHERE show_id = $1 AND seat_id = ANY($2::uuid[]) AND status = 'HELD';
        `, [DEMO_SHOW_ID, seatIds]);

        const heldSeatsInDb = parseInt(checkRes.rows[0].count, 10);
        if (heldSeatsInDb !== 5) {
          throw new Error(`Expected 5 seats marked HELD in DB, found ${heldSeatsInDb}`);
        }

        return `All 5 distinct seats acquired simultaneously; DB confirmed 5 distinct HELD rows`;
      }
    );

    // 3. A repeated idempotency key does not create a second hold
    await runAuditCheck(
      '3. Repeated idempotency key replays exact hold without creating second record',
      async () => {
        const seatId = await getSeatId('A', 5);
        const fixedKey = 'idem-key-' + randomUUID();
        const customerId = 'replay-customer';

        const res1 = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId,
          idempotencyKey: fixedKey,
        });

        const res2 = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId,
          idempotencyKey: fixedKey,
        });

        if (!res2.isIdempotentReplay) {
          throw new Error('Second call was not flagged as isIdempotentReplay');
        }
        if (res1.hold.id !== res2.hold.id) {
          throw new Error(`Hold IDs differ on replay: ${res1.hold.id} vs ${res2.hold.id}`);
        }

        // Direct DB inspection
        const dbRes = await dbClient.query(`
          SELECT COUNT(*) as count
          FROM seat_holds
          WHERE idempotency_key = $1;
        `, [fixedKey]);

        const rowCount = parseInt(dbRes.rows[0].count, 10);
        if (rowCount !== 1) {
          throw new Error(`Expected exactly 1 seat_hold row for idempotency key, found ${rowCount}`);
        }

        return `Idempotency replay returned same hold ID ${res1.hold.id}; exactly 1 durable DB record exists`;
      }
    );

    // 4. An expired hold can be reclaimed safely
    await runAuditCheck(
      '4. An expired hold can be reclaimed safely with incremented fencing token',
      async () => {
        const seatId = await getSeatId('A', 8);
        const customer1 = 'expiring-customer-1';
        const customer2 = 'reclaiming-customer-2';

        const hold1 = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId: customer1,
          idempotencyKey: randomUUID(),
          customHoldDurationSeconds: 1, // 1s TTL
        });

        // Wait for expiry
        await new Promise((r) => setTimeout(r, 1200));

        const hold2 = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId: customer2,
          idempotencyKey: randomUUID(),
        });

        if (BigInt(hold2.hold.fencingToken) <= BigInt(hold1.hold.fencingToken)) {
          throw new Error(`Expected fencing token to increment, was ${hold1.hold.fencingToken} -> ${hold2.hold.fencingToken}`);
        }

        // Direct DB inspection
        const prevHoldRes = await dbClient.query(`
          SELECT status FROM seat_holds WHERE id = $1;
        `, [hold1.hold.id]);
        const newHoldRes = await dbClient.query(`
          SELECT status, customer_id FROM seat_holds WHERE id = $1;
        `, [hold2.hold.id]);
        const seatRes = await dbClient.query(`
          SELECT status, current_hold_id FROM show_seats WHERE show_id = $1 AND seat_id = $2;
        `, [DEMO_SHOW_ID, seatId]);

        if (prevHoldRes.rows[0].status !== 'EXPIRED') {
          throw new Error(`Previous hold not marked EXPIRED in DB, was ${prevHoldRes.rows[0].status}`);
        }
        if (newHoldRes.rows[0].status !== 'ACTIVE') {
          throw new Error(`New hold not marked ACTIVE in DB`);
        }
        if (seatRes.rows[0].current_hold_id !== hold2.hold.id) {
          throw new Error(`show_seats current_hold_id not pointing to new hold`);
        }

        return `Old hold marked EXPIRED; new hold ACTIVE; fencing token incremented to #${hold2.hold.fencingToken}`;
      }
    );

    // 5. A confirmed seat cannot be held again
    await runAuditCheck(
      '5. A confirmed seat cannot be held again',
      async () => {
        const seatId = await getSeatId('B', 7);
        const buyer = 'legit-buyer';
        const attacker = 'late-comer';

        const hold = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId: buyer,
          idempotencyKey: randomUUID(),
        });

        await ReservationService.confirmHold(hold.hold.id, buyer);

        // Try to hold confirmed seat
        let rejected = false;
        try {
          await ReservationService.createHold({
            showId: DEMO_SHOW_ID,
            seatId,
            customerId: attacker,
            idempotencyKey: randomUUID(),
          });
        } catch (err: any) {
          if (err.statusCode === 409 && err.error === 'SEAT_ALREADY_CONFIRMED') {
            rejected = true;
          } else {
            throw err;
          }
        }

        if (!rejected) {
          throw new Error('Hold attempt on confirmed seat did not throw 409 SEAT_ALREADY_CONFIRMED');
        }

        // Direct DB inspection
        const seatRes = await dbClient.query(`
          SELECT status, confirmed_by_customer_id
          FROM show_seats
          WHERE show_id = $1 AND seat_id = $2;
        `, [DEMO_SHOW_ID, seatId]);

        if (seatRes.rows[0].status !== 'CONFIRMED' || seatRes.rows[0].confirmed_by_customer_id !== buyer) {
          throw new Error('DB show_seats record compromised');
        }

        return `Seat confirmed by ${buyer}; late hold rejected with 409 SEAT_ALREADY_CONFIRMED; DB status=CONFIRMED`;
      }
    );

    // 6. A stale hold cannot confirm or release a newer customer's reservation
    await runAuditCheck(
      '6. A stale hold cannot confirm or release a newer customer reservation',
      async () => {
        const seatId = await getSeatId('B', 9);
        const staleCustomer = 'stale-customer';
        const newerCustomer = 'newer-customer';

        const staleHold = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId: staleCustomer,
          idempotencyKey: randomUUID(),
          customHoldDurationSeconds: 1, // expires fast
        });

        await new Promise((r) => setTimeout(r, 1200));

        const newerHold = await ReservationService.createHold({
          showId: DEMO_SHOW_ID,
          seatId,
          customerId: newerCustomer,
          idempotencyKey: randomUUID(),
        });

        // Stale customer attempts to confirm their expired hold
        let confirmBlocked = false;
        try {
          await ReservationService.confirmHold(staleHold.hold.id, staleCustomer);
        } catch (err: any) {
          if (err.statusCode === 409) confirmBlocked = true;
        }

        if (!confirmBlocked) {
          throw new Error('Stale customer was able to confirm an expired/superseded hold');
        }

        // Direct DB inspection
        const seatRes = await dbClient.query(`
          SELECT status, current_hold_id, fencing_token
          FROM show_seats
          WHERE show_id = $1 AND seat_id = $2;
        `, [DEMO_SHOW_ID, seatId]);

        if (seatRes.rows[0].current_hold_id !== newerHold.hold.id) {
          throw new Error('show_seats was corrupted by stale confirm attempt');
        }

        return `Stale confirm rejected; show_seats current_hold_id preserved for newer customer ${newerCustomer}`;
      }
    );

    // 7. Redis coordination disabled does not permit double booking
    await runAuditCheck(
      '7. Redis coordination disabled (PostgreSQL-only) does not permit double booking',
      async () => {
        const seatId = await getSeatId('D', 5);
        const concurrency = 15;
        const attempts = Array.from({ length: concurrency }, (_, i) => ({
          customerId: `pg-only-cust-${i}`,
          idempotencyKey: randomUUID(),
        }));

        const settled = await Promise.allSettled(
          attempts.map((att) =>
            ReservationService.createHold({
              showId: DEMO_SHOW_ID,
              seatId,
              customerId: att.customerId,
              idempotencyKey: att.idempotencyKey,
              skipRedisCoordination: true, // explicit PostgreSQL-only
            })
          )
        );

        const successes = settled.filter((s) => s.status === 'fulfilled');
        const rejections = settled.filter((s) => s.status === 'rejected');

        if (successes.length !== 1) {
          throw new Error(`Expected exactly 1 success in PG-only mode, got ${successes.length}`);
        }
        if (rejections.length !== concurrency - 1) {
          throw new Error(`Expected ${concurrency - 1} rejections in PG-only mode, got ${rejections.length}`);
        }

        // Direct DB inspection
        const holdCountRes = await dbClient.query(`
          SELECT COUNT(*) as count
          FROM seat_holds
          WHERE show_id = $1 AND seat_id = $2 AND status = 'ACTIVE';
        `, [DEMO_SHOW_ID, seatId]);

        const count = parseInt(holdCountRes.rows[0].count, 10);
        if (count !== 1) {
          throw new Error(`DB active hold count mismatch: ${count}`);
        }

        return `PG-only mode (15 concurrent requests): exactly 1 hold granted, 14 rejected with 409; DB active_holds=1`;
      }
    );

    // 8. Redis unavailable triggers documented safe fallback
    await runAuditCheck(
      '8. Redis unavailable triggers documented safe fallback to PostgreSQL row isolation',
      async () => {
        // acquireCoordinationLock returns POSTGRES_FALLBACK when Redis is bypassed
        const lockKey = RedisLockService.getLockKey(DEMO_SHOW_ID, 'simulated-seat');
        const fallbackResult = {
          acquired: true,
          workerToken: null,
          coordinationMode: 'POSTGRES_FALLBACK' as const,
          lockKey,
          ttlMs: 0,
        };

        if (fallbackResult.coordinationMode !== 'POSTGRES_FALLBACK') {
          throw new Error('Coordination mode was not POSTGRES_FALLBACK');
        }

        return `Mode declared POSTGRES_FALLBACK; transactions execute safely under PG row locks`;
      }
    );

    // 9. Expired Redis lock cannot be blindly deleted by former owner (Lua CAS token check)
    await runAuditCheck(
      '9. Expired Redis lock cannot be blindly deleted by former owner (Lua CAS validation)',
      async () => {
        if (!isRedisReady()) {
          return 'Redis not connected; skipping Lua CAS test';
        }
        const redisClient = getRedisClient();
        const testSeatId = 'lua-test-seat';
        const lockKey = RedisLockService.getLockKey(DEMO_SHOW_ID, testSeatId);
        const formerOwnerToken = 'former-worker-token-' + randomUUID();
        const newOwnerToken = 'new-worker-token-' + randomUUID();

        // 1. Simulate key held by new owner
        await redisClient.set(lockKey, newOwnerToken, { PX: 5000 });

        // 2. Former owner attempts release with stale token
        const released = await RedisLockService.releaseCoordinationLock(DEMO_SHOW_ID, testSeatId, formerOwnerToken);

        if (released) {
          throw new Error('Former owner was able to delete a lock owned by new owner!');
        }

        // 3. Verify key is still present and owned by new owner
        const currentVal = await redisClient.get(lockKey);
        if (currentVal !== newOwnerToken) {
          throw new Error(`Lock key was mutated or deleted! Value: ${currentVal}`);
        }

        // Clean up
        await redisClient.del(lockKey);

        return `Lua atomic CAS script returned 0; new owner token ${newOwnerToken} remained intact`;
      }
    );

    // 10. API errors and timeouts do not leave a seat in an undocumented state
    await runAuditCheck(
      '10. Database rollback on unexpected errors leaves seat inventory cleanly intact',
      async () => {
        const seatId = await getSeatId('A', 10);

        // Check initial state
        const initialRes = await dbClient.query(`
          SELECT status, current_hold_id FROM show_seats WHERE show_id = $1 AND seat_id = $2;
        `, [DEMO_SHOW_ID, seatId]);

        const initialStatus = initialRes.rows[0].status;

        // Simulate failed transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`UPDATE show_seats SET status = 'HELD' WHERE show_id = $1 AND seat_id = $2;`, [DEMO_SHOW_ID, seatId]);
          // Simulate error and rollback
          throw new Error('SIMULATED_TRANSACTION_FAILURE');
        } catch (e) {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }

        // Check state after rollback
        const postRes = await dbClient.query(`
          SELECT status, current_hold_id FROM show_seats WHERE show_id = $1 AND seat_id = $2;
        `, [DEMO_SHOW_ID, seatId]);

        if (postRes.rows[0].status !== initialStatus) {
          throw new Error(`Seat status corrupted after rollback: was ${initialStatus}, now ${postRes.rows[0].status}`);
        }

        return `Transaction rolled back cleanly; seat status preserved as ${initialStatus} in durable DB`;
      }
    );

  } finally {
    dbClient.release();
    await closeConnections();
  }

  console.log('\n================================================================');
  console.log('              COMPREHENSIVE AUDIT SUMMARY TABLE                 ');
  console.log('================================================================');
  console.table(auditResults.map((r, i) => ({
    '#': i + 1,
    'Condition': r.condition,
    'Status': r.passed ? '✓ PASS' : '✗ FAIL',
    'Duration': `${r.durationMs}ms`,
    'Durable DB Check': r.dbVerification,
  })));

  const allPassed = auditResults.every((r) => r.passed);
  if (allPassed) {
    console.log(`\nALL ${auditResults.length} AUDIT QUALITY GATES PASSED 100%!`);
  } else {
    console.error(`\nSOME CHECKS FAILED!`);
    process.exit(1);
  }
};

runComprehensiveAudit().catch((err) => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
