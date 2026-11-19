function [reps, rom, idx, smooth] = countReps(angles, times)
% The repetition-counting rules from analyzeElbowVideo, as a testable function.
% A repetition is a dip at least half the range of motion deep, at least 0.8 s from the next.
angles = angles(:); times = times(:);
good = angles(~isnan(angles));
reps = 0; rom = NaN; idx = []; smooth = angles;
if numel(good) < 5, return, end
fs = 1 / median(diff(times));
rom = prctile(good, 95) - prctile(good, 5);
smooth = movmean(angles, 3, "omitnan");
x = smooth;
x(isnan(x)) = median(good);
[~, idx] = findpeaks(-x, "MinPeakProminence", 0.5 * rom, "MinPeakDistance", round(0.8 * fs));
reps = numel(idx);
end
