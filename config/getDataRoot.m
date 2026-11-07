function root = getDataRoot()
% GETDATAROOT  Returns this user's path to the shared data folder.
% The path differs per person, so it is stored in config/dataroot.txt
% (one line, the full folder path). That file is ignored by Git.
cfg = fullfile(fileparts(mfilename("fullpath")), "dataroot.txt");
if ~isfile(cfg)
    error("Create %s containing the full path to your copy of the shared data folder.", cfg);
end
root = string(strtrim(fileread(cfg)));
assert(isfolder(root), "Data folder not found: %s", root);
end
