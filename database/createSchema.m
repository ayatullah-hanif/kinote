function createSchema(dbFile)
% CREATESCHEMA  Creates the local SQLite database shared by the patient and
% therapist apps. Safe to run more than once. Requires Database Toolbox.
% Demo only: password_hash is for a prototype login, not real security.
if nargin < 1
    dbFile = "database/rehab.db";
end
dbFile = string(dbFile);
folder = fileparts(dbFile);
if strlength(folder) > 0 && ~isfolder(folder)
    mkdir(folder);
end

if isfile(dbFile)
    conn = sqlite(dbFile, "connect");
else
    conn = sqlite(dbFile, "create");
end
cleanup = onCleanup(@() close(conn));

stmts = [
"CREATE TABLE IF NOT EXISTS users (user_id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('patient','clinician')), name TEXT, password_hash TEXT)"
"CREATE TABLE IF NOT EXISTS patients (patient_id TEXT PRIMARY KEY, user_id TEXT, display_code TEXT, affected_side TEXT, created_at TEXT)"
"CREATE TABLE IF NOT EXISTS clinicians (clinician_id TEXT PRIMARY KEY, user_id TEXT, name TEXT)"
"CREATE TABLE IF NOT EXISTS patient_clinicians (patient_id TEXT, clinician_id TEXT, PRIMARY KEY (patient_id, clinician_id))"
"CREATE TABLE IF NOT EXISTS exercises (exercise_id TEXT PRIMARY KEY, name TEXT, instructions TEXT, target_reps INTEGER)"
"CREATE TABLE IF NOT EXISTS prescriptions (prescription_id TEXT PRIMARY KEY, patient_id TEXT, exercise_id TEXT, clinician_id TEXT, sets INTEGER, schedule TEXT, created_at TEXT)"
"CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, patient_id TEXT, exercise_id TEXT, started_at TEXT, completed INTEGER, difficulty INTEGER, caregiver_note TEXT, source_type TEXT)"
"CREATE TABLE IF NOT EXISTS movement_results (result_id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, repetitions INTEGER, mean_range_deg REAL, duration_s REAL, landmark_visibility REAL, source_type TEXT)"
"CREATE TABLE IF NOT EXISTS physiological_results (result_id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, modality TEXT, feature_name TEXT, value REAL, source_type TEXT, recording_file TEXT)"
"CREATE TABLE IF NOT EXISTS signal_quality (result_id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, modality TEXT, quality REAL, flags TEXT, source_type TEXT)"
"CREATE TABLE IF NOT EXISTS fusion_results (result_id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, model TEXT, estimate REAL, variance REAL, w_eeg REAL, w_emg REAL, status TEXT CHECK(status IN ('issued','provisional','withheld')), source_type TEXT)"
"CREATE TABLE IF NOT EXISTS clinical_reviews (review_id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, clinician_id TEXT, comment TEXT, created_at TEXT)"
"CREATE TABLE IF NOT EXISTS messages (message_id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id TEXT, recipient_id TEXT, body TEXT, sent_at TEXT, is_read INTEGER DEFAULT 0)"
];

for k = 1:numel(stmts)
    execute(conn, stmts(k));
end
fprintf("Schema ready: %s (%d tables)\n", dbFile, numel(stmts));
end
