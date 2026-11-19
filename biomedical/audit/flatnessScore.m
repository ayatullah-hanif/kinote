function s = flatnessScore(lens, ref)
% Out-of-plane check for the camera. A real arm segment has a fixed length, but looks
% shorter in a 2D picture when the arm turns away from the camera plane.
%   lens: N x 2 apparent pixel lengths [upper arm, forearm], one row per frame
%   ref:  1 x 2 reference lengths (the longest seen for this person, arm flat to camera)
% s = 1 means flat to the camera; lower means the angle is less trustworthy.
s = min(min(lens ./ ref, 1), [], 2);
end
