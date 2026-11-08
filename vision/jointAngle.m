function theta = jointAngle(A, B, C)
% Angle in degrees at point B, formed by the lines B-to-A and B-to-C.
BA = A - B;
BC = C - B;
c = dot(BA, BC) / (norm(BA) * norm(BC));
theta = acosd(min(max(c, -1), 1));
end