function T = storeRead(name)
% Read one table from the app's data store. Returns an empty table if it doesn't exist yet.
root = fullfile(fileparts(mfilename("fullpath")), "store");
f = fullfile(root, string(name) + ".csv");
if isfile(f)
    T = readtable(f, "TextType", "string", "Delimiter", ",");
else
    T = table();
end
end