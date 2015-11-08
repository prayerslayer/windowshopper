WITH ui_update AS (
     UPDATE ui
        SET u_id = $1,
            u_url = $2,
            u_last_modified = NOW()
      WHERE u_id = $1
  RETURNING *)
INSERT INTO ui (
            u_id,
            u_url)
     SELECT $1,
            $2
      WHERE NOT EXISTS (SELECT * FROM ui_update);
