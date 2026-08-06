import pool from "./db.js";

await pool.connect();
await pool.request().query(`
  IF COL_LENGTH('dbo.judge', 'event_id') IS NULL
  BEGIN
    ALTER TABLE dbo.judge ADD event_id INT NULL;
    ALTER TABLE dbo.judge ADD CONSTRAINT FK_judge_event
      FOREIGN KEY (event_id) REFERENCES dbo.events(event_id) ON DELETE CASCADE;
  END
`);
console.log("Judge assignment column is ready");
await pool.close();
