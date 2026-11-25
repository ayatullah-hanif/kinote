% runPairedDemo: SYNTHETIC demonstration of the paired camera + EMG analysis. Nothing here is a real
% measurement. It checks that pairedOnset recovers a lag that we put in on purpose, so the same code
% can be run on a real recording (camera and EMG on one clock) when hardware is available.
rng(4);
lead = 0.080;                                   % the muscle fires 80 ms before the burst of movement begins
tA = (0:0.1:20)';
angle = 110 + 60 * cos(2 * pi * tA / 2.5);      % 8 bends, each starts at t = 0, 2.5, 5, ...
fsE = 500;
tE = (0:1/fsE:20)';
emg = 5 * randn(size(tE));
for k = 1:7
    t0 = 2.5 * k - lead;
    w = tE >= t0 & tE < t0 + 0.8;
    emg(w) = emg(w) + 40 * randn(nnz(w), 1);
end
R = pairedOnset(tA, angle, tE, emg);
disp(R)
fprintf("SYNTHETIC. Median lag found: %.0f ms. The camera is sampled at 10 frames per second and the angle needs a moment to fall 5 degrees, so expect roughly %.0f ms, give or take 100 ms.\n", ...
    median(R.emg_leads_ms, "omitnan"), 1000 * lead + 200);
