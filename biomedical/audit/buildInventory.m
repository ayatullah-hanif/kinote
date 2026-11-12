files = dir("*.edf");
n = numel(files);
name = strings(n,1); dur = zeros(n,1); chans = strings(n,1);
nL = zeros(n,1); nR = zeros(n,1); nBad = zeros(n,1);
badSec = zeros(n,1); nOther = zeros(n,1);
for i = 1:n
    rec = loadEdfRecording(files(i).name);
    name(i) = string(files(i).name);
    dur(i) = size(rec.data,1) / rec.fs;
    chans(i) = strjoin(rec.labels, ",");
    L = rec.events.label;
    nL(i) = sum(L == "flash_l");
    nR(i) = sum(L == "flash_r");
    isBad = L == "BAD_ACQ_SKIP";
    nBad(i) = sum(isBad);
    badSec(i) = sum(rec.events.duration_s(isBad));
    nOther(i) = sum(~ismember(L, ["flash_l","flash_r","BAD_ACQ_SKIP"]));
    fprintf("%d of %d done\n", i, n);
end
inventory = table(name, dur, nL, nR, nBad, badSec, nOther, chans);
disp(inventory(:, 1:7))
unique(chans)
writetable(inventory, "inventory.csv");