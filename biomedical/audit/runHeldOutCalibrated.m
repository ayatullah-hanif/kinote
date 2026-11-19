% runHeldOutCalibrated: same table as runHeldOut, but every abstention rule gets its own
% cut-off, set so it withholds 5% of the CLEAN cues (no damage labels are used to set it).
% This makes the rules comparable; a fixed 0.6 is far stricter for quality v2 than for v1.
P = researchPaths();
A = buildScored();
C = sweepConditions();
withholdClean = 0.05;
rules = ["trust1", "trust2mean", "trust2min"];
labels = ["v1 mean quality (current)", "v2 mean quality", "v2 min quality"];
cleanMask = A.condition == "clean";
res = {};
for r = 1:numel(rules)
    s = A.(rules(r));
    sc = sort(s(cleanMask));
    thr = sc(max(1, round(withholdClean * numel(sc))));
    for c = 1:height(C)
        cm = A.condition == C.name(c);
        for dm = [true false]
            m = cm & (A.damaged == dm);
            if ~any(m), continue, end
            e = A.err(m) == 1;
            a = s(m) >= thr;
            n = sum(m);
            res{end+1} = table(C.name(c), C.group(c), labels(r), thr, dm, n, ...
                100 * mean(e), 100 * mean(a), 100 * mean(~a), 100 * sum(e & a) / n, ...
                100 * sum(e(a)) / max(sum(a), 1), ...
                'VariableNames', {'condition','group','rule','cutoff','damaged_cues','cues', ...
                'wrong_if_forced_pct','answered_pct','withheld_pct','wrong_answers_per_100_cues', ...
                'wrong_among_answered_pct'}); %#ok<SAGROW>
        end
    end
end
HO = vertcat(res{:});
disp(HO)
writetable(HO, fullfile(P.out, "heldout_calibrated.csv"));
writetable(HO, fullfile(P.web, "heldout_calibrated.csv"));
saveRunInfo("runHeldOutCalibrated", struct("withholdCleanShare", withholdClean));
