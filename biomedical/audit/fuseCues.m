function out = fuseCues(feats, abstainBelow, decideAbove, ref)
% Reliability-weighted fusion of muscle and brain evidence for each cue.
% ref (optional): clean features used to set each patient's normal level.
if nargin < 2 || isempty(abstainBelow), abstainBelow = 0.75; end
if nargin < 3 || isempty(decideAbove), decideAbove = 1; end
if nargin < 4 || isempty(ref), ref = feats; end
n = height(feats);

[xEmg, qEmg, xEeg, qEeg] = evidence(feats);
[rEmg, ~, rEeg, ~] = evidence(ref);

zEmg = nan(n,1);  zEeg = nan(n,1);
for p = unique(feats.patient)'
    idx = feats.patient == p;
    rr = ref.patient == p & ~ref.isTarget;
    zEmg(idx) = robustZ(xEmg(idx), rEmg(rr));
    zEeg(idx) = robustZ(xEeg(idx), rEeg(rr));
end
zEmg(zEmg > 5) = 5;  zEmg(zEmg < -5) = -5;
zEeg(zEeg > 5) = 5;  zEeg(zEeg < -5) = -5;

% Quality-aware fusion: more trusted signal counts for more
w = [qEmg qEeg];
z = [zEmg zEeg];
fused = sum(w .* z, 2) ./ sum(w, 2);
trust = sum(w, 2) / 2;

% Ordinary fusion: equal weights, never abstains
fusedEq = mean(z, 2);

ok = isfinite(fused) & isfinite(fusedEq);
truth = feats.isTarget;
abstain = nan(n,1);        abstain(ok) = double(trust(ok) < abstainBelow);
answered = ok & trust >= abstainBelow;

correctEq = nan(n,1);
correctEq(ok) = double((fusedEq(ok) > decideAbove) == truth(ok));
correctQ = nan(n,1);
correctQ(answered) = double((fused(answered) > decideAbove) == truth(answered));

out = table(feats.patient, truth, zEmg, zEeg, fused, fusedEq, trust, abstain, ...
    correctQ, correctEq, ...
    'VariableNames', {'patient','truth','zEmg','zEeg','fused','fusedEq', ...
    'trust','abstain','correctQ','correctEq'});
end

function z = robustZ(x, r)
m = median(r, "omitnan");
s = 1.4826 * median(abs(r - m), "omitnan");
z = (x - m) / s;
end

function [xEmg, qEmg, xEeg, qEeg] = evidence(f)
isRight = f.blockSide == "right";
xEmg = log2(f.emgTarget);
qEmg = f.qEmgTarget;
mu = f.muR_change;  beta = f.betaR_change;  qEeg = f.qEegR;
mu(isRight)   = f.muL_change(isRight);
beta(isRight) = f.betaL_change(isRight);
qEeg(isRight) = f.qEegL(isRight);
xEeg = -(log2(1 + mu/100) + log2(1 + beta/100)) / 2;
end