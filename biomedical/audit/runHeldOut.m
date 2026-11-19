% runHeldOut: damage the system was NOT designed around. For each condition and each
% abstention rule it reports errors, abstentions and answered share SEPARATELY
% (withheld cues are never counted as correct), plus how well each quality score
% separates damaged from undamaged cues (AUC: 0.5 = chance, 1 = perfect).
P = researchPaths();
A = buildScored();
C = sweepConditions();
thr = 0.6;
rules = ["trust1", "trust2mean", "trust2min"];
labels = ["v1 mean quality (current)", "v2 mean quality", "v2 min quality"];
res = {}; auc = {};
for c = 1:height(C)
    cm = A.condition == C.name(c);
    for r = 1:numel(rules)
        s = A.(rules(r));
        if C.group(c) ~= "clean"
            auc{end+1} = table(C.name(c), C.group(c), labels(r), aucScore(A.damaged(cm), 1 - s(cm)), ...
                'VariableNames', {'condition','group','rule','auc_damage_detection'}); %#ok<SAGROW>
        end
        for dm = [true false]
            m = cm & (A.damaged == dm);
            if ~any(m), continue, end
            e = A.err(m) == 1;
            a = s(m) >= thr;
            n = sum(m);
            res{end+1} = table(C.name(c), C.group(c), labels(r), dm, n, ...
                100 * mean(e), 100 * mean(a), 100 * mean(~a), 100 * sum(e & a) / n, ...
                100 * sum(e(a)) / max(sum(a), 1), ...
                'VariableNames', {'condition','group','rule','damaged_cues','cues', ...
                'wrong_if_forced_pct','answered_pct','withheld_pct','wrong_answers_per_100_cues', ...
                'wrong_among_answered_pct'}); %#ok<SAGROW>
        end
    end
end
HO = vertcat(res{:});
AU = vertcat(auc{:});
disp(HO)
disp(AU)
writetable(HO, fullfile(P.out, "heldout_results.csv"));
writetable(AU, fullfile(P.out, "heldout_auc.csv"));
writetable(HO, fullfile(P.web, "heldout_results.csv"));
writetable(AU, fullfile(P.web, "heldout_auc.csv"));
saveRunInfo("runHeldOut", struct("abstainBelow", thr, "rules", labels));
