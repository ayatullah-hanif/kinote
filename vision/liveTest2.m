sh = 7; el = 9; wr = 11;           % right arm
det = hrnetObjectKeypointDetector("human-full-body-w32");
cam = webcam;
img = snapshot(cam);
fig = figure; ax = axes(fig);
h = image(ax, imresize(img, 0.5));
axis(ax, "image"); axis(ax, "off");
txt = text(ax, 5, 15, "", "Color", "y", "FontSize", 14, "FontWeight", "bold");
ln = line(ax, nan, nan, "Color", "g", "LineWidth", 3);
redrawEvery = 3;                   % redraw the screen every 3rd frame
t0 = tic; n = 0; nShown = 0;
while toc(t0) < 15 && isvalid(fig)
    img = snapshot(cam);
    [kp, sc, ~] = detect(det, img, [1 1 size(img,2) size(img,1)]);
    kp = kp(:,:,1); sc = sc(:,1);
    ang = jointAngle(kp(sh,:), kp(el,:), kp(wr,:));
    n = n + 1;
    if mod(n, redrawEvery) == 0
        set(h, "CData", imresize(img, 0.5));
        set(ln, "XData", kp([sh el wr],1)/2, "YData", kp([sh el wr],2)/2);
        set(txt, "String", sprintf("Elbow %.0f deg  conf %.2f", ang, min(sc([sh el wr]))));
        drawnow
        nShown = nShown + 1;
    end
end
clear cam
fprintf("Tracking %.1f frames per second, screen refreshed %.1f times per second\n", ...
    n / toc(t0), nShown / toc(t0));