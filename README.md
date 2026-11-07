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
