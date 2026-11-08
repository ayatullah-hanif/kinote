videoFile = "elbow_01.avi";    % change to .avi if that is what was saved
sh = 7; el = 9; wr = 11;       % your right arm; use 6, 8, 10 for your left
minScore = 0.5;
stepFrames = 1;                % analyse every 2nd frame
maxSeconds = Inf;                % test on 5 seconds first; change to Inf later

v = VideoReader(videoFile);
fprintf("Video frame rate: %.1f fps\n", v.FrameRate);
det = hrnetObjectKeypointDetector("human-full-body-w32");
nMax = ceil(v.Duration * v.FrameRate) + 5;
angles = nan(nMax, 1);
scores = nan(nMax, 1);
times  = nan(nMax, 1);
k = 0; frameNo = 0;
tStart = tic;
while hasFrame(v) && frameNo / v.FrameRate < maxSeconds
    img = readFrame(v);
    frameNo = frameNo + 1;
    if mod(frameNo, stepFrames) ~= 0
        continue
    end
    k = k + 1;
    bbox = [1 1 size(img,2) size(img,1)];
    [kp, sc, ~] = detect(det, img, bbox);
    kp = kp(:,:,1);
    sc = sc(:,1);
    scores(k) = min(sc([sh el wr]));
    times(k) = (frameNo - 1) / v.FrameRate;
    if scores(k) >= minScore
        angles(k) = jointAngle(kp(sh,:), kp(el,:), kp(wr,:));
    end
    if mod(k, 10) == 0
        fprintf("%d frames done, %.0f s elapsed\n", k, toc(tStart));
    end
end
angles = angles(1:k); scores = scores(1:k); times = times(1:k);
fprintf("Finished: %d frames in %.0f s\n", k, toc(tStart));
figure; plot(times, angles, "-o");
xlabel("Time (s)"); ylabel("Elbow angle (degrees)"); grid on