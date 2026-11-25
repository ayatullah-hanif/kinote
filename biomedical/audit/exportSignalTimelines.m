% exportSignalTimelines: for every recording, saves EMG and EEG as a time series on a 5 Hz grid
% (EMG: RMS in 0.4 s windows; EEG: band power in 1 s windows, 8-12 Hz and 13-30 Hz), each divided by its
% own recording's median, so a value of 1 means "typical level". Used by the session timeline on the website.
% Output: web/data/signals/<recording>.csv and web/data/signals_index.csv (about 3-4 MB in total).
% Safe to stop and re-run: recordings that are already exported are skipped.
P = researchPaths();
outDir = fullfile(P.web, "signals");
if ~isfolder(outDir), mkdir(outDir); end
files = dir(fullfile(P.audit, "*.edf"));
dt = 0.2;
rows = {};
tStart = tic;
warning("off", "all")
for i = 1:numel(files)
    nm = string(files(i).name);
    csvName = replace(nm, ".edf", ".csv");
    tok = regexp(nm, '^([LR]_\d+)_session(\d+)_(left|right)(\d+)\.edf$', 'tokens', 'once');
    csvFile = fullfile(outDir, csvName);
    if isfile(csvFile)
        info = readtable(csvFile);
        dur = info.t(end);
    else
        rec = loadEdfRecording(fullfile(P.audit, nm));
        pre = preprocessRecording(rec);
        fs = pre.fs;
        tg = (0:dt:pre.t(end))';
        emg = rmsSeries(pre.emg, fs, tg, 0.4);
        mu = bandSeries(pre.eeg, fs, tg, [8 12], 1.0, 0.5);
        be = bandSeries(pre.eeg, fs, tg, [13 30], 1.0, 0.5);
        S = table(round(tg, 1), sig3(emg(:,1)), sig3(emg(:,2)), sig3(mu(:,1)), sig3(mu(:,2)), sig3(be(:,1)), sig3(be(:,2)), ...
            'VariableNames', {'t','emgL','emgR','muL','muR','betaL','betaR'});
        writetable(S, csvFile);
        dur = tg(end);
    end
    rows{end+1} = table(nm, csvName, string(tok{1}), str2double(tok{2}), string(tok{3}) + string(tok{4}), dur, ...
        'VariableNames', {'recording','csv','patient','session','block','duration_s'}); %#ok<SAGROW>
    fprintf("%d of %d, %.1f min\n", i, numel(files), toc(tStart) / 60);
end
warning("on", "all")
IDX = vertcat(rows{:});
writetable(IDX, fullfile(P.web, "signals_index.csv"));
fprintf("Wrote %d recordings to %s\n", height(IDX), outDir);

function y = sig3(x)
y = round(x, 3, "significant");
end

function y = rmsSeries(x, fs, tg, win)
n = size(x, 1);
h = round(win * fs / 2);
y = nan(numel(tg), size(x, 2));
for k = 1:numel(tg)
    c = round(tg(k) * fs) + 1;
    a = max(1, c - h); b = min(n, c + h);
    y(k, :) = sqrt(mean(x(a:b, :).^2, 1));
end
y = y ./ median(y, 1, "omitnan");
end

function y = bandSeries(x, fs, tg, band, win, hop)
tc = (0:hop:tg(end))';
n = size(x, 1);
h = round(win * fs / 2);
p = nan(numel(tc), size(x, 2));
for k = 1:numel(tc)
    c = round(tc(k) * fs) + 1;
    a = max(1, c - h); b = min(n, c + h);
    if b - a < fs / 2, continue, end
    for j = 1:size(x, 2)
        p(k, j) = bandpower(x(a:b, j), fs, band);
    end
end
y = nan(numel(tg), size(x, 2));
for j = 1:size(x, 2)
    ok = ~isnan(p(:, j));
    y(:, j) = max(interp1(tc(ok), p(ok, j), tg, "linear", "extrap"), 0);
end
y = y ./ median(y, 1, "omitnan");
end
