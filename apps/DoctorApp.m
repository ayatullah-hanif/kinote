function DoctorApp()
% Kinote physiotherapist dashboard: movement, replayed EEG/EMG signals, messages.
th = kinoteTheme();
fig = uifigure("Name", "Kinote - Physiotherapist", "Position", [60 60 1150 700], "Color", th.bg);
patients = storeRead("patients");
ids = cellstr(string(patients.patient_id));
pid = string(ids{1});
res = loadFusion("fusion_results.csv");
resDeg = loadFusion("fusion_results_degraded.csv");
useDeg = false;
clipList = strings(0,1);
selRow = 1;

mainGrid = uigridlayout(fig, [2 1]);
mainGrid.RowHeight = {60, '1x'};
mainGrid.BackgroundColor = th.bg;
topBar = uipanel(mainGrid, "BackgroundColor", th.primary, "BorderType", "none");
topGrid = uigridlayout(topBar, [1 3]);
topGrid.ColumnWidth = {'1x', 70, 170};
topGrid.BackgroundColor = th.primary;
uilabel(topGrid, "Text", "Kinote  -  Physiotherapist dashboard", "FontSize", 22, ...
    "FontWeight", "bold", "FontColor", [1 1 1]);
uilabel(topGrid, "Text", "Patient", "FontColor", [1 1 1], "HorizontalAlignment", "right");
ddPatient = uidropdown(topGrid, "Items", ids, "Value", ids{1}, ...
    "ValueChangedFcn", @(s,~) switchPatient(string(s.Value)));
tg = uitabgroup(mainGrid);
buildTabs(1);

    function r = loadFusion(fname)
        f = fullfile(fileparts(which("sessionInsights")), fname);
        if isempty(which("sessionInsights")) || ~isfile(f)
            r = table();
            return
        end
        r = readtable(f);
        r.patient = string(r.patient);
        r.state = string(r.state);
        r.file = string(r.file);
    end

    function setMode(v)
        useDeg = strcmp(v, 'Degraded replay');
        buildTabs(2);
    end

    function switchPatient(id)
        pid = id;
        buildTabs(1);
    end

    function buildTabs(sel)
        delete(tg.Children);
        t1 = uitab(tg, "Title", "Movement (camera)");
        t2 = uitab(tg, "Title", "Muscle and brain signals");
        t3 = uitab(tg, "Title", "Messages");
        tabMovement(t1);
        tabSignals(t2);
        tabMessages(t3);
        tg.SelectedTab = tg.Children(sel);
    end

    function tabMovement(tab)
        S = storeRead("sessions");
        g = uigridlayout(tab, [4 1]);
        g.RowHeight = {28, '1x', '1x', 40};
        uilabel(g, "Text", "[Measured] Camera movement analysis of the patient's saved sessions", ...
            "FontWeight", "bold", "FontColor", th.muted);
        if isempty(S) || ~any(strcmp(cellstr(S.patient_id), char(pid)))
            l = uilabel(g, "Text", "No sessions recorded yet for " + pid + ".", ...
                "FontSize", 16, "FontColor", th.muted);
            l.Layout.Row = 2;
            return
        end
        S = S(strcmp(cellstr(S.patient_id), char(pid)), :);
        ok = string(S.status) == "recorded";
        x = 1:height(S);
        ax = uiaxes(g);
        ax.Layout.Row = 2;
        if any(ok)
            bar(ax, x(ok), S.repetitions(ok), "FaceColor", th.primary);
        end
        xlim(ax, [0 height(S)+1]); ax.YGrid = "on";
        title(ax, "Repetitions per session (sessions with poor tracking are left out)");
        xlabel(ax, "Session, oldest to newest"); ylabel(ax, "Repetitions");
        reps = string(S.repetitions);  reps(~ok) = "not tracked";
        rom = string(round(S.range_of_motion_deg)) + " deg";  rom(~ok) = "not tracked";
        state = repmat("Tracked", height(S), 1);
        state(~ok) = "Withheld: poor tracking";
        data = table(string(S.time), reps, rom, string(round(100*S.visibility)) + "%", ...
            state, string(S.source), ...
            'VariableNames', {'Time','Repetitions','Range of motion','Tracking','Result','Source'});
        tb = uitable(g, "Data", data);
        tb.Layout.Row = 3;
        clipList = string(S.clip);
        selRow = height(S);
        tb.CellSelectionCallback = @(~,e) pickRow(e.Indices);
    end

    function tabSignals(tab)
        g = uigridlayout(tab, [4 3]);
        g.RowHeight = {40, 170, 24, '1x'};
        g.ColumnWidth = {'1x', 190, 150};
        R = res;
        mv = 'Clean replay';
        msg = "[Replayed recording] Results from a research dataset recording, not this patient's live session.";
        if useDeg
            R = resDeg;
            mv = 'Degraded replay';
            msg = "[Replayed recording, simulated damage] A loose muscle electrode was added to some cues to test how the system reacts.";
        end
        b = uilabel(g, "Text", msg, "FontWeight", "bold", "FontColor", th.warn, "WordWrap", "on");
        b.Layout.Row = 1; b.Layout.Column = 1;
        md = uidropdown(g, "Items", {'Clean replay','Degraded replay'}, "Value", mv, ...
            "ValueChangedFcn", @(s,~) setMode(s.Value));
        md.Layout.Row = 1; md.Layout.Column = 2;
        if isempty(R) || ~any(R.patient == pid)
            l = uilabel(g, "Text", "No data for " + pid + " in this mode. The degraded demo is available for L_06.", ...
                "FontSize", 16, "FontColor", th.muted);
            l.Layout.Row = 2; l.Layout.Column = [1 3];
            return
        end
        sess = unique(R.session(R.patient == pid))';
        dd = uidropdown(g, "Items", cellstr("Session " + string(sess)), ...
            "ItemsData", num2cell(sess), "Value", sess(end));
        dd.Layout.Row = 1; dd.Layout.Column = 3;
        ta = uitextarea(g, "Editable", "off", "FontSize", 14);
        ta.Layout.Row = 2; ta.Layout.Column = [1 3];
        l2 = uilabel(g, "Text", "Cue by cue: was a movement attempt detected?", "FontWeight", "bold", "FontColor", th.muted);
        l2.Layout.Row = 3; l2.Layout.Column = [1 3];
        tb = uitable(g);
        tb.Layout.Row = 4; tb.Layout.Column = [1 3];
        dd.ValueChangedFcn = @(s,~) fillSignals(R, s.Value, ta, tb);
        fillSignals(R, sess(end), ta, tb);
    end

    function fillSignals(R, s, ta, tb)
        lines = sessionInsights(R, pid, s);
        ta.Value = cellstr(lines(:));
        r = R(R.patient == pid & R.session == s, :);
        dmg = repmat("", height(r), 1);
        if ismember("damaged", r.Properties.VariableNames)
            dmg(r.damaged == 1) = "simulated";
        end
        fs = string(round(r.fused, 2));
        fs(r.state == "can't tell") = "withheld";
        data = table(r.cue_time, string(r.cue), string(r.block), r.state, fs, ...
            round(r.trust, 2), dmg, ...
            'VariableNames', {'Cue time (s)','Cue','Recording','State','Fused score','Trust','Damage'});
        tb.Data = data;
        removeStyle(tb);
        idx = find(string(data.State) == "can't tell");
        if ~isempty(idx)
            addStyle(tb, uistyle("BackgroundColor", [1 0.92 0.75], "FontColor", [0.1 0.15 0.17]), "row", idx);
        end
    end

    function tabMessages(tab)
        msgs = storeRead("messages");
        msgs = msgs(strcmp(cellstr(msgs.patient_id), char(pid)), :);
        g = uigridlayout(tab, [2 2]);
        g.RowHeight = {'1x', 40};
        g.ColumnWidth = {'1x', 110};
        data = table(string(msgs.time), msgs.sender, msgs.text, 'VariableNames', {'Time','From','Message'});
        tb = uitable(g, "Data", data, "ColumnWidth", {130, 70, 'auto'});
        tb.Layout.Row = 1; tb.Layout.Column = [1 2];
        ef = uieditfield(g, "text", "Placeholder", "Write a message to the patient");
        ef.Layout.Row = 2; ef.Layout.Column = 1;
        sb = uibutton(g, "Text", "Send", "BackgroundColor", th.primary, "FontColor", [1 1 1], ...
            "ButtonPushedFcn", @(~,~) sendMsg(ef));
        sb.Layout.Row = 2; sb.Layout.Column = 2;
    end

    function sendMsg(ef)
        txt = strtrim(string(ef.Value));
        if txt == "", return, end
        row = table(string(datetime("now", "Format", "yyyy-MM-dd HH:mm")), "doctor", "patient", pid, txt, ...
            'VariableNames', {'time','sender','recipient','patient_id','text'});
        storeAppend("messages", row);
        buildTabs(3);
    end

    function pickRow(idx)
        if ~isempty(idx), selRow = idx(1,1); end
    end
end