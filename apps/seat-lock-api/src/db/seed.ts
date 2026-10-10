import { pool } from '../config/db.js';
import { fileURLToPath } from 'url';

export const DEMO_SHOW_ID = '00000000-0000-0000-0000-000000000001';
export const AUDITORIUM_NAME = 'IMAX Laser Hall 1';

export const seedData = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('[Seed] Seeding deterministic demo show and seat topology...');
    await client.query('BEGIN');

    // 1. Create or reset demo show
    await client.query(`
      INSERT INTO shows (id, title, auditorium_name, start_time)
      VALUES ($1, 'Oppenheimer: 70mm IMAX Screening', $2, NOW() + INTERVAL '2 days')
      ON CONFLICT (id) DO UPDATE 
      SET title = EXCLUDED.title, start_time = EXCLUDED.start_time;
    `, [DEMO_SHOW_ID, AUDITORIUM_NAME]);

    // Clean up holds and reset seat inventory state
    await client.query(`DELETE FROM hold_audit_events WHERE show_id = $1;`, [DEMO_SHOW_ID]);
    await client.query(`DELETE FROM seat_holds WHERE show_id = $1;`, [DEMO_SHOW_ID]);
    await client.query(`
      UPDATE show_seats 
      SET status = 'AVAILABLE', current_hold_id = NULL, hold_expires_at = NULL, 
          confirmed_at = NULL, confirmed_by_customer_id = NULL, fencing_token = 1
      WHERE show_id = $1;
    `, [DEMO_SHOW_ID]);

    // 2. Generate 40 deterministic seats across 4 tiers
    const rows = [
      { label: 'A', tier: 'VIP', count: 10 },
      { label: 'B', tier: 'PREMIUM', count: 10 },
      { label: 'C', tier: 'STANDARD', count: 10 },
      { label: 'D', tier: 'STANDARD', count: 10 },
    ];

    for (const row of rows) {
      for (let num = 1; num <= row.count; num++) {
        // Deterministic seat insert
        const seatRes = await client.query(`
          INSERT INTO seats (auditorium_name, row_label, seat_number, tier)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (auditorium_name, row_label, seat_number) 
          DO UPDATE SET tier = EXCLUDED.tier
          RETURNING id;
        `, [AUDITORIUM_NAME, row.label, num, row.tier]);

        const seatId = seatRes.rows[0].id;

        // Deterministic show_seats inventory insert
        await client.query(`
          INSERT INTO show_seats (show_id, seat_id, status, fencing_token)
          VALUES ($1, $2, 'AVAILABLE', 1)
          ON CONFLICT (show_id, seat_id) DO NOTHING;
        `, [DEMO_SHOW_ID, seatId]);
      }
    }

    await client.query('COMMIT');
    console.log('[Seed] Deterministic seed completed: 1 show, 40 seats configured.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]: Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedData()
    .then(() => {
      console.log('[Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}
