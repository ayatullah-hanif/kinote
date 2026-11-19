function u = clopperPearsonUpper(k, n, delta)
% One-sided upper confidence bound (confidence 1-delta) on an error rate,
% given k errors among n answered cues.
if n == 0 || k >= n, u = 1; return, end
u = betaincinv(1 - delta, k + 1, n - k);
end
