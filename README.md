1. Sample Data Import
Uploaded L_01_session2_left1.edf from the stroke-recovery dataset to the project's data folder in MATLAB Online. Successfully inspected the recording using edfinfo and loaded its signals and event annotations using edfread.

Conversion to MATLAB's .mat format was unnecessary because MATLAB reads European Data Format (.edf) directly. The original recording was preserved unchanged. This initial check covered one recording run from patient 01, session 2, involving left-hand responses.
2. Initial Dataset Audit
Confirmed the following properties:

| Property | Verified result |
|---|---|
| Channels | 11 total |
| Brain-related channel labels | `F7`, `F3`, `F4`, `F8`, `C3`, `C4`, `A1`, `A2` |
| Muscle recordings | `right EDC` and `left EDC`, representing the extensor digitorum communis muscles |
| Heart recording | `EKG` |
| Signal units | Microvolts (`uV`) |
| Sampling rate | 500 samples per second for every channel |
| Recording duration | 159 seconds |
| Sample count | 79,500 samples verified in the first channel |
| Continuity | File declares continuous recording (`EDF+C`) |
| Event annotations | Timestamped `flash_l` and `flash_r` cues successfully loaded |