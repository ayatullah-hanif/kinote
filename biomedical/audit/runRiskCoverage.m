% runRiskCoverage: error rate among answered cues as the system answers fewer cues,
% for several ways of choosing which cues to withhold, with 95% intervals from
% resampling whole recordings. Random = no skill; Oracle = a perfect ranking.
% Two datasets: clean recordings only, and a stress mix (clean + 7 damage types).
P = researchPaths();
A = buildScored();
mlist = ["Quality v1 (current)", "Quality v2 (min)", "Decision margin", "Margin x quality v2", "Random", "Oracle"];
covs = 0.1:0.1:1;
nB = 200;
rng(1);
dsNames = ["Clean recordings"; "Stress mix (clean + 7 damage types)"];
dsMask = {A.condition == "clean"; true(height(A), 1)};
curves = {}; summ = {};
for d = 1:2
    Ad = A(dsMask{d}, :);
    [~, ~, fid] = unique(Ad.file);
    nU = max(fid);
    byFile = accumarray(fid, (1:height(Ad))', [], @(v) {v});
    for m = 1:numel(mlist)
        pt = curveFor(Ad, m, covs);
        bs = zeros(nB, numel(covs));
        for b = 1:nB
            idx = vertcat(byFile{randi(nU, nU, 1)});
            bs(b, :) = curveFor(Ad(idx, :), m, covs);
        end
        sb = sort(bs, 1);
        lo = sb(max(1, round(0.025 * nB)), :);
        hi = sb(round(0.975 * nB), :);
        curves{end+1} = table(repmat(dsNames(d), numel(covs), 1), repmat(mlist(m), numel(covs), 1), ...
            (100 * covs)', (100 * pt)', (100 * lo)', (100 * hi)', ...
            'VariableNames', {'dataset','method','coverage_pct','risk_pct','lo_pct','hi_pct'}); %#ok<SAGROW>
        ab = sort(mean(bs, 2));
        summ{end+1} = table(dsNames(d), mlist(m), 100 * mean(pt), 100 * ab(max(1, round(0.025 * nB))), ...
            100 * ab(round(0.975 * nB)), 100 * pt(8), height(Ad), ...
            'VariableNames', {'dataset','method','mean_risk_pct','lo_pct','hi_pct','risk_at_80pct_coverage','cues'}); %#ok<SAGROW>
    end
end
CV = vertcat(curves{:});
SM = vertcat(summ{:});
disp(SM)
writetable(CV, fullfile(P.out, "risk_coverage.csv"));
writetable(SM, fullfile(P.out, "risk_coverage_summary.csv"));
writetable(CV, fullfile(P.web, "risk_coverage.csv"));
writetable(SM, fullfile(P.web, "risk_coverage_summary.csv"));
try
    T = CV(startsWith(CV.dataset, "Stress"), :);
    figure; hold on
    for m = 1:numel(mlist)
        t = T(T.method == mlist(m), :);
        plot(t.coverage_pct, t.risk_pct, "-o", "LineWidth", 1.8, "DisplayName", mlist(m));
    end
    grid on; xlabel("Cues answered (%)"); ylabel("Wrong among answered (%)");
    title("Risk-coverage, stress mix"); legend("Location", "northwest");
    exportgraphics(gcf, fullfile(P.out, "risk_coverage.png"));
catch
    disp("Plot skipped; the CSV files are the result.");
end
saveRunInfo("runRiskCoverage", struct("bootstrap", nB, "coverages", covs, "seed", 1));

function r = curveFor(Ad, m, covs)
err = Ad.err;
switch m
    case 1, s = Ad.trust1;
    case 2, s = Ad.trust2min;
    case 3, s = Ad.margin;
    case 4, s = Ad.margin2;
    case 5, r = repmat(mean(err), 1, numel(covs)); return
    case 6, s = -err;
end
[~, ix] = sort(s, "descend");
e = err(ix);
cm = cumsum(e) ./ (1:numel(e))';
k = max(1, round(covs * numel(e)));
r = cm(k)';
end
