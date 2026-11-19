% runTiltExperiment: protractor test for the camera angle when the arm turns away from
% the camera. 8 poses: flat, then turned about 20, 40 and 60 degrees (twice each), with
% the elbow kept near 90 degrees. For each pose a helper reads the real angle. Checks
% whether the camera error grows with tilt and whether the flatness score notices it.
P = researchPaths();
sh = 7; el = 9; wr = 11;               % right arm; use 6, 8, 10 for the left arm
tilts = [0 0 20 20 40 40 60 60];
n = numel(tilts);
det = hrnetObjectKeypointDetector("human-full-body-w32");
cam = webcam;
realAng = nan(n,1); camAng = nan(n,1); lens = nan(n,2); lowest = nan(n,1);
fprintf("Keep your elbow at about 90 degrees the whole time. Pose 1 and 2: arm flat to the camera.\n");
for i = 1:n
    fprintf("\nPose %d of %d: turn your body about %d degrees away from the camera.\n", i, n, tilts(i));
    realAng(i) = input("Hold the pose. When your helper has read the protractor, type the real angle and press Enter: ");
    fprintf("Hold still. Picture in 4 seconds...\n");
    pause(4);
    img = snapshot(cam);
    [kp, sc, ~] = detect(det, img, [1 1 size(img,2) size(img,1)]);
    kp = double(kp(:,:,1)); sc = sc(:,1);
    camAng(i) = jointAngle(kp(sh,:), kp(el,:), kp(wr,:));
    lens(i,:) = [norm(kp(el,:) - kp(sh,:)), norm(kp(wr,:) - kp(el,:))];
    lowest(i) = double(min(sc([sh el wr])));
end
clear cam
ref = max(lens, [], 1);
flat = flatnessScore(lens, ref);
err = camAng - realAng;
flagged = flat < 0.85;
bigErr = abs(err) > 5;
R = table(tilts', realAng, camAng, err, flat, flagged, lowest, ...
    'VariableNames', {'tilt_deg','real_deg','camera_deg','error_deg','flatness','flagged','lowest_confidence'});
disp(R)
fprintf("Errors over 5 degrees: %d of %d poses. Flatness flag raised on %d of them.\n", sum(bigErr), n, sum(flagged & bigErr));
fprintf("Flag raised on %d of %d poses with errors of 5 degrees or less.\n", sum(flagged & ~bigErr), sum(~bigErr));
cc = corrcoef(flat, abs(err));
fprintf("Correlation between flatness and absolute error: %.2f (negative = less flat, more error)\n", cc(1,2));
writetable(R, fullfile(P.out, "tilt_experiment.csv"));
writetable(R, fullfile(P.web, "tilt_experiment.csv"));
saveRunInfo("runTiltExperiment", struct("tilts", tilts, "flagBelow", 0.85));
