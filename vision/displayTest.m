cam = webcam;
img = snapshot(cam);
fig = figure;
ax1 = subplot(1,2,1); h1 = image(ax1, img); axis(ax1, "image"); axis(ax1, "off");
ax2 = subplot(1,2,2); small = imresize(img, 0.25);
h2 = image(ax2, small); axis(ax2, "image"); axis(ax2, "off");
txt = text(ax1, 10, 25, "", "Color", "y", "FontSize", 16);
ln = line(ax1, nan, nan, "Color", "g", "LineWidth", 3);
N = 10;
tIdle = zeros(N,1); tText = zeros(N,1); tLine = zeros(N,1);
tSmall = zeros(N,1); tFull = zeros(N,1);
for k = 1:N
    img = snapshot(cam);
    t = tic; drawnow; tIdle(k) = toc(t);
    t = tic; set(txt, "String", sprintf("Angle %d", k)); drawnow; tText(k) = toc(t);
    t = tic; set(ln, "XData", [10 100+k], "YData", [10 100]); drawnow; tLine(k) = toc(t);
    t = tic; set(h2, "CData", imresize(img, 0.25)); drawnow; tSmall(k) = toc(t);
    t = tic; set(h1, "CData", img); drawnow; tFull(k) = toc(t);
end
clear cam
fprintf("idle %.0f ms, text %.0f ms, line %.0f ms, quarter-size picture %.0f ms, full picture %.0f ms (medians)\n", ...
    1000*median(tIdle), 1000*median(tText), 1000*median(tLine), 1000*median(tSmall), 1000*median(tFull));