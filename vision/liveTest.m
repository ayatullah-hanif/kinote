sh = 7; el = 9; wr = 11;           % right arm
det = hrnetObjectKeypointDetector("human-full-body-w32");
cam = webcam;
img = snapshot(cam);
fig = figure; ax = axes(fig);
h = image(ax, img);
axis(ax, "image"); axis(ax, "off");
txt = text(ax, 10, 25, "", "Color", "y", "FontSize", 16, "FontWeight", "bold");
ln = line(ax, nan, nan, "Color", "g", "LineWidth", 3);
t0 = tic; n = 0;
while toc(t0) < 15 && isvalid(fig)
    img = snapshot(cam);
    [kp, sc, ~] = detect(det, img, [1 1 size(img,2) size(img,1)]);
    kp = kp(:,:,1); sc = sc(:,1);
    ang = jointAngle(kp(sh,:), kp(el,:), kp(wr,:));
    set(h, "CData", img);
    set(ln, "XData", kp([sh el wr],1), "YData", kp([sh el wr],2));
    set(txt, "String", sprintf("Elbow %.0f deg   conf %.2f", ang, min(sc([sh el wr]))));
    drawnow
    n = n + 1;
end
clear cam
fprintf("Achieved %.1f frames per second\n", n / toc(t0));