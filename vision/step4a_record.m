seconds = 15;
cam = webcam;
disp("Get into position. Recording starts in 5 seconds...")
pause(5)
frames = {};
t0 = tic;
while toc(t0) < seconds
    frames{end+1} = snapshot(cam);
end
actualFps = numel(frames) / toc(t0)
clear cam

try
    vw = VideoWriter("elbow_bad2.mp4", "MPEG-4");
    vw.FrameRate = actualFps;
    open(vw);
catch
    vw = VideoWriter("elbow_bad2.avi", "Motion JPEG AVI");
    vw.FrameRate = actualFps;
    open(vw);
end
for k = 1:numel(frames)
    writeVideo(vw, frames{k});
end
close(vw)
disp("Saved " + vw.Filename)