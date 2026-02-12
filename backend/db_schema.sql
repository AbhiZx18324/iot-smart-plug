-- Telemetry
CREATE TABLE inference (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plug_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,

    predicted_appliance TEXT NOT NULL,
    confidence REAL NOT NULL,

    model_version TEXT NOT NULL
);

-- Inference
CREATE TABLE inference (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plug_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,

    predicted_appliance TEXT NOT NULL,
    confidence REAL NOT NULL,

    model_version TEXT NOT NULL
);

-- Sessions
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plug_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    predicted_appliance TEXT
);


-- Indexes
CREATE INDEX idx_telemetry_time ON telemetry(plug_id, timestamp);
CREATE INDEX idx_inference_time ON inference(plug_id, timestamp);