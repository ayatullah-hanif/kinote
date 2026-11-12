det = hrnetObjectKeypointDetector("human-full-body-w32");
cam = webcam;
img = snapshot(cam);
fig = figure; ax = axes(fig); h = image(ax, img);
axis(ax, "image"); axis(ax, "off");
N = 15;
tSnap = zeros(N,1); tDet = zeros(N,1); tSmall = zeros(N,1); tShow = zeros(N,1);
for k = 1:N
    t = tic; img = snapshot(cam); tSnap(k) = toc(t);
    t = tic; detect(det, img, [1 1 size(img,2) size(img,1)]); tDet(k) = toc(t);
    small = imresize(img, 0.5);
    t = tic; detect(det, small, [1 1 size(small,2) size(small,1)]); tSmall(k) = toc(t);
    t = tic; set(h, "CData", img); drawnow; tShow(k) = toc(t);
end
clear cam
fprintf("snapshot %.0f ms, detect %.0f ms, detect at half size %.0f ms, display %.0f ms (medians)\n", ...
    1000*median(tSnap), 1000*median(tDet), 1000*median(tSmall), 1000*median(tShow));