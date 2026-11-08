cam = webcam;
img = snapshot(cam);
clear cam
det = hrnetObjectKeypointDetector("human-full-body-w32");
bbox = [1 1 size(img,2) size(img,1)];
[kp, sc, valid] = detect(det, img, bbox);
disp(size(kp)); disp(size(sc))
kp = kp(:,:,1);
sc = sc(:,1);
imshow(img); hold on
plot(kp(:,1), kp(:,2), "g.", "MarkerSize", 20)
for j = 1:size(kp,1)
    text(kp(j,1)+6, kp(j,2), string(j), "Color", "y", "FontSize", 12);
end