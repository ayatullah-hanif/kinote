function pre = preprocessRecording(rec)
% Pick the motor EEG and forearm EMG channels by name, then filter them.
labels = rec.labels;
fs = rec.fs;

% Channel names differ between files, so look each one up by name.
iEegL = find(ismember(labels, ["C3","FCC3"]), 1);
iEegR = find(ismember(labels, ["C4","FCC4"]), 1);
iEmgL = find(ismember(labels, ["LH","left EDC"]), 1);
iEmgR = find(ismember(labels, ["RH","right EDC"]), 1);
assert(~isempty(iEegL) && ~isempty(iEegR) && ~isempty(iEmgL) && ~isempty(iEmgR), ...
    "Could not find the expected channels in this file.");

rawEeg = rec.data(:, [iEegL iEegR]);
rawEmg = rec.data(:, [iEmgL iEmgR]);

% EEG: keep 1 to 40 Hz.
[bE, aE] = butter(4, [1 40]/(fs/2), "bandpass");
eeg = filtfilt(bE, aE, rawEeg);

% EMG: remove 50 Hz mains hum, then keep 20 to 200 Hz.
[bN, aN] = iirnotch(50/(fs/2), (50/(fs/2))/35);
[bM, aM] = butter(4, [20 200]/(fs/2), "bandpass");
emg = filtfilt(aN*0+bN, aN, rawEmg);
emg = filtfilt(bM, aM, emg);

pre = struct("file", rec.file, "fs", fs, "t", (0:size(eeg,1)-1)'/fs, ...
    "eeg", eeg, "emg", emg, "rawEmg", rawEmg, ...
    "eegNames", ["EEG_left" "EEG_right"], "emgNames", ["EMG_left" "EMG_right"], ...
    "events", rec.events);
end