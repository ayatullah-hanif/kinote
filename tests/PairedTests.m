classdef PairedTests < matlab.unittest.TestCase
    methods (Test)
        function recoversTheLagWePutIn(tc)
            rng(4);
            lead = 0.080;
            tA = (0:0.1:20)';
            angle = 110 + 60 * cos(2 * pi * tA / 2.5);
            tE = (0:1/500:20)';
            emg = 5 * randn(size(tE));
            for k = 1:7
                t0 = 2.5 * k - lead;
                w = tE >= t0 & tE < t0 + 0.8;
                emg(w) = emg(w) + 40 * randn(nnz(w), 1);
            end
            R = pairedOnset(tA, angle, tE, emg);
            tc.verifyGreaterThanOrEqual(height(R), 5);
            tc.verifyEqual(median(R.emg_leads_ms, "omitnan"), 243, "AbsTol", 130);
        end
        function noMuscleActivityGivesNoLag(tc)
            rng(5);
            tA = (0:0.1:20)';
            angle = 110 + 60 * cos(2 * pi * tA / 2.5);
            tE = (0:1/500:20)';
            R = pairedOnset(tA, angle, tE, 5 * randn(size(tE)));
            tc.verifyTrue(all(isnan(R.t_emg_s)) || mean(isnan(R.t_emg_s)) > 0.5);
        end
    end
end
