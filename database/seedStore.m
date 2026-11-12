function seedStore()
% Create the starter data. Safe to re-run: it never overwrites existing files.
root = fullfile(fileparts(mfilename("fullpath")), "store");
if ~isfolder(root), mkdir(root); end

ids  = ["L_01";"L_06";"R_02";"R_10"];
hand = ["left";"left";"right";"right"];
f = fullfile(root, "patients.csv");
if ~isfile(f)
    writetable(table(ids, hand, 'VariableNames', {'patient_id','affected_hand'}), f, "QuoteStrings", true);
end

f = fullfile(root, "exercises.csv");
if ~isfile(f)
    writetable(table(ids, repmat("Elbow bend", 4, 1), repmat(8, 4, 1), ...
        repmat("Sit upright with your arm out to the side. Bend and straighten slowly, 8 times.", 4, 1), ...
        'VariableNames', {'patient_id','exercise','target_reps','instruction'}), f, "QuoteStrings", true);
end

f = fullfile(root, "messages.csv");
if ~isfile(f)
    t = repmat(string(datetime("now", "Format", "yyyy-MM-dd HH:mm")), 4, 1);
    writetable(table(t, repmat("doctor", 4, 1), repmat("patient", 4, 1), ids, ...
        repmat("Welcome to Kinote. Please do your elbow exercise today and send a short video.", 4, 1), ...
        'VariableNames', {'time','sender','recipient','patient_id','text'}), f, "QuoteStrings", true);
end
end