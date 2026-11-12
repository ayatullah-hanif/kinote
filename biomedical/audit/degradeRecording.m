function [rec2, damaged] = degradeRecording(rec, type, severity, fraction, seed)
% Damage some cue windows of a recording to mimic real recording problems.
%   type:     "emg_noise", "emg_dropout" or "eeg_spike"
%   severity: how strong (noise and spike size, as multiples of normal)
%   fraction: share of cues to damage (0 to 1)
%   seed:     any number, so the same cues get damaged every time
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
    switch type
        case "emg_noise"        % electrical noise on the muscle sensors
            for c = iEmg
                rec2.data(a:b, c) = rec2.data(a:b, c) + ...
                    severity * hfNoise(rec.data(:, c)) * randn(n, 1);
            end
        case "emg_dropout"      % loose electrode: signal goes nearly flat
            for c = iEmg
                rec2.data(a:b, c) = rec.data(a, c) + ...
                    0.2 * hfNoise(rec.data(:, c)) * randn(n, 1);
            end
        case "eeg_spike"        % movement or electrode pops on the brain sensors
            s = zeros(n, 1);
            len = round(0.5 * fs);
            for j = 1:4
                p = randi(max(1, n - len));
                m = min(len, n - p + 1);
                s(p:p+m-1) = s(p:p+m-1) + (2 * randi(2) - 3) * exp(-(0:m-1)' / (0.05 * fs));
            end
            for c = iEeg
                rec2.data(a:b, c) = rec2.data(a:b, c) + severity * slowSd(rec.data(:, c)) * s;
            end
        otherwise
            error("Unknown type: %s", type);
    end
end
end

function v = hfNoise(x)
% Typical fast-noise level of a channel
v = 1.4826 * median(abs(diff(x))) / sqrt(2);
end

function v = slowSd(x)
% Typical overall size of a channel
v = 1.4826 * median(abs(x - median(x)));
end