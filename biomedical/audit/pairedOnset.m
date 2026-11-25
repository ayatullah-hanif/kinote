function R = pairedOnset(tA, angle, tE, emg, opts)
% For each repetition, finds when the arm starts to move (camera) and when the muscle starts to fire (EMG),
% and returns how long the muscle leads. Needs the camera and the EMG recorded together on one clock.
% Only meaningful if the electrode sits on a muscle that drives this movement (for example the biceps).
%   tA, angle: camera time (s) and elbow angle (degrees)     tE, emg: EMG time (s) and signal
%   opts (optional): dropDeg (5), envWin (0.1 s), searchBack (0.6 s), searchFwd (0.2 s), sustain (0.03 s)
if nargin < 5, opts = struct(); end
drop = getOpt(opts, "dropDeg", 5);
win = getOpt(opts, "envWin", 0.1);
back = getOpt(opts, "searchBack", 0.6);
fwd = getOpt(opts, "searchFwd", 0.2);
sustain = getOpt(opts, "sustain", 0.03);
[~, ~, idx, sm] = countReps(angle, tA);
tA = tA(:); tE = tE(:);
fsE = 1 / median(diff(tE));
env = movmean(abs(emg(:) - median(emg(:))), max(1, round(win * fsE)));
thr = median(env) + 3 * 1.4826 * median(abs(env - median(env)));
ne = max(1, round(sustain * fsE));
rows = zeros(0, 4);
for k = 1:numel(idx)
    prev = 1;
    if k > 1, prev = idx(k-1); end
    seg = prev:idx(k);
    [pk, ip] = max(sm(seg));
    ip = seg(ip);
    j = find(sm(ip:idx(k)) < pk - drop, 1);
    if isempty(j), continue, end
    tm = tA(ip + j - 1);
    w = tE >= tm - back & tE <= tm + fwd;
    above = (env > thr) & w;
    run = movsum(double(above), [0 ne-1]) >= ne;
    k0 = find(run & w, 1);
    te = NaN;
    if ~isempty(k0), te = tE(k0); end
    rows(end+1, :) = [k, tm, te, 1000 * (tm - te)]; %#ok<AGROW>
end
R = array2table(rows, 'VariableNames', {'rep','t_move_s','t_emg_s','emg_leads_ms'});
end

function v = getOpt(s, f, d)
if isfield(s, f), v = s.(f); else, v = d; end
end
