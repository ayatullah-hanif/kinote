function [rec2, damaged] = damageExtra(rec, type, severity, fraction, seed)
% Four extra damage types, same interface as degradeRecording.
%   emg_pops:        brief large spikes on the muscle channels (loose-cable pops)
%   emg_hum:         100 and 150 Hz mains harmonics (the 50 Hz notch cannot remove these)
%   emg_attenuation: muscle signal scaled by severity (a weak electrode), e.g. 0.3
%   eeg_noise:       broadband noise on the brain channels
type = string(type);
rng(seed);
rec2 = rec;
fs = rec.fs;
ev = rec.events;
isCue = ev.label == "flash_l" | ev.label == "flash_r";
cueTimes = ev.time_s(isCue);
nCue = numel(cueTimes);
damaged = false(nCue, 1);
damaged(randperm(nCue, round(fraction * nCue))) = true;
iEmg = find(ismember(rec.labels, ["LH","left EDC","RH","right EDC"]));
iEeg = find(ismember(rec.labels, ["C3","FCC3","C4","FCC4"]));
nS = size(rec.data, 1);
for k = find(damaged)'
    a = max(1, round((cueTimes(k) - 2) * fs) + 1);
    b = min(nS, round((cueTimes(k) + 3) * fs));
    n = b - a + 1;
    tt = (0:n-1)' / fs;
    switch type
        case "emg_pops"
            for c = iEmg
                sd = robustSd(rec.data(:, c));
                s = zeros(n, 1);
                for j = 1:6
                    p = randi(max(1, n - 10));
                    m = min(10, n - p + 1);
                    s(p:p+m-1) = s(p:p+m-1) + (2 * randi(2) - 3) * severity * sd;
                end
                rec2.data(a:b, c) = rec2.data(a:b, c) + s;
            end
        case "emg_hum"
            for c = iEmg
                sd = robustSd(rec.data(:, c));
                ph = 2 * pi * rand;
                rec2.data(a:b, c) = rec2.data(a:b, c) + severity * sd * ...
                    (sin(2*pi*100*tt + ph) + 0.6 * sin(2*pi*150*tt + ph));
            end
        case "emg_attenuation"
            for c = iEmg
                x = rec.data(a:b, c);
                rec2.data(a:b, c) = mean(x) + severity * (x - mean(x));
            end
        case "eeg_noise"
            for c = iEeg
                rec2.data(a:b, c) = rec2.data(a:b, c) + severity * robustSd(rec.data(:, c)) * randn(n, 1);
            end
        otherwise
            error("Unknown damage type: %s", type);
    end
end
end

function v = robustSd(x)
v = 1.4826 * median(abs(x - median(x)));
end
