function lines = sessionInsights(res, patient, session)
% Plain-language summary of one patient session. Template-based, no AI model.
patient = string(patient);
pat = string(res.patient) == patient;
r = res(pat & res.session == session, :);
assert(~isempty(r), "No rows for that patient and session.");
s = sessionStats(r);

lines = strings(0,1);
lines(end+1) = sprintf("[Measured] Session %d: %d recordings, %d cues.", ...
    session, s.nFiles, s.nCues);
lines(end+1) = sprintf("[Measured] Recording quality: median trust %.2f. %d of %d cues (%.0f%%) were withheld because the data was too poor.", ...
    s.trust, s.nWithheld, s.nCues, 100*s.withheldShare);
lines(end+1) = sprintf("[Model estimate] A movement attempt was detected on %d of %d answered cues for the tested hand (%.0f%%).", ...
    s.nAttempt, s.nTargetAnswered, 100*s.rate);

% Compare with the closest earlier session, only if the data supports it
earlier = unique(res.session(pat & res.session < session));
if ~isempty(earlier)
    p = max(earlier);
    sp = sessionStats(res(pat & res.session == p, :));
    if max(s.withheldShare, sp.withheldShare) > 0.3 || ...
            min(s.nTargetAnswered, sp.nTargetAnswered) < 10
        lines(end+1) = sprintf("[Model estimate] Comparison with session %d withheld: too much poor-quality data or too few answered cues to compare reliably.", p);
    else
        d = s.rate - sp.rate;
        margin = 1.96 * sqrt(s.rate*(1-s.rate)/s.nTargetAnswered + ...
            sp.rate*(1-sp.rate)/sp.nTargetAnswered);
        if abs(d) <= margin
            lines(end+1) = sprintf("[Model estimate] Compared with session %d (%.0f%%), the detected attempt rate is %+.0f points different, which is within what chance alone could produce with this few cues. No change reported.", ...
                p, 100*sp.rate, 100*d);
        else
            lines(end+1) = sprintf("[Model estimate] Compared with session %d (%.0f%%), the detected attempt rate differs by %+.0f percentage points, more than chance alone would explain. This is descriptive only, not a measure of recovery.", ...
                p, 100*sp.rate, 100*d);
        end
    end
end
lines(end+1) = "Automatic summary from recorded signals. It is not a diagnosis and does not change the therapy programme.";
end

function s = sessionStats(r)
state = string(r.state);
answered = state ~= "can't tell";
tgtAns = (r.truth == 1) & answered;
s.nFiles = numel(unique(string(r.file)));
s.nCues = height(r);
s.nWithheld = sum(~answered);
s.withheldShare = s.nWithheld / s.nCues;
s.nTargetAnswered = sum(tgtAns);
s.nAttempt = sum(tgtAns & state == "attempt");
s.rate = s.nAttempt / max(s.nTargetAnswered, 1);
s.trust = median(r.trust, "omitnan");
end