function a = aucScore(y, s)
% Area under the ROC curve: the chance that a random positive (y true) has a higher
% score than a random negative. 0.5 = no better than chance, 1 = perfect.
y = logical(y(:)); s = s(:);
k = isfinite(s);
y = y(k); s = s(k);
n1 = sum(y); n0 = sum(~y);
if n1 == 0 || n0 == 0, a = NaN; return, end
[ss, ix] = sort(s);
r = (1:numel(ss))';
i = 1;
while i <= numel(ss)
    j = i;
    while j < numel(ss) && ss(j+1) == ss(i), j = j + 1; end
    r(i:j) = mean(i:j);
    i = j + 1;
end
rk = zeros(size(s)); rk(ix) = r;
a = (sum(rk(y)) - n1 * (n1 + 1) / 2) / (n1 * n0);
end
