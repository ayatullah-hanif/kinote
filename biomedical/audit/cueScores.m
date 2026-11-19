function S = cueScores(F, clean1)
% Runs the existing fusion on labelled cues (quality v1 weights, never abstaining) and
% returns, per cue, whether the decision is wrong and several candidate "how reliable
% is this cue" scores. Higher score = more reliable.
%   trust1      mean of the v1 muscle and brain quality (the current system)
%   trust2mean  mean of the v2 qualities
%   trust2min   the worse of the v2 muscle and brain quality
%   margin      distance of the fused score from the decision cut-off
%   margin2     margin x trust2min
out = fuseCues(F, 0, 1, clean1);
isRight = F.blockSide == "right";
q1e = F.qEmgTarget;
q1g = F.qEegR;  q1g(isRight) = F.qEegL(isRight);
q2e = F.q2EmgL; q2e(isRight) = F.q2EmgR(isRight);
q2g = F.q2EegR; q2g(isRight) = F.q2EegL(isRight);
S = table();
S.err = double((out.fused > 1) ~= logical(out.truth));
S.trust1 = (q1e + q1g) / 2;
S.trust2mean = (q2e + q2g) / 2;
S.trust2min = min(q2e, q2g);
S.margin = abs(out.fused - 1);
S.margin2 = S.margin .* S.trust2min;
S.ok = isfinite(out.fused) & isfinite(S.trust1) & isfinite(S.trust2min);
end
