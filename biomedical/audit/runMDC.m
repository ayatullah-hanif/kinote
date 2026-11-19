% runMDC: minimal detectable change. The recordings of the same task within one session
% (left1, left2, left3 ...) are repeats, so their spread measures how much the detected
% attempt rate varies by chance. A session-to-session change counts only if it exceeds
% 1.96 x the combined standard error. Compared with the earlier binomial-margin verdicts.
P = researchPaths();
R = readtable(fullfile(P.audit, "fusion_results.csv"));
R.patient = string(R.patient); R.state = string(R.state);
R.file = string(R.file); R.block = string(R.block);
answered = logical(R.truth) & R.state ~= "can't tell";
T = R(answered, :);
[fileNames, ~, gi] = unique(T.file);
Bk = table(fileNames, accumarray(gi, 1), accumarray(gi, double(T.state == "attempt")), ...
    'VariableNames', {'file','nAns','nAtt'});
info = unique(R(:, ["patient","session","block","file"]), "rows");
Bk = innerjoin(Bk, info, "Keys", "file");
Bk.rate = Bk.nAtt ./ Bk.nAns;
Bk.side = extractBefore(Bk.block, digitsPattern);
Bk = Bk(Bk.nAns >= 3, :);

grp = Bk.patient + "_" + string(Bk.session) + "_" + Bk.side;
gg = findgroups(grp);
m = splitapply(@numel, Bk.rate, gg);
v = splitapply(@var, Bk.rate, gg);
use = m >= 2;
sdW = sqrt(sum((m(use) - 1) .* v(use)) / sum(m(use) - 1));
sdBin = sqrt(mean(Bk.rate .* (1 - Bk.rate) ./ Bk.nAns));
fprintf("Repeat recordings: %d groups. Within-session SD of the attempt rate: %.3f (pure binomial chance alone would give about %.3f)\n", ...
    sum(use), sdW, sdBin);

sess = unique(Bk(:, ["patient","session"]), "rows");
n = height(sess);
sess.recordings = zeros(n,1); sess.rate = zeros(n,1);
for i = 1:n
    k = Bk.patient == sess.patient(i) & Bk.session == sess.session(i);
    sess.recordings(i) = sum(k);
    sess.rate(i) = mean(Bk.rate(k));
end
sess.sem = sdW ./ sqrt(sess.recordings);
sess.prev_session = nan(n,1); sess.change_points = nan(n,1); sess.mdc_points = nan(n,1);
sess.verdict_mdc = repmat("no earlier session", n, 1);
for i = 1:n
    pv = find(sess.patient == sess.patient(i) & sess.session < sess.session(i));
    if isempty(pv), continue, end
    [~, kk] = max(sess.session(pv));
    p = pv(kk);
    sess.prev_session(i) = sess.session(p);
    sess.change_points(i) = 100 * (sess.rate(i) - sess.rate(p));
    sess.mdc_points(i) = 100 * 1.96 * sqrt(sess.sem(i)^2 + sess.sem(p)^2);
    if abs(sess.change_points(i)) <= sess.mdc_points(i)
        sess.verdict_mdc(i) = "no reliable change";
    elseif sess.change_points(i) > 0
        sess.verdict_mdc(i) = "clear rise";
    else
        sess.verdict_mdc(i) = "clear fall";
    end
end
sess.rate_pct = 100 * sess.rate;

out = sess;
f = fullfile(P.web, "session_summary.csv");
if isfile(f)
    S = readtable(f);
    S2 = S(:, ["patient","session","verdict","change_points"]);
    S2.patient = string(S2.patient); S2.verdict = string(S2.verdict);
    S2.Properties.VariableNames = {'patient','session','verdict_binomial','change_binomial'};
    out = innerjoin(sess, S2, "Keys", ["patient","session"]);
    out.verdicts_differ = out.verdict_mdc ~= out.verdict_binomial;
    fprintf("Verdicts that differ from the binomial-margin version: %d of %d\n", sum(out.verdicts_differ), height(out));
end
keep = ["patient","session","recordings","rate_pct","sem","prev_session","change_points","mdc_points","verdict_mdc", ...
    "verdict_binomial","change_binomial","verdicts_differ"];
out = out(:, keep(ismember(keep, string(out.Properties.VariableNames))));
disp(out)
writetable(out, fullfile(P.out, "mdc_results.csv"));
writetable(out, fullfile(P.web, "mdc_results.csv"));
fprintf("Typical smallest detectable change for one session pair (6 recordings each): %.0f points\n", ...
    100 * 1.96 * sqrt(2) * sdW / sqrt(6));
saveRunInfo("runMDC", struct("sdWithin", sdW, "minAnsweredCues", 3));
