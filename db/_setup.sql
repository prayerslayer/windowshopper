CREATE TABLE ui (
    u_id TEXT PRIMARY KEY, -- yourturn
    u_url TEXT NOT NULL,   -- yourturn.example.com
    u_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    u_last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);