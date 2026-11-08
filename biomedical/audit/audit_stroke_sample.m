%% Initial audit of one stroke recording
% Requires Signal Processing Toolbox.
% Reads the original file without modifying it.

% Locate the repository root two levels above this script.
scriptFolder = fileparts(mfilename('fullpath'));
projectFolder = fileparts(fileparts(scriptFolder));
recordingName = "L_01_session2_left1.edf";

files = dir(fullfile(projectFolder, "**", recordingName));

assert(~isempty(files), ...
    "Recording not found. Upload it inside the project's data folder.");
assert(numel(files) == 1, ...
    "Multiple copies found. Keep one sample copy inside the project.");

filePath = fullfile(files(1).folder, files(1).name);
fprintf("Inspecting: %s\n", filePath);

%% Load recording metadata, signals and event annotations
info = edfinfo(filePath);
[signals, annotations] = edfread(filePath);

%% Inspect channel labels, units and sampling rates
sampleRates = info.NumSamples ./ seconds(info.DataRecordDuration);

channelSummary = table( ...
    string(info.SignalLabels(:)), ...
    string(info.PhysicalDimensions(:)), ...
    sampleRates(:), ...
    'VariableNames', {'Channel', 'Units', 'SamplesPerSecond'});

disp(channelSummary);

%% Inspect recording structure
fprintf("Number of channels: %d\n", info.NumSignals);
fprintf("Number of data records: %d\n", info.NumDataRecords);
fprintf("Seconds per data record: %.3f\n", ...
    seconds(info.DataRecordDuration));

fprintf("Recorded data duration: %.3f seconds\n", ...
    info.NumDataRecords * seconds(info.DataRecordDuration));

disp("Continuity information:");
disp(info.Reserved);

blockLengths = cellfun(@numel, signals{:,1});
fprintf("Total samples in first channel: %d\n", sum(blockLengths));

%% Inspect event annotations
disp("Event annotations:");
disp(annotations);

eventLabels = string(annotations.Annotations);

fprintf("Left-side cues: %d\n", sum(eventLabels == "flash_l"));
fprintf("Right-side cues: %d\n", sum(eventLabels == "flash_r"));
fprintf("Total annotations: %d\n", height(annotations));

% These events describe cues, not confirmed movements.
% Clinical scores, electrode mapping and signal quality remain to be audited.


%% Save audit results
outputFolder = fullfile(projectFolder, "audit_results");

if ~isfolder(outputFolder)
    mkdir(outputFolder);
end

[~, recordingID] = fileparts(filePath);

% Save channel information as a spreadsheet-readable CSV file.
writetable(channelSummary, ...
    fullfile(outputFolder, recordingID + "_channels.csv"));

% Preserve metadata and annotations in a MATLAB file.
save(fullfile(outputFolder, recordingID + "_audit.mat"), ...
    "info", "channelSummary", "annotations");

fprintf("Audit results saved in: %s\n", outputFolder);