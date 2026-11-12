cd("/MATLAB Drive/kinote")
setupProject
auditDir = fileparts(which("sessionInsights"));
root = fileparts(fileparts(auditDir));
outDir = fullfile(root, "web", "data");

R = readtable(fullfile(auditDir, "fusion_results.csv"));
F = readtable(fullfile(auditDir, "features_all.csv"));
assert(height(R) == height(F), "Row counts differ between the two files");
assert(max(abs(R.cue_time - F.cue_time)) < 1e-6, "Rows are not in the same order");

patient = string(R.patient);
session = R.session;
state = string(R.state);
isT = logical(R.truth);                 % true = the cue for the tested hand
answered = state ~= "can't tell";
isRight = string(F.blockSide) == "right";
mu = F.muR_change;                      % rhythm change over the opposite side of the brain
mu(isRight) = F.muL_change(isRight);
emg = F.emgTarget;

pairs = unique(table(patient, session), "rows");
n = height(pairs);
S = table();
for i = 1:n
    m = patient == pairs.patient(i) & session == pairs.session(i);
    tgt = m & isT & answered;
    nT = sum(tgt);
    nAtt = sum(tgt & state == "attempt");
    rate = nAtt / max(nT, 1);
    margin = 1.96 * sqrt(rate * (1 - rate) / max(nT, 1));
    row = table(pairs.patient(i), pairs.session(i), sum(m), sum(m & ~answered), ...
        sum(m & ~answered) / sum(m), median(R.trust(m), "omitnan"), nT, nAtt, rate, margin, ...
        median(emg(m & isT & answered), "omitnan"), median(emg(m & ~isT & answered), "omitnan"), ...
        median(mu(m & isT & answered), "omitnan"), median(mu(m & ~isT & answered), "omitnan"), ...
        'VariableNames', {'patient','session','n_cues','n_withheld','withheld_share', ...
        'median_trust','n_target_answered','n_attempt','attempt_rate','margin', ...
        'emg_ratio_movement','emg_ratio_other','mu_change_movement','mu_change_other'});
    S = [S; row]; %#ok<AGROW>
end

S.prev_session = nan(n, 1);
S.change_points = nan(n, 1);
S.verdict = repmat("no earlier session", n, 1);
for i = 1:n
    prev = find(S.patient == S.patient(i) & S.session < S.session(i));
    if isempty(prev), continue, end
    [~, k] = max(S.session(prev));
    p = prev(k);
    S.prev_session(i) = S.session(p);
    if max(S.withheld_share(i), S.withheld_share(p)) > 0.3 || ...
            min(S.n_target_answered(i), S.n_target_answered(p)) < 10
        S.verdict(i) = "not enough data";
        continue
    end
    d = S.attempt_rate(i) - S.attempt_rate(p);
    mg = 1.96 * sqrt(S.attempt_rate(i) * (1 - S.attempt_rate(i)) / S.n_target_answered(i) + ...
        S.attempt_rate(p) * (1 - S.attempt_rate(p)) / S.n_target_answered(p));
    S.change_points(i) = 100 * d;
    if abs(d) <= mg
        S.verdict(i) = "no reliable change";
    elseif d > 0
        S.verdict(i) = "clear rise";
    else
        S.verdict(i) = "clear fall";
    end
end

writetable(S, fullfile(outDir, "session_summary.csv"), "QuoteStrings", true);
fprintf("Rows written: %d\n", height(S));
disp(S(S.patient == "L_06", ["session","attempt_rate","margin","withheld_share","verdict"]))