% applyMDCToWeb: replaces the session-comparison verdicts, the uncertainty bars and the
% comparison sentences in the website data with the repeat-recording (MDC) version.
% Run runMDC first. Safe to re-run: it always starts from backups of the originals.
P = researchPaths();
M = readtable(fullfile(P.out, "mdc_results.csv"));
M.patient = string(M.patient);
M.verdict_mdc = string(M.verdict_mdc);

sb = fullfile(P.out, "session_summary_binomial_backup.csv");
if ~isfile(sb), copyfile(fullfile(P.web, "session_summary.csv"), sb); end
S = readtable(sb);
S.patient = string(S.patient);
S.verdict = string(S.verdict);
n = height(S);
S.verdict_binomial = S.verdict;
S.margin_binomial = S.margin;
S.mdc_points = nan(n, 1);
for i = 1:n
    k = find(M.patient == S.patient(i) & M.session == S.session(i), 1);
    if isempty(k), continue, end
    S.margin(i) = 1.96 * M.sem(k);
    S.mdc_points(i) = M.mdc_points(k);
    if S.verdict_binomial(i) == "no earlier session", continue, end
    pv = find(M.patient == S.patient(i) & M.session == M.prev_session(k), 1);
    thin = M.recordings(k) < 2 || (~isempty(pv) && M.recordings(pv) < 2);
    if thin || S.verdict_binomial(i) == "not enough data"
        S.verdict(i) = "not enough data";
    else
        S.verdict(i) = M.verdict_mdc(k);
    end
    S.change_points(i) = M.change_points(k);
end
writetable(S, fullfile(P.web, "session_summary.csv"), "QuoteStrings", true);
fprintf("Verdicts changed: %d of %d\n", sum(S.verdict ~= S.verdict_binomial), n);

ib = fullfile(P.out, "insights_binomial_backup.csv");
if ~isfile(ib), copyfile(fullfile(P.web, "insights.csv"), ib); end
I = readtable(ib, "TextType", "string");
for i = 1:height(I)
    if I.mode(i) ~= "clean", continue, end
    if ~startsWith(I.text(i), ["Compared with session", "Comparison with session"]), continue, end
    k = find(M.patient == I.patient(i) & M.session == I.session(i), 1);
    j = find(S.patient == I.patient(i) & S.session == I.session(i), 1);
    if isempty(k) || isempty(j) || isnan(M.prev_session(k)), continue, end
    pvs = M.prev_session(k);
    switch S.verdict(j)
        case "not enough data"
            I.text(i) = sprintf("Comparison with session %d withheld: too little reliable data to compare.", pvs);
        case "no reliable change"
            I.text(i) = sprintf("Compared with session %d, the detected attempt rate is %+.0f points different, which is within the normal variation between repeat recordings (about plus or minus %.0f points). No reliable change is reported.", ...
                pvs, M.change_points(k), M.mdc_points(k));
        otherwise
            I.text(i) = sprintf("Compared with session %d, the detected attempt rate is %+.0f points different, more than the normal variation between repeat recordings (about plus or minus %.0f points). This describes the recordings only and is not a measure of recovery.", ...
                pvs, M.change_points(k), M.mdc_points(k));
    end
end
writetable(I, fullfile(P.web, "insights.csv"), "QuoteStrings", true);
disp(S(:, ["patient","session","verdict_binomial","verdict","change_points","mdc_points"]))
disp("Now copy session_summary.csv and insights.csv from web/data into web/app/public/data on your laptop.")
