setupProject
auditDir = fileparts(which("sessionInsights"));
root = fileparts(fileparts(auditDir));          % the kinote folder
outDir = fullfile(root, "web", "data");
if ~isfolder(outDir), mkdir(outDir); end

% 1. Copy the result files that are already CSV
copyfile(fullfile(auditDir, "fusion_results.csv"), outDir);
copyfile(fullfile(auditDir, "fusion_results_degraded.csv"), outDir);
copyfile(fullfile(auditDir, "degradation_results_25pct.csv"), outDir);
copyfile(fullfile(auditDir, "degradation_results_50pct.csv"), outDir);
storeDir = fullfile(root, "database", "store");
copyfile(fullfile(storeDir, "patients.csv"), outDir);
copyfile(fullfile(storeDir, "exercises.csv"), outDir);
copyfile(fullfile(auditDir, "features_all.csv"), outDir);

% 2. Run sessionInsights for every patient and session, clean and degraded
sources = {"clean", "fusion_results.csv"; "degraded", "fusion_results_degraded.csv"};
rows = table();
for s = 1:size(sources, 1)
    R = readtable(fullfile(auditDir, sources{s, 2}));
    R.patient = string(R.patient);
    R.state = string(R.state);
    R.file = string(R.file);
    pairs = unique(R(:, ["patient", "session"]), "rows");
    for i = 1:height(pairs)
        lines = sessionInsights(R, pairs.patient(i), pairs.session(i));
        for j = 1:numel(lines)
            ln = lines(j);
            tag = "Note";
            if startsWith(ln, "[Measured]")
                tag = "Measured";
            elseif startsWith(ln, "[Model estimate]")
                tag = "Model estimate";
            end
            txt = regexprep(ln, "^\[[^\]]+\]\s*", "");
            rows = [rows; table(string(sources{s, 1}), pairs.patient(i), pairs.session(i), j, tag, txt, ...
                'VariableNames', {'mode','patient','session','line_no','tag','text'})]; %#ok<AGROW>
        end
    end
end
writetable(rows, fullfile(outDir, "insights.csv"), "QuoteStrings", true);

% 3. Report what was written
disp("Written to: " + outDir)
listing = struct2table(dir(outDir));
disp(listing(:, ["name", "bytes"]))
fprintf("insights rows: %d\n", height(rows));
tabulate(categorical(rows.mode))