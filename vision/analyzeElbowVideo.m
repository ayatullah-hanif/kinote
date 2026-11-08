function [result, details] = analyzeElbowVideo(videoFile, side, maxSeconds)
% Analyse a video of elbow bends. Returns repetitions, range of motion,
% tracking visibility and a status.
arguments
    videoFile (1,1) string
    side (1,1) string = "right"
    maxSeconds (1,1) double = Inf
end
if side == "right"
    sh = 7; el = 9; wr = 11;
else
    sh = 6; el = 8; wr = 10;
end
minScore = 0.5;
minVisibility = 0.6;
edgeMargin = 15;                  % NEW: pixels from the picture edge

v = VideoReader(videoFile);
det = hrnetObjectKeypointDetector("human-full-body-w32");
nMax = ceil(v.Duration * v.FrameRate) + 5;
angles = nan(nMax, 1);
scores = nan(nMax, 1);
times  = nan(nMax, 1);
edgeHit = false(nMax, 1);         % NEW
k = 0;
while hasFrame(v) && k / v.FrameRate < maxSeconds
    img = readFrame(v);
    k = k + 1;
    W = size(img, 2);             % NEW
    H = size(img, 1);             % NEW
    bbox = [1 1 W H];
    [kp, sc, ~] = detect(det, img, bbox);
    kp = kp(:,:,1);
    sc = sc(:,1);
    p = kp([sh el wr], :);        % NEW: positions of shoulder, elbow, wrist
    edgeHit(k) = any(p(:,1) < edgeMargin | p(:,1) > W - edgeMargin | ...
        p(:,2) < edgeMargin | p(:,2) > H - edgeMargin);   % NEW
    scores(k) = min(sc([sh el wr]));
    times(k) = (k - 1) / v.FrameRate;
    if scores(k) >= minScore && ~edgeHit(k)      % CHANGED
        angles(k) = jointAngle(kp(sh,:), kp(el,:), kp(wr,:));
    end
end
angles = angles(1:k); scores = scores(1:k); times = times(1:k);
edgeHit = edgeHit(1:k);           % NEW

good = angles(~isnan(angles));
visibility = mean(~isnan(angles));
numReps = 0; rom = NaN; locs = [];
smoothAngle = angles;
if numel(good) >= 5
    fs = 1 / median(diff(times));
    rom = prctile(good, 95) - prctile(good, 5);
    smoothAngle = movmean(angles, 3, "omitnan");
    x = smoothAngle;
    x(isnan(x)) = median(good);
    [~, locs] = findpeaks(-x, "MinPeakProminence", 0.5*rom, ...
        "MinPeakDistance", round(0.8*fs));
    numReps = numel(locs);
end

status = "recorded";
if visibility < minVisibility
    status = "low_tracking_quality";
end
if status == "low_tracking_quality"
    numReps = NaN;
    rom = NaN;
    locs = [];
end
result = struct("repetitions", numReps, "range_of_motion_deg", rom, ...
    "visibility", visibility, "edge_fraction", mean(edgeHit), ...
    "status", status);                                  % CHANGED
details = struct("times", times, "angles", smoothAngle, ...
    "rep_idx", locs, "scores", scores, "edge", edgeHit);  % CHANGED
end