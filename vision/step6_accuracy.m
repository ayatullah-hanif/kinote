sh = 7; el = 9; wr = 11;           % right arm
disp("Hold your pose. Picture in 5 seconds...")
pause(5)
cam = webcam;
img = snapshot(cam);
clear cam
det = hrnetObjectKeypointDetector("human-full-body-w32");
bbox = [1 1 size(img,2) size(img,1)];
[kp, sc, ~] = detect(det, img, bbox);
kp = kp(:,:,1);
sc = sc(:,1);
cameraAngle = jointAngle(kp(sh,:), kp(el,:), kp(wr,:))
lowestScore = min(sc([sh el wr]))
imshow(img); hold on
plot(kp([sh el wr],1), kp([sh el wr],2), "g-o", "LineWidth", 2)