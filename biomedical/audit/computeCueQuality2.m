function q = computeCueQuality2(pre)
% Quality score v2 for every cue window. Each channel is judged by several independent
% checks and takes the WORST of them, and the failing check is named.
%  Muscle: level (baseline size), spikes (crest factor), spectrum (share of 100-200 Hz power)
%  Brain:  spikes (peak size), noise (share of 25-40 Hz power)
% Every check is compared with the typical value in the same recording.
fs = pre.fs;
ev = pre.events;
cues = ev(ev.label == "flash_l" | ev.label == "flash_r", :);
n = height(cues);
tEnd = pre.t(end);
lvl = nan(n,2); crest = nan(n,2); hf = nan(n,2); pk = nan(n,2); nz = nan(n,2);
sdE = 1.4826 * median(abs(pre.eeg - median(pre.eeg)));
for k = 1:n
    t = cues.time_s(k);
    if t - 2 < 0 || t + 3 > tEnd, continue, end
    b = pre.t >= t-2 & pre.t < t;
    w = pre.t >= t-2 & pre.t < t+3;
    for c = 1:2
        xe = pre.emg(w, c);
        lvl(k,c) = rms(pre.emg(b, c));
        crest(k,c) = max(abs(xe)) / max(rms(xe), eps);
        hf(k,c) = bandpower(xe, fs, [100 200]) / max(bandpower(xe, fs, [20 200]), eps);
        xg = pre.eeg(w, c);
        pk(k,c) = max(abs(xg)) / sdE(c);
        nz(k,c) = bandpower(xg, fs, [25 40]) / max(bandpower(xg, fs, [1 40]), eps);
    end
end
med = @(x) median(x, 1, "omitnan");
relDev = @(x) abs(log2(x ./ med(x)));
qLevel = clip01(1 - relDev(lvl) / 1.5);
qCrest = clip01(1 - (crest ./ med(crest) - 1.5) / 2);
qSpec  = clip01(1 - relDev(hf) / 1.5);
qPeak  = clip01(1 - (pk - 8) / 12);
qNoise = clip01(1 - max(0, log2(nz ./ med(nz))) / 1.5);
qEmg = min(min(qLevel, qCrest), qSpec);
qEeg = min(qPeak, qNoise);
[~, ie] = min(cat(3, qLevel, qCrest, qSpec), [], 3);
[~, ig] = min(cat(3, qPeak, qNoise), [], 3);
namesE = ["level"; "spikes"; "spectrum"];
namesG = ["spikes"; "noise"];
rEmgL = namesE(ie(:,1)); rEmgR = namesE(ie(:,2));
rEegL = namesG(ig(:,1)); rEegR = namesG(ig(:,2));
rEmgL(qEmg(:,1) >= 0.7) = "ok"; rEmgR(qEmg(:,2) >= 0.7) = "ok";
rEegL(qEeg(:,1) >= 0.7) = "ok"; rEegR(qEeg(:,2) >= 0.7) = "ok";
rEmgL(isnan(qEmg(:,1))) = "n/a"; rEmgR(isnan(qEmg(:,2))) = "n/a";
rEegL(isnan(qEeg(:,1))) = "n/a"; rEegR(isnan(qEeg(:,2))) = "n/a";
q = table(cues.time_s, qEmg(:,1), qEmg(:,2), qEeg(:,1), qEeg(:,2), ...
    rEmgL, rEmgR, rEegL, rEegR, ...
    'VariableNames', {'cue_time','q2EmgL','q2EmgR','q2EegL','q2EegR', ...
                      'why2EmgL','why2EmgR','why2EegL','why2EegR'});
end

function y = clip01(x)
y = min(1, max(0, x));
y(isnan(x)) = NaN;
end
