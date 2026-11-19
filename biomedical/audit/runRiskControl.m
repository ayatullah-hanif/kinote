% runRiskControl: instead of guessing the abstention cut-off, choose it from the data so
% the error rate among answered cues stays below a target with stated confidence. Chosen
% on three patients, then TESTED on the fourth (leave-one-patient-out). target_met = 1 if
% the held-out patient's error stayed under the target. Uses the stress mix.
P = researchPaths();
A = buildScored();
delta = 0.10;
targets = [0.15 0.20 0.25];
scores = ["trust1", "trust2min", "margin", "margin2"];
labels = ["Quality v1 (current)", "Quality v2 (min)", "Decision margin", "Margin x quality v2"];
pats = unique(A.patient);
rows = {};
for m = 1:numel(scores)
    for t = targets
        for h = pats'
            cal = A(A.patient ~= h, :);
            tst = A(A.patient == h, :);
            [thr, info] = riskControlThreshold(cal.(scores(m)), cal.err, t, delta);
            a = tst.(scores(m)) >= thr;
            n = sum(a);
            wrongAns = NaN; met = NaN;
            if n > 0
                wrongAns = 100 * mean(tst.err(a));
                met = double(wrongAns <= 100 * t);
            end
            rows{end+1} = table(labels(m), 100 * t, h, thr, 100 * info.coverage, height(tst), ...
                100 * mean(a), wrongAns, 100 * mean(tst.err), met, ...
                'VariableNames', {'method','target_pct','heldout_patient','threshold', ...
                'calibration_coverage_pct','test_cues','test_answered_pct', ...
                'test_wrong_among_answered_pct','test_wrong_if_forced_pct','target_met'}); %#ok<SAGROW>
        end
    end
end
RC = vertcat(rows{:});
disp(RC)
SM = groupsummary(RC, ["method", "target_pct"], @(x) mean(x, "omitnan"), ...
    ["test_answered_pct", "test_wrong_among_answered_pct", "target_met"]);
disp(SM)
writetable(RC, fullfile(P.out, "risk_control.csv"));
writetable(SM, fullfile(P.out, "risk_control_summary.csv"));
writetable(RC, fullfile(P.web, "risk_control.csv"));
writetable(SM, fullfile(P.web, "risk_control_summary.csv"));
saveRunInfo("runRiskControl", struct("delta", delta, "targets", targets));
