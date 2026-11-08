# Reliability-Aware EEG-EMG Stroke Rehabilitation Platform (research prototype)

Not a medical device. All patient data used here is public, de-identified research data.

## Folders and owners (edit this table to match your team)
| Folder | Contents | Owner |
|---|---|---|
| biomedical/ | loaders, filters, features, quality indices, dataset audit | |
| fusion/ | ordinary fusion, quality-aware fusion, abstention | |
| vision/ | pose keypoints, joint angles, repetition counting | |
| apps/ | PatientApp.mlapp, TherapistApp.mlapp | |
| integration/ | data contract (makeRecording), adapters | |
| database/ | SQLite schema and helpers | |
| tests/ | unit tests | |
| docs/ | decisions, data notes, write-up | |

## Team rules
1. One owner per folder. Do not edit files in someone else's folder: message them or open a branch.
2. Each .mlapp file has exactly one editor. App files are binary and cannot be merged.
3. Work on your own branch (feat/<area>), pull before you push, commit small and often.
4. Data never goes in Git. It lives in the shared data folder; set your path in config/dataroot.txt.
5. Every data source returns the struct from integration/makeRecording.m.
6. Log every threshold, exclusion and assumption in docs/decisions.md.

## First run
1. Open the folder as a MATLAB project, then run `setupProject`
2. Run `checkEnvironment`
3. Run `createSchema("database/rehab.db")`

## Dataset overview and sample audit

One recording was inspected using `edfinfo` and loaded with `edfread`.
Signals and annotations loaded successfully; conversion to `.mat` was unnecessary.
The results below describe this sample, not the entire dataset.

### Dataset overview

| Item | Details |
|---|---|
| Dataset | Multisession fNIRS-EEG Data of Post-Stroke Motor Recovery: Recordings During Intact and Paretic Hand Movements |
| Published scope | 16 post-stroke participants; 84 rehabilitation sessions |
| Tasks | Intact- and paretic-hand motor tasks |
| Available information | Physiological recordings, demographics, ARAT and Fugl-Meyer assessments |
| Source | [Dataset publication](https://doi.org/10.1038/s41597-026-06803-5) |

### Sample audit

| Property | Result |
|---|---|
| Recording | `L_01_session2_left1.edf` |
| Channels | 11 total |
| Brain-related labels | `F7`, `F3`, `F4`, `F8`, `C3`, `C4`, `A1`, `A2`; reference roles require confirmation |
| Muscle channels | `right EDC`, `left EDC` |
| Cardiac channel | `EKG` |
| Units | Microvolts (`uV`) |
| Sampling rate | 500 Hz for every channel |
| Duration | 159 seconds |
| Samples checked | 79,500 in the first channel, consistent with duration and sampling rate |
| Continuity | Declared continuous (`EDF+C`) |
| Annotations | Timestamped `flash_l` and `flash_r` cues loaded |
| Raw recording | Preserved unchanged |

This initial audit verifies import and basic metadata.
