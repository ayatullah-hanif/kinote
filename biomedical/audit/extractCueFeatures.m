function feat = extractCueFeatures(pre)
% For each cue, compare a 2 s baseline before it with the 3 s after it.
fs = pre.fs;
ev = pre.events;
cues = ev(ev.label == "flash_l" | ev.label == "flash_r", :);
n = height(cues);
tEnd = pre.t(end);

side = strings(n,1);  t0 = zeros(n,1);
emgL = nan(n,2);  emgR = nan(n,2);      % columns: baseline, response (RMS)
muL = nan(n,2);   muR = nan(n,2);       % 8-12 Hz power
betaL = nan(n,2); betaR = nan(n,2);     % 13-30 Hz power

for k = 1:n
    t = cues.time_s(k);
    side(k) = cues.label(k);
    t0(k) = t;
    if t - 2 < 0 || t + 3 > tEnd
        continue   % window does not fit inside the recording
    end
    b = pre.t >= t-2 & pre.t < t;
    r = pre.t >= t   & pre.t < t+3;

    emgL(k,:) = [rms(pre.emg(b,1)) rms(pre.emg(r,1))];
    emgR(k,:) = [rms(pre.emg(b,2)) rms(pre.emg(r,2))];
    muL(k,:)  = [bandpower(pre.eeg(b,1), fs, [8 12]) bandpower(pre.eeg(r,1), fs, [8 12])];
    muR(k,:)  = [bandpower(pre.eeg(b,2), fs, [8 12]) bandpower(pre.eeg(r,2), fs, [8 12])];
    betaL(k,:) = [bandpower(pre.eeg(b,1), fs, [13 30]) bandpower(pre.eeg(r,1), fs, [13 30])];
    betaR(k,:) = [bandpower(pre.eeg(b,2), fs, [13 30]) bandpower(pre.eeg(r,2), fs, [13 30])];
end

pct = @(x) 100 * (x(:,2) - x(:,1)) ./ x(:,1);
feat = table(t0, side, ...
    emgL(:,2)./emgL(:,1), emgR(:,2)./emgR(:,1), ...
    pct(muL), pct(muR), pct(betaL), pct(betaR), ...
    'VariableNames', {'cue_time','cue','emgL_ratio','emgR_ratio', ...
    'muL_change','muR_change','betaL_change','betaR_change'});
end