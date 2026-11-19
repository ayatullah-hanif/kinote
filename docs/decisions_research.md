## Research additions (paste into docs/decisions.md)

Status key: GUESS = starting value, not tuned. SET = chosen from one small check. MEASURED = derived from data.

| Decision | Value | Status | Why / where |
|---|---|---|---|
| Abstention cut-off for the current system | trust below 0.6 | GUESS | `fuseCues`; replaced by a data-chosen cut-off in `runRiskControl` |
| Quality v1 | baseline-level ratio (EMG), peak size (EEG), trust = mean of the two | GUESS | `computeCueQuality`; mean lets one good modality hide a bad one |
| Quality v2 | worst of several named checks per channel | GUESS | `computeCueQuality2`; EMG level, spikes, spectrum; EEG spikes, noise |
| Damage held out of design | emg_pops, emg_hum, emg_attenuation, eeg_noise | SET | `sweepConditions`; never used to design v1 or v2 |
| Damage share | 25% of cues per recording | SET | 50% breaks the method (file-level median becomes damaged) |
| Error definition | wrong if (fused > 1) differs from the cue label; abstained cues are never counted as correct | SET | errors, answered share and withheld share are reported separately |
| Risk-controlled abstention | target error 15/20/25%, confidence 90%, 20 coverage levels, Bonferroni | SET | `riskControlThreshold`; assumes independent cues, so tested on a held-out patient |
| Minimal detectable change | 1.96 x combined SE from repeat recordings in the same session | MEASURED | `runMDC`; repeats are assumed to measure the same underlying state |
| Flatness flag | below 0.85 (about 32 degrees out of plane) | GUESS | `flatnessScore`; tested in `runTiltExperiment` |
| Rep counting | dip at least half the range deep, 0.8 s apart | SET | `countReps`, tuned on one clean clip |

Limits: 4 dataset patients, 94 recordings, simulated damage, labels come from the cue protocol and not from confirmed movements. The camera and the EEG/EMG come from different people.
