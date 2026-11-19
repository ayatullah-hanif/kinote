function [thr, info] = riskControlThreshold(score, err, target, delta)
% Picks the most lenient reliability threshold whose error rate among answered cues is
% statistically below "target". Tests 20 coverage levels (5% .. 100%), each at
% confidence 1 - delta/20 (Bonferroni), using a Clopper-Pearson upper bound.
% Assumes cues are independent, which they are not exactly, so always check on a
% held-out patient. thr = Inf means "withhold everything".
score = score(:); err = err(:);
n = numel(score);
covs = 0.05:0.05:1;
K = numel(covs);
s = sort(score, "descend");
thr = Inf;
info = struct("coverage", 0, "n", 0, "k", 0, "upper", NaN);
for j = 1:K
    t = s(max(1, round(covs(j) * n)));
    a = score >= t;
    na = sum(a);
    k = sum(err(a));
    u = clopperPearsonUpper(k, na, delta / K);
    if u <= target
        thr = t;
        info = struct("coverage", na / n, "n", na, "k", k, "upper", u);
    end
end
end
