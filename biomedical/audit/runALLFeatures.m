files = dir("*.edf");
n = numel(files);
feats = table();
failed = strings(0,1);
warning("off","all")
for i = 1:n
    nm = string(files(i).name);
    try
        rec = loadEdfRecording(nm);
        pre = preprocessRecording(rec);
        f = extractCueFeatures(pre);
        q = computeCueQuality(pre);
        f = [f, q(:, 2:end)];
        tok = regexp(nm, '^([LR]_\d+)_session(\d+)_(left|right)(\d+)\.edf$', 'tokens', 'once');
        h = height(f);
        f.patient = repmat(string(tok{1}), h, 1);
        f.session = repmat(str2double(tok{2}), h, 1);
        f.block = repmat(string(tok{3}) + string(tok{4}), h, 1);
        f.file = repmat(nm, h, 1);
        f = movevars(f, ["patient","session","block","file"], "Before", 1);
        feats = [feats; f];
    catch err
        failed(end+1,1) = nm + " : " + err.message;
    end
    fprintf("%d of %d done\n", i, n);
end
warning("on","all")

% Label the movement cues and pick the matching forearm
feats.blockSide = extractBefore(string(feats.block), digitsPattern);
cueSide = replace(feats.cue, "flash_", "");
feats.isTarget = (cueSide == "l" & feats.blockSide == "left") | ...
    (cueSide == "r" & feats.blockSide == "right");
isRight = feats.blockSide == "right";
feats.emgTarget = feats.emgL_ratio;
feats.emgTarget(isRight) = feats.emgR_ratio(isRight);
feats.qEmgTarget = feats.qEmgL;
feats.qEmgTarget(isRight) = feats.qEmgR(isRight);

height(feats)
failed
writetable(feats, "features_all.csv");
groupsummary(feats, "patient", "median", ["qEmgTarget","qEegL","qEegR"])
mean(feats.qEmgTarget < 0.5, "omitnan")