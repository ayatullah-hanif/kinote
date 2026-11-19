% runSweep: HEAVY STEP, run once. Damages every recording in 8 ways (clean + 7 damage
% types), recomputes features and both quality scores, and caches one file per recording.
% Safe to stop and re-run: finished recordings are skipped. Stops itself after
% maxMinutes so MATLAB Online does not disconnect; just run it again until it finishes.
P = researchPaths();
C = sweepConditions();
maxMinutes = 25;
files = dir(fullfile(P.audit, "*.edf"));
nF = numel(files); nC = height(C);
failed = strings(0,1);
tStart = tic;
warning("off", "all")
for i = 1:nF
    nm = string(files(i).name);
    cacheFile = fullfile(P.cache, replace(nm, ".edf", ".mat"));
    if isfile(cacheFile), continue, end
    if toc(tStart) > 60 * maxMinutes
        fprintf("Time limit reached. Run runSweep again to continue.\n");
        break
    end
    try
        rec = loadEdfRecording(fullfile(P.audit, nm));
        tok = regexp(nm, '^([LR]_\d+)_session(\d+)_(left|right)(\d+)\.edf$', 'tokens', 'once');
        rows = table();
        for c = 1:nC
            [rec2, dmg] = damageAny(rec, C.type(c), C.severity(c), C.fraction(c), i);
            pre = preprocessRecording(rec2);
            f = extractCueFeatures(pre);
            q1 = computeCueQuality(pre);
            q2 = computeCueQuality2(pre);
            f = [f, q1(:, 2:end), q2(:, 2:end)];
            h = height(f);
            f.patient = repmat(string(tok{1}), h, 1);
            f.session = repmat(str2double(tok{2}), h, 1);
            f.block = repmat(string(tok{3}) + string(tok{4}), h, 1);
            f.file = repmat(nm, h, 1);
            f.condition = repmat(C.name(c), h, 1);
            f.damaged = dmg;
            rows = [rows; f]; %#ok<AGROW>
        end
        save(cacheFile, "rows");
    catch err
        failed(end+1,1) = nm + " : " + err.message; %#ok<SAGROW>
    end
    fprintf("%d of %d files, %.1f min\n", i, nF, toc(tStart) / 60);
end
warning("on", "all")

cf = dir(fullfile(P.cache, "*.mat"));
cf = cf(~strcmp({cf.name}, "sweep_all.mat"));
fprintf("%d of %d recordings processed. Failed this run: %d\n", numel(cf), nF, numel(failed));
disp(failed)
if numel(cf) == nF
    parts = cell(numel(cf), 1);
    for k = 1:numel(cf)
        S = load(fullfile(P.cache, cf(k).name));
        parts{k} = S.rows;
    end
    SW = vertcat(parts{:});
    save(fullfile(P.cache, "sweep_all.mat"), "SW", "-v7.3");
    fprintf("Saved %d rows (about %d expected).\n", height(SW), 1127 * nC);
    saveRunInfo("runSweep", struct("conditions", C.name', "maxMinutes", maxMinutes));
else
    fprintf("Not finished yet. Run runSweep again.\n");
end
