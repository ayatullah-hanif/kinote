function rec = loadEdfRecording(filePath)
% Load one EDF recording: samples-by-channels data, sampling rate,
% channel labels, and the list of events (cues, flagged bad stretches).
info = edfinfo(filePath);
[signals, ann] = edfread(filePath);

labels = string(info.SignalLabels(:))';
fs = info.NumSamples(1) / seconds(info.DataRecordDuration);
nCh = numel(labels);

first = signals{:,1};
n = numel(vertcat(first{:}));
data = zeros(n, nCh);
for k = 1:nCh
    c = signals{:,k};
    data(:,k) = vertcat(c{:});
end

events = table(seconds(ann.Onset), string(ann.Annotations), seconds(ann.Duration), ...
    'VariableNames', {'time_s', 'label', 'duration_s'});

rec = struct('file', string(filePath), 'fs', fs, 'labels', labels, ...
    'data', data, 'events', events);
end