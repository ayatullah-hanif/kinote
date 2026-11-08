function checkEnvironment()
% CHECKENVIRONMENT  Every team member runs this once. Send the output to the team.
fprintf("MATLAB release: %s\n\n", version("-release"));
v = ver;
names = string({v.Name});

needed = ["Signal Processing Toolbox", "Statistics and Machine Learning Toolbox", ...
          "Deep Learning Toolbox", "Computer Vision Toolbox", "Image Processing Toolbox", ...
          "Database Toolbox", "MATLAB Report Generator", "Wavelet Toolbox", ...
          "Sensor Fusion and Tracking Toolbox"];
for n = needed
    if any(names == n)
        status = "OK";
    else
        status = "MISSING";
    end
    fprintf("%-42s %s\n", n, status);
end

fprintf("\nWebcam (needs Chrome and camera permission): ");
try
    cams = webcamlist;
    fprintf("%d camera(s) found\n", numel(cams));
catch err
    fprintf("not available (%s)\n", err.message);
end

fprintf("SQLite (Database Toolbox): ");
if ~isempty(which("sqlite"))
    fprintf("OK\n");
else
    fprintf("MISSING\n");
end

fprintf("Pose model function: ");
if ~isempty(which("hrnetObjectKeypointDetector"))
    fprintf("found (model downloads on first use)\n");
else
    fprintf("MISSING\n");
end
end
