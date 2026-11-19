classdef KinoteTests < matlab.unittest.TestCase
    % Unit tests for the Kinote research code. Run: runtests("tests/KinoteTests.m")
    methods (Test)
        function rightAngle(tc)
            tc.verifyEqual(jointAngle([0 0], [0 -1], [1 -1]), 90, "AbsTol", 1e-6);
        end
        function straightArm(tc)
            tc.verifyEqual(jointAngle([0 0], [1 0], [2 0]), 180, "AbsTol", 1e-6);
        end
        function foldedArm(tc)
            tc.verifyEqual(jointAngle([0 0], [1 0], [0 0]), 0, "AbsTol", 1e-4);
        end
        function eightBends(tc)
            [t, a] = KinoteTests.bendSignal();
            tc.verifyEqual(countReps(a, t), 8);
        end
        function singleGlitchIsNotARep(tc)
            [t, a] = KinoteTests.bendSignal();
            a(26) = a(26) - 60;
            tc.verifyEqual(countReps(a, t), 8);
        end
        function flatSignalHasNoReps(tc)
            t = (0:0.1:10)';
            tc.verifyEqual(countReps(150 * ones(size(t)), t), 0);
        end
        function mostlyMissingHasNoReps(tc)
            t = (0:0.1:10)';
            a = nan(size(t)); a(1:3) = [100 120 140];
            [reps, rom] = countReps(a, t);
            tc.verifyEqual(reps, 0);
            tc.verifyTrue(isnan(rom));
        end
        function clopperPearsonKnownValue(tc)
            tc.verifyEqual(clopperPearsonUpper(0, 10, 0.1), 1 - 0.1^(1/10), "AbsTol", 1e-4);
            tc.verifyEqual(clopperPearsonUpper(5, 5, 0.1), 1);
            tc.verifyEqual(clopperPearsonUpper(0, 0, 0.1), 1);
        end
        function riskControlKeepsErrorUnderTarget(tc)
            n = 2000;
            score = (1:n)' / n;
            err = zeros(n, 1);
            low = score < 0.5;
            err(low) = double(mod(find(low), 2) == 0);
            thr = riskControlThreshold(score, err, 0.10, 0.10);
            a = score >= thr;
            tc.verifyLessThanOrEqual(mean(err(a)), 0.10);
            tc.verifyGreaterThanOrEqual(mean(a), 0.5);
        end
        function riskControlWithholdsWhenImpossible(tc)
            thr = riskControlThreshold(rand(100, 1), ones(100, 1), 0.10, 0.10);
            tc.verifyEqual(thr, Inf);
        end
        function aucPerfectReversedAndTied(tc)
            tc.verifyEqual(aucScore([0 0 1 1], [1 2 3 4]), 1);
            tc.verifyEqual(aucScore([0 0 1 1], [4 3 2 1]), 0);
            tc.verifyEqual(aucScore([0 1 0 1], [5 5 5 5]), 0.5);
        end
        function dropoutFlattensMuscleOnly(tc)
            rec = KinoteTests.fakeRec();
            [rec2, dmg] = degradeRecording(rec, "emg_dropout", 1, 0.5, 1);
            tc.verifyEqual(sum(dmg), 2);
            t0 = rec.events.time_s(find(dmg, 1));
            w = round((t0 - 1) * 500) : round((t0 + 1) * 500);
            tc.verifyLessThan(std(rec2.data(w, 3)), 0.5 * std(rec.data(w, 3)));
            tc.verifyEqual(rec2.data(:, 1), rec.data(:, 1));
        end
        function noDamageLeavesDataAlone(tc)
            rec = KinoteTests.fakeRec();
            [rec2, dmg] = damageAny(rec, "none", 0, 0, 1);
            tc.verifyEqual(rec2.data, rec.data);
            tc.verifyFalse(any(dmg));
        end
        function humAddsPower(tc)
            rec = KinoteTests.fakeRec();
            [rec2, dmg] = damageExtra(rec, "emg_hum", 3, 0.5, 1);
            t0 = rec.events.time_s(find(dmg, 1));
            w = round((t0 - 1) * 500) : round((t0 + 1) * 500);
            tc.verifyGreaterThan(std(rec2.data(w, 3)), 1.5 * std(rec.data(w, 3)));
        end
        function flatnessDropsWhenArmTurns(tc)
            tc.verifyEqual(flatnessScore([100 100], [100 100]), 1);
            tc.verifyEqual(flatnessScore([100 50], [100 100]), 0.5, "AbsTol", 1e-9);
        end
        function quality2FlagsAFlatMuscleCue(tc)
            rng(5);
            fs = 500; n = 60 * fs;
            pre.fs = fs; pre.t = (0:n-1)' / fs;
            pre.eeg = randn(n, 2); pre.emg = randn(n, 2);
            pre.emg(pre.t >= 28 & pre.t < 33, 1) = 0.05 * pre.emg(pre.t >= 28 & pre.t < 33, 1);
            pre.events = table([10;20;30;40;50], repmat("flash_l", 5, 1), zeros(5, 1), ...
                'VariableNames', {'time_s','label','duration_s'});
            q = computeCueQuality2(pre);
            tc.verifyLessThan(q.q2EmgL(3), 0.3);
            tc.verifyGreaterThan(median(q.q2EmgL([1 2 4 5])), 0.7);
            tc.verifyTrue(all(q.q2EmgL >= 0 & q.q2EmgL <= 1));
        end
        function fusionSeparatesAndAbstains(tc)
            rng(2);
            n = 80;
            isT = [true(n/2, 1); false(n/2, 1)];
            f = table();
            f.patient = repmat("P1", n, 1);
            f.blockSide = repmat("left", n, 1);
            f.isTarget = isT;
            e = 1 + 0.1 * abs(randn(n, 1));
            e(isT) = 3 + 0.2 * randn(sum(isT), 1);
            f.emgTarget = e;
            f.muL_change = 10 * randn(n, 1); f.muR_change = 10 * randn(n, 1);
            f.betaL_change = 10 * randn(n, 1); f.betaR_change = 10 * randn(n, 1);
            f.qEmgTarget = ones(n, 1); f.qEegL = ones(n, 1); f.qEegR = ones(n, 1);
            out = fuseCues(f, 0.6);
            tc.verifyGreaterThan(mean((out.fused > 1) == out.truth), 0.85);
            f.qEmgTarget(1) = 0;
            out2 = fuseCues(f, 0.6);
            tc.verifyEqual(out2.abstain(1), 1);
        end
    end
    methods (Static)
        function [t, a] = bendSignal()
            t = (0:0.1:20)';
            a = 110 + 60 * cos(2 * pi * t / 2.5);
        end
        function rec = fakeRec()
            rng(3);
            fs = 500; n = 30 * fs;
            labels = ["C3" "C4" "LH" "RH"];
            ev = table([5; 10; 15; 20], ["flash_l"; "flash_r"; "flash_l"; "flash_r"], zeros(4, 1), ...
                'VariableNames', {'time_s','label','duration_s'});
            rec = struct("file", "fake", "fs", fs, "labels", labels, "data", randn(n, 4), "events", ev);
        end
    end
end
