function [rec2, damaged] = damageAny(rec, type, severity, fraction, seed)
% One entry point for every damage type, including "none".
type = string(type);
if type == "none"
    rec2 = rec;
    ev = rec.events;
    damaged = false(sum(ev.label == "flash_l" | ev.label == "flash_r"), 1);
    return
end
if ismember(type, ["emg_noise", "emg_dropout", "eeg_spike"])
    [rec2, damaged] = degradeRecording(rec, type, severity, fraction, seed);
else
    [rec2, damaged] = damageExtra(rec, type, severity, fraction, seed);
end
end
