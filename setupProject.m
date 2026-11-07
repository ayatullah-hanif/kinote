function setupProject()
% SETUPPROJECT  Adds all code folders to the MATLAB path. Run once per session.
root = fileparts(mfilename("fullpath"));
addpath(root);
folders = ["apps","vision","biomedical","fusion","integration","database","config","tests"];
for f = folders
    p = fullfile(root, f);
    if isfolder(p)
        addpath(genpath(p));
    end
end
fprintf("Project paths set. Root: %s\n", root);
end
