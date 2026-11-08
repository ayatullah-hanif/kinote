fs = 1 / median(diff(times));
fprintf("Sampling rate: %.1f samples per second\n", fs)

good = angles(~isnan(angles));
rom = prctile(good, 95) - prctile(good, 5);
fprintf("Range of motion: %.0f degrees\n", rom)

smoothAngle = movmean(angles, 3, "omitnan");
x = smoothAngle;
x(isnan(x)) = median(good);

[~, locs] = findpeaks(-x, "MinPeakProminence", 0.5*rom, "MinPeakDistance", round(0.8*fs));
numReps = numel(locs)
visibility = mean(~isnan(angles))

figure; plot(times, smoothAngle, "-"); hold on
plot(times(locs), smoothAngle(locs), "ro", "MarkerSize", 10, "LineWidth", 2)
xlabel("Time (s)"); ylabel("Elbow angle (degrees)"); grid on
title(sprintf("%d repetitions, visibility %.0f%%", numReps, 100*visibility))