function saveRunInfo(name, params)
% Saves when and how a script was run (date, MATLAB version, parameters).
P = researchPaths();
info = struct("script", string(name), ...
    "date", string(datetime("now", "Format", "yyyy-MM-dd HH:mm:ss")), ...
    "matlab", string(version), "params", params);
fid = fopen(fullfile(P.out, string(name) + "_runinfo.json"), "w");
fprintf(fid, "%s\n", jsonencode(info, "PrettyPrint", true));
fclose(fid);
end
