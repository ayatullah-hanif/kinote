function P = researchPaths()
% Folders used by the research scripts. Creates the output folders if missing.
auditDir = fileparts(which("sessionInsights"));
assert(~isempty(auditDir), "Run setupProject first (from the kinote folder).");
root = fileparts(fileparts(auditDir));
P.root = root;
P.audit = auditDir;
P.out = fullfile(root, "research_results");
P.cache = fullfile(root, "research_cache");
P.web = fullfile(root, "web", "data");
dirs = {P.out, P.cache, P.web};
for k = 1:numel(dirs)
    if ~isfolder(dirs{k}), mkdir(dirs{k}); end
end
end
