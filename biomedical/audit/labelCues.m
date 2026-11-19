function F = labelCues(F)
% Adds the cue labels: which side the recording is about, whether the cue is the
% movement cue (isTarget), and the muscle value and quality of the tested hand.
F.patient = string(F.patient);
F.block = string(F.block);
F.cue = string(F.cue);
F.blockSide = extractBefore(F.block, digitsPattern);
cueSide = replace(F.cue, "flash_", "");
F.isTarget = (cueSide == "l" & F.blockSide == "left") | (cueSide == "r" & F.blockSide == "right");
isRight = F.blockSide == "right";
F.emgTarget = F.emgL_ratio;   F.emgTarget(isRight) = F.emgR_ratio(isRight);
F.qEmgTarget = F.qEmgL;       F.qEmgTarget(isRight) = F.qEmgR(isRight);
end
