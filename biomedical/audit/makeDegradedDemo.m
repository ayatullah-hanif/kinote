patient = "L_06"; session = 6;
files = dir(sprintf("%s_session%d_*.edf", patient, session));
clean = readtable("features_all.csv");
clean.patient = string(clean.patient);  clean.block = string(clean.block);
clean.blockSide = string(clean.blockSide);  clean.cue = string(clean.cue);
rows = table();
warning("off","all")
for i = 1:numel(files)
    nm = string(files(i).name);
    rec = loadEdfRecording(nm);
    [rec2, dmg] = degradeRecording(rec, "emg_dropout", 1, 0.25, i);
    pre = preprocessRecording(rec2);
    f = extractCueFeatures(pre);
    q = computeCueQuality(pre);
    f = [f, q(:, 2:end)];
    tok = regexp(nm, '^([LR]_\d+)_session(\d+)_(left|right)(\d+)\.edf$', 'tokens', 'once');
    h = height(f);
    f.patient = repmat(string(tok{1}), h, 1);
    f.session = repmat(str2double(tok{2}), h, 1);
    f.block = repmat(string(tok{3}) + string(tok{4}), h, 1);
    f.file = repmat(nm, h, 1);
    f.damaged = dmg;
    rows = [rows; f];
end
warning("on","all")

F = rows;
F.blockSide = extractBefore(string(F.block), digitsPattern);
cueSide = replace(string(F.cue), "flash_", "");
F.isTarget = (cueSide == "l" & F.blockSide == "left") | (cueSide == "r" & F.blockSide == "right");
isRight = F.blockSide == "right";
F.emgTarget = F.emgL_ratio;    F.emgTarget(isRight) = F.emgR_ratio(isRight);
F.qEmgTarget = F.qEmgL;        F.qEmgTarget(isRight) = F.qEmgR(isRight);

out = fuseCues(F, 0.6, 1, clean);
state = repmat("no attempt", height(out), 1);
state(out.fused > 1) = "attempt";
state(out.abstain == 1 | isnan(out.abstain)) = "can't tell";
res = [F(:, ["patient","session","block","file","cue_time","cue"]), out(:, 2:end)];
res.state = state;
res.damaged = F.damaged;
writetable(res, "fusion_results_degraded.csv");
tabulate(categorical(res.state + " | damaged=" + string(res.damaged)))