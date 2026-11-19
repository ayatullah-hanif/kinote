function A = buildScored()
% Loads the sweep and returns one table with a row per cue per damage condition,
% with the error flag and every reliability score. Used by all the analysis scripts.
P = researchPaths();
f = fullfile(P.cache, "sweep_all.mat");
assert(isfile(f), "sweep_all.mat not found. Run runSweep until it says it is finished.");
S0 = load(f);
SW = S0.SW;
SW.patient = string(SW.patient);
SW.condition = string(SW.condition);
SW.file = string(SW.file);
C = sweepConditions();
clean1 = labelCues(SW(SW.condition == "clean", :));
A = table();
for c = 1:height(C)
    D = labelCues(SW(SW.condition == C.name(c), :));
    sc = cueScores(D, clean1);
    A = [A; [D(:, ["patient","session","block","file","condition","damaged"]), sc]]; %#ok<AGROW>
end
A = A(A.ok, :);
end
