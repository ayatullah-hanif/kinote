function q = computeCueQuality(pre)
% Quality score (0 to 1) for each cue window, for each EMG and EEG channel.
fs = pre.fs;
ev = pre.events;
cues = ev(ev.label == "flash_l" | ev.label == "flash_r", :);
n = height(cues);
tEnd = pre.t(end);

baseRms = nan(n,2);
peakSig = nan(n,2);
sigEeg = 1.4826 * median(abs(pre.eeg - median(pre.eeg)));   % typical EEG size in this file

for k = 1:n
    t = cues.time_s(k);
    if t - 2 < 0 || t + 3 > tEnd
        continue
    end
    b = pre.t >= t-2 & pre.t < t;
    w = pre.t >= t-2 & pre.t < t+3;
    baseRms(k,:) = rms(pre.emg(b,:));
    peakSig(k,:) = max(abs(pre.eeg(w,:)), [], 1) ./ sigEeg;
end

baseRatio = baseRms ./ median(baseRms, 1, "omitnan");
qEmg = max(0, 1 - abs(log2(baseRatio)) / 2);
qEeg = min(1, max(0, 1 - (peakSig - 8) / 12));

q = table(cues.time_s, qEmg(:,1), qEmg(:,2), qEeg(:,1), qEeg(:,2), ...
    baseRatio(:,1), baseRatio(:,2), peakSig(:,1), peakSig(:,2), ...
    'VariableNames', {'cue_time','qEmgL','qEmgR','qEegL','qEegR', ...
    'emgL_baseRatio','emgR_baseRatio','eegL_peak','eegR_peak'});
end