% runAllResearch: runs the sweep if needed, then every analysis, then the unit tests.
% runTiltExperiment is separate because it needs you, a camera and a protractor.
P = researchPaths();
if ~isfile(fullfile(P.cache, "sweep_all.mat")), runSweep; end
if ~isfile(fullfile(P.cache, "sweep_all.mat"))
    error("The sweep is not finished. Run runAllResearch again to continue it.");
end
steps = ["runHeldOut" "runRiskCoverage" "runRiskControl" "runMDC"];
for s = steps
    fprintf("\n=== %s ===\n", s);
    try
        run(char(s));
    catch err
        fprintf("%s FAILED: %s\n", s, err.message);
    end
end
fprintf("\n=== unit tests ===\n");
tr = runtests(fullfile(P.root, "tests", "KinoteTests.m"));
disp(table(tr))
fprintf("\nResult files are in: %s\n", P.out);
disp(string({dir(P.out).name})')
