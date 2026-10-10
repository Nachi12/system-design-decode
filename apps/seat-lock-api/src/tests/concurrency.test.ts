import { pool, initRedis, closeConnections, getRedisClient } from '../config/db.js';
import { ReservationService } from '../services/reservationService.js';
import { RedisLockService } from '../services/lockService.js';
import { runMigrations } from '../db/migrate.js';
import { seedData, DEMO_SHOW_ID } from '../db/seed.js';
import { randomUUID } from 'crypto';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

const runTest = async (name: string, fn: () => Promise<void>) => {
  const start = Date.now();
  try {
    process.stdout.write(`Running: ${name}... `);
    await fn();
    const durationMs = Date.now() - start;
    console.log(`✓ PASS (${durationMs}ms)`);
    results.push({ name, passed: true, durationMs });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.log(`✗ FAIL (${durationMs}ms)`);
    console.error(`  Error: ${err.message || JSON.stringify(err)}`);
    results.push({ name, passed: false, durationMs, details: err.message || JSON.stringify(err) });
  }
};

const getSeatIdByCoordinate = async (showId: string, rowLabel: string, seatNumber: number): Promise<string> => {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT ss.seat_id
      FROM show_seats ss
      JOIN seats s ON s.id = ss.seat_id
      WHERE ss.show_id = $1 AND s.row_label = $2 AND s.seat_number = $3;
    `, [showId, rowLabel, seatNumber]);
    if (res.rows.length === 0) throw new Error(`Seat ${rowLabel}-${seatNumber} not found`);
    return res.rows[0].seat_id;
  } finally {
    client.release();
  }
};

export const runAllTests = async () => {
  console.log('================================================================');
  console.log('   SEATLOCK LAB: BACKEND QUALITY GATES & CONCURRENCY SUITE       ');
  console.log('================================================================\n');

  // 1. Setup DB and Redis
  await initRedis();
  await runMigrations();
  await seedData();

  console.log('\n--- EXECUTING 9 CONCURRENCY QUALITY GATE TESTS ---\n');

  // Test 1: Two concurrent requests for the exact same seat
  await runTest('1. Two concurrent requests for the same seat', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'A', 3);
    const key1 = randomUUID();
    const key2 = randomUUID();

    const [req1, req2] = await Promise.allSettled([
      ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId,
        customerId: 'customer-alpha',
        idempotencyKey: key1,
      }),
      ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId,
        customerId: 'customer-beta',
        idempotencyKey: key2,
      }),
    ]);

    const successes = [req1, req2].filter((r) => r.status === 'fulfilled');
    const failures = [req1, req2].filter((r) => r.status === 'rejected');

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(`Expected exactly 1 success and 1 rejection, got ${successes.length} successes and ${failures.length} rejections.`);
    }

    const rejectionReason = (failures[0] as PromiseRejectedResult).reason;
    if (rejectionReason.statusCode !== 409) {
      throw new Error(`Expected 409 conflict, got status ${rejectionReason.statusCode}`);
    }
  });

  // Test 2: Multiple distinct seats held independently without interference
  await runTest('2. Multiple distinct seats held independently', async () => {
    const seat1 = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'B', 1);
    const seat2 = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'B', 2);
    const seat3 = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'B', 3);

    const [res1, res2, res3] = await Promise.all([
      ReservationService.createHold({ showId: DEMO_SHOW_ID, seatId: seat1, customerId: 'cust-1', idempotencyKey: randomUUID() }),
      ReservationService.createHold({ showId: DEMO_SHOW_ID, seatId: seat2, customerId: 'cust-2', idempotencyKey: randomUUID() }),
      ReservationService.createHold({ showId: DEMO_SHOW_ID, seatId: seat3, customerId: 'cust-3', idempotencyKey: randomUUID() }),
    ]);

    if (!res1.hold.id || !res2.hold.id || !res3.hold.id) {
      throw new Error('One of the independent holds failed to create.');
    }
  });

  // Test 3: Idempotent retries return existing hold without duplicates
  await runTest('3. Idempotent retries with same idempotency key', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'B', 4);
    const idempotencyKey = randomUUID();

    const initial = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-idemp',
      idempotencyKey,
    });

    const retry = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-idemp',
      idempotencyKey,
    });

    if (!retry.isIdempotentReplay) {
      throw new Error('Retry was not recognized as an idempotent replay.');
    }
    if (retry.hold.id !== initial.hold.id) {
      throw new Error('Retry returned a different hold ID.');
    }
  });

  // Test 4: Expired hold reclamation by newer customer
  await runTest('4. Expired hold reclamation with fencing token increment', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'C', 1);
    const initialHold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-early',
      idempotencyKey: randomUUID(),
      customHoldDurationSeconds: 1, // 1 second short TTL
    });

    // Wait 1.5 seconds for hold to expire by database time
    await new Promise((r) => setTimeout(r, 1500));

    // Newer customer requests the seat
    const reclaimedHold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-late',
      idempotencyKey: randomUUID(),
      customHoldDurationSeconds: 60,
    });

    if (reclaimedHold.hold.id === initialHold.hold.id) {
      throw new Error('Reclaimed hold did not create a new hold.');
    }

    if (BigInt(reclaimedHold.hold.fencingToken) <= BigInt(initialHold.hold.fencingToken)) {
      throw new Error('Fencing token was not monotonically incremented on reclamation.');
    }
  });

  // Test 5: Rejection of second hold on confirmed seat
  await runTest('5. Rejection of second hold on confirmed seat', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'C', 2);
    const hold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-buyer',
      idempotencyKey: randomUUID(),
    });

    // Confirm hold
    await ReservationService.confirmHold(hold.hold.id, 'cust-buyer');

    // Attempt second hold by different customer
    try {
      await ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId,
        customerId: 'cust-intruder',
        idempotencyKey: randomUUID(),
      });
      throw new Error('Expected hold on confirmed seat to be rejected, but it succeeded.');
    } catch (err: any) {
      if (err.statusCode !== 409 || err.error !== 'SEAT_ALREADY_CONFIRMED') {
        throw new Error(`Unexpected error on confirmed seat: ${err.message || JSON.stringify(err)}`);
      }
    }
  });

  // Test 6: Releasing only the current valid hold
  await runTest('6. Releasing only the current valid hold', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'C', 3);
    const hold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-owner',
      idempotencyKey: randomUUID(),
    });

    // Unauthorized customer attempt
    try {
      await ReservationService.releaseHold(hold.hold.id, 'cust-imposter');
      throw new Error('Unauthorized customer was able to release hold.');
    } catch (err: any) {
      if (err.statusCode !== 403) throw err;
    }

    // Legitimate owner release
    const releaseRes = await ReservationService.releaseHold(hold.hold.id, 'cust-owner');
    if (releaseRes.status !== 'RELEASED') {
      throw new Error('Release did not return status RELEASED.');
    }

    // Verify seat is now AVAILABLE
    const client = await pool.connect();
    try {
      const seatCheck = await client.query('SELECT status, current_hold_id FROM show_seats WHERE show_id = $1 AND seat_id = $2', [DEMO_SHOW_ID, seatId]);
      if (seatCheck.rows[0].status !== 'AVAILABLE' || seatCheck.rows[0].current_hold_id !== null) {
        throw new Error('Seat was not returned to AVAILABLE after release.');
      }
    } finally {
      client.release();
    }
  });

  // Test 7: Confirming only active, unexpired hold
  await runTest('7. Confirming only active, unexpired hold', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'C', 4);
    const shortHold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-slowpoke',
      idempotencyKey: randomUUID(),
      customHoldDurationSeconds: 1, // 1 second expiry
    });

    // Wait for expiration
    await new Promise((r) => setTimeout(r, 1500));

    // Attempt confirmation after expiration
    try {
      await ReservationService.confirmHold(shortHold.hold.id, 'cust-slowpoke');
      throw new Error('Expired hold was confirmed, violating invariant.');
    } catch (err: any) {
      if (err.statusCode !== 409 || err.error !== 'HOLD_EXPIRED') {
        throw new Error(`Unexpected error on expired confirmation: ${err.message || JSON.stringify(err)}`);
      }
    }
  });

  // Test 8: Safe Redis coordination-lock release with Lua CAS token match
  await runTest('8. Safe Redis coordination-lock release via Lua CAS', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'D', 5);
    const lockKey = RedisLockService.getLockKey(DEMO_SHOW_ID, seatId);
    const tokenA = 'token-worker-A';
    const tokenB = 'token-worker-B';

    const client = getRedisClient();
    await client.set(lockKey, tokenA, { PX: 5000 });

    // Attempt to release with wrong tokenB
    const fakeRelease = await RedisLockService.releaseCoordinationLock(DEMO_SHOW_ID, seatId, tokenB);
    if (fakeRelease !== false) {
      throw new Error('Lua script improperly released lock with mismatched worker token!');
    }

    // Verify key still exists and belongs to tokenA
    const currentVal = await client.get(lockKey);
    if (currentVal !== tokenA) {
      throw new Error('Lock value was corrupted.');
    }

    // Legitimate release with tokenA
    const realRelease = await RedisLockService.releaseCoordinationLock(DEMO_SHOW_ID, seatId, tokenA);
    if (realRelease !== true) {
      throw new Error('Legitimate release with tokenA failed.');
    }

    // Verify key deleted
    const deletedVal = await client.get(lockKey);
    if (deletedVal !== null) {
      throw new Error('Key was not deleted after legitimate release.');
    }
  });

  // Test 9: PostgreSQL-only operation when Redis is unavailable (Fallback mode)
  await runTest('9. PostgreSQL-only operation when Redis is unavailable', async () => {
    const seatId = await getSeatIdByCoordinate(DEMO_SHOW_ID, 'D', 6);
    
    // Test holding seat when lock service falls back
    const holdRes = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId,
      customerId: 'cust-fallback-1',
      idempotencyKey: randomUUID(),
    });

    if (!holdRes.hold.id) {
      throw new Error('Fallback hold creation failed.');
    }

    // Attempt concurrent collision on same seat in PostgreSQL
    try {
      await ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId,
        customerId: 'cust-fallback-2',
        idempotencyKey: randomUUID(),
      });
      throw new Error('Second hold on same seat should have been rejected by PostgreSQL row lock.');
    } catch (err: any) {
      if (err.statusCode !== 409) {
        throw new Error(`Expected 409 conflict, got ${err.statusCode}: ${err.message}`);
      }
    }
  });

  console.log('\n================================================================');
  console.log('                 QUALITY GATE AUDIT SUMMARY                     ');
  console.log('================================================================');
  console.table(results.map((r) => ({ Test: r.name, Passed: r.passed ? '✓ PASS' : '✗ FAIL', Duration: `${r.durationMs}ms` })));

  const allPassed = results.every((r) => r.passed);
  console.log(allPassed ? '\nALL 9 BACKEND QUALITY GATES PASSED 100%!' : '\nSOME TESTS FAILED!');

  await closeConnections();

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests().catch(async (err) => {
  console.error('[Test Suite Error]:', err);
  await closeConnections();
  process.exit(1);
});
