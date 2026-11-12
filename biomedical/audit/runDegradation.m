files = dir("*.edf");
nF = numel(files);
conds = struct("type", {"emg_noise","emg_dropout","eeg_spike"}, "severity", {8, 1, 10});
nC = numel(conds);
rows = repmat({table()}, nC, 1);
failed = strings(0,1);
warning("off","all")
for i = 1:nF
    nm = string(files(i).name);
    try
        rec = loadEdfRecording(nm);
        tok = regexp(nm, '^([LR]_\d+)_session(\d+)_(left|right)(\d+)\.edf$', 'tokens', 'once');
        for c = 1:nC
            [rec2, dmg] = degradeRecording(rec, conds(c).type, conds(c).severity, 0.25, i);
            pre = preprocessRecording(rec2);
            f = extractCueFeatures(pre);
            q = computeCueQuality(pre);
            f = [f, q(:, 2:end)];
            h = height(f);
            f.patient = repmat(string(tok{1}), h, 1);
            f.session = repmat(str2double(tok{2}), h, 1);
            f.block = repmat(string(tok{3}) + string(tok{4}), h, 1);
            f.file = repmat(nm, h, 1);
            f.damaged = dmg;
            rows{c} = [rows{c}; f];
        end
    catch err
        failed(end+1,1) = nm + " : " + err.message;
    end
    fprintf("%d of %d done\n", i, nF);
end
warning("on","all")
failed

% Clean reference and comparison
clean = readtable("features_all.csv");
clean.patient = string(clean.patient);  clean.block = string(clean.block);
clean.blockSide = string(clean.blockSide);  clean.cue = string(clean.cue);
clean.damaged = false(height(clean), 1);

names = ["clean"; string({conds.type})' + "_" + string([conds.severity])'];
summ = table();
for c = 0:nC
    if c == 0
        F = clean;
    else
        F = labelFeats(rows{c});
    end
    out = fuseCues(F, 0.6, 1, clean);
    ok = ~isnan(out.correctEq);
    for d = [false true]
        m = ok & (F.damaged == d);
        if ~any(m), continue, end
        summ = [summ; table(names(c+1), d, sum(m), ...
            100*mean(out.correctEq(m) == 0), ...
            100*mean(out.correctQ(m) == 0), ...
            100*mean(out.abstain(m)), ...
            100*mean(out.correctQ(m & out.abstain == 0)), ...
            'VariableNames', {'condition','damaged','cues','wrongEqual', ...
            'wrongQuality','withheld','accAnsweredQuality'})];
    end
end
disp(summ)
writetable(summ, "degradation_results.csv");

function f = labelFeats(f)
f.blockSide = extractBefore(string(f.block), digitsPattern);
cueSide = replace(string(f.cue), "flash_", "");
f.isTarget = (cueSide == "l" & f.blockSide == "left") | ...
    (cueSide == "r" & f.blockSide == "right");
isRight = f.blockSide == "right";
f.emgTarget = f.emgL_ratio;      f.emgTarget(isRight) = f.emgR_ratio(isRight);
f.qEmgTarget = f.qEmgL;          f.qEmgTarget(isRight) = f.qEmgR(isRight);
end