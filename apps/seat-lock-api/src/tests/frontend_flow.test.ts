import { pool, initRedis, closeConnections } from '../config/db.js';
import { ReservationService } from '../services/reservationService.js';
import { runMigrations } from '../db/migrate.js';
import { seedData, DEMO_SHOW_ID } from '../db/seed.js';
import { randomUUID } from 'crypto';

export const runFrontendFlowTest = async () => {
  console.log('================================================================');
  console.log('   SEATLOCK LAB: FRONTEND WORKFLOW & CLIENT INTERACTION AUDIT   ');
  console.log('================================================================\n');

  await initRedis();
  await runMigrations();
  await seedData();

  const client = await pool.connect();

  try {
    // 1. Loading the seat map
    console.log('Step 1: Loading seat map for demo show...');
    const seats = await ReservationService.getShowSeats(DEMO_SHOW_ID);
    if (seats.length !== 40) throw new Error(`Expected 40 seats, got ${seats.length}`);
    const available = seats.filter((s: any) => s.status === 'AVAILABLE').length;
    console.log(`  ✓ Venue topology loaded: 40 seats total, ${available} available.\n`);

    // 2. Holding and releasing a seat
    console.log('Step 2: Holding and releasing Seat A-2...');
    const seatA2 = seats.find((s: any) => s.rowLabel === 'A' && s.seatNumber === 2);
    const holdRes = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId: seatA2.seatId,
      customerId: 'demo-customer-alpha',
      idempotencyKey: randomUUID(),
    });
    console.log(`  ✓ Hold acquired by Alpha: Hold ID ${holdRes.hold.id}, token #${holdRes.hold.fencingToken}`);

    // Verify DB state
    const heldDb = await client.query('SELECT status FROM show_seats WHERE show_id = $1 AND seat_id = $2', [DEMO_SHOW_ID, seatA2.seatId]);
    if (heldDb.rows[0].status !== 'HELD') throw new Error('Seat not HELD in DB');

    // Release
    const releaseRes = await ReservationService.releaseHold(holdRes.hold.id, 'demo-customer-alpha');
    console.log(`  ✓ Hold released explicitly: ${releaseRes.message}`);

    const releasedDb = await client.query('SELECT status, current_hold_id FROM show_seats WHERE show_id = $1 AND seat_id = $2', [DEMO_SHOW_ID, seatA2.seatId]);
    if (releasedDb.rows[0].status !== 'AVAILABLE' || releasedDb.rows[0].current_hold_id !== null) {
      throw new Error('Seat not returned to AVAILABLE in DB');
    }
    console.log('  ✓ DB state confirmed: Seat A-2 returned to AVAILABLE.\n');

    // 3. Running concurrent customer requests (Alpha vs Beta)
    console.log('Step 3: Running concurrent customer requests for Seat B-5...');
    const seatB5 = seats.find((s: any) => s.rowLabel === 'B' && s.seatNumber === 5);
    const [alphaAttempt, betaAttempt] = await Promise.allSettled([
      ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId: seatB5.seatId,
        customerId: 'demo-customer-alpha',
        idempotencyKey: randomUUID(),
      }),
      ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId: seatB5.seatId,
        customerId: 'demo-customer-beta',
        idempotencyKey: randomUUID(),
      }),
    ]);

    const successes = [alphaAttempt, betaAttempt].filter((r) => r.status === 'fulfilled');
    const failures = [alphaAttempt, betaAttempt].filter((r) => r.status === 'rejected');

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(`Expected exactly 1 winner and 1 loser, got ${successes.length} wins and ${failures.length} losses`);
    }
    console.log('  ✓ Concurrent race completed: Exactly 1 winner (201) and 1 loser (409).');

    // Verify trace in responses
    const winnerResult = (successes[0] as PromiseFulfilledResult<any>).value;
    const loserResult = (failures[0] as PromiseRejectedResult).reason;
    console.log(`  ✓ Winner trace steps: ${winnerResult.executionTrace.map((t: any) => t.step).join(' -> ')}`);
    console.log(`  ✓ Loser trace steps: ${loserResult.executionTrace.map((t: any) => t.step).join(' -> ')}\n`);

    // 4. Watching expiry and attempting to confirm expired hold
    console.log('Step 4: Testing hold expiry & confirmation rejection on Seat C-7...');
    const seatC7 = seats.find((s: any) => s.rowLabel === 'C' && s.seatNumber === 7);
    const shortHold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId: seatC7.seatId,
      customerId: 'demo-customer-alpha',
      idempotencyKey: randomUUID(),
      customHoldDurationSeconds: 1, // 1 second TTL
    });
    console.log(`  ✓ Short hold created (1s TTL): Hold ID ${shortHold.hold.id}`);

    console.log('  Waiting 1.2s for lease to expire...');
    await new Promise((r) => setTimeout(r, 1200));

    let confirmBlocked = false;
    try {
      await ReservationService.confirmHold(shortHold.hold.id, 'demo-customer-alpha');
    } catch (err: any) {
      if (err.statusCode === 409 && err.error === 'HOLD_EXPIRED') {
        confirmBlocked = true;
      }
    }

    if (!confirmBlocked) throw new Error('Expired hold was mistakenly confirmed!');
    console.log('  ✓ Expired hold confirmation properly rejected with 409 HOLD_EXPIRED.\n');

    // 5. Confirming active hold & rejecting subsequent hold on confirmed seat
    console.log('Step 5: Confirming active hold and rejecting re-reservation on Seat D-3...');
    const seatD3 = seats.find((s: any) => s.rowLabel === 'D' && s.seatNumber === 3);
    const validHold = await ReservationService.createHold({
      showId: DEMO_SHOW_ID,
      seatId: seatD3.seatId,
      customerId: 'demo-customer-alpha',
      idempotencyKey: randomUUID(),
    });

    const confirmRes = await ReservationService.confirmHold(validHold.hold.id, 'demo-customer-alpha');
    if (confirmRes.status !== 'CONFIRMED') throw new Error('Hold confirmation failed');
    console.log(`  ✓ Hold confirmed successfully: Seat permanently marked ${confirmRes.status}.`);

    let reHoldBlocked = false;
    try {
      await ReservationService.createHold({
        showId: DEMO_SHOW_ID,
        seatId: seatD3.seatId,
        customerId: 'demo-customer-beta',
        idempotencyKey: randomUUID(),
      });
    } catch (err: any) {
      if (err.statusCode === 409 && err.error === 'SEAT_ALREADY_CONFIRMED') {
        reHoldBlocked = true;
      }
    }

    if (!reHoldBlocked) throw new Error('Confirmed seat was mistakenly held again!');
    console.log('  ✓ Re-reservation of confirmed seat rejected with 409 SEAT_ALREADY_CONFIRMED.\n');

    // 6. Resetting demonstration state
    console.log('Step 6: Resetting demonstration show topology...');
    await client.query('BEGIN');
    await client.query('DELETE FROM hold_audit_events WHERE show_id = $1;', [DEMO_SHOW_ID]);
    await client.query('DELETE FROM seat_holds WHERE show_id = $1;', [DEMO_SHOW_ID]);
    await client.query(`
      UPDATE show_seats
      SET status = 'AVAILABLE', current_hold_id = NULL, hold_expires_at = NULL,
          confirmed_at = NULL, confirmed_by_customer_id = NULL, fencing_token = 1
      WHERE show_id = $1;
    `, [DEMO_SHOW_ID]);
    await client.query('COMMIT');

    const resetSeats = await ReservationService.getShowSeats(DEMO_SHOW_ID);
    const allAvailable = resetSeats.every((s: any) => s.status === 'AVAILABLE');
    if (!allAvailable) throw new Error('Not all seats available after reset');
    console.log('  ✓ Demonstration topology successfully reset: All 40 seats AVAILABLE.\n');

    console.log('================================================================');
    console.log('   ALL 6 FRONTEND WORKFLOW STEPS VERIFIED 100% SUCCESSFULLY!   ');
    console.log('================================================================');
  } finally {
    client.release();
    await closeConnections();
  }
};

runFrontendFlowTest().catch((err) => {
  console.error('Frontend flow test failed:', err);
  process.exit(1);
});
