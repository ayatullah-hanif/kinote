function storeAppend(name, row)
% Add one row (a one-row table) to a store table, creating the file if needed.
root = fullfile(fileparts(mfilename("fullpath")), "store");
if ~isfolder(root), mkdir(root); end
f = fullfile(root, string(name) + ".csv");
if isfile(f)
    writetable(row, f, "WriteMode", "append", "WriteVariableNames", false, "QuoteStrings", true);
else
    writetable(row, f, "QuoteStrings", true);
end
end