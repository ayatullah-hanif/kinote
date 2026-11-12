function PatientApp()
% Kinote patient app. Step 1: login, home, messages. Session and progress come next.
th = kinoteTheme();
fig = uifigure("Name", "Kinote - Patient", "Position", [80 80 1000 640], "Color", th.bg);
patients = storeRead("patients");
pid = "";
cp = [];
showLogin();

    function showLogin()
        delete(fig.Children);
        g = uigridlayout(fig, [6 3]);
        g.RowHeight = {'1x', 60, 30, 40, 40, '1x'};
        g.ColumnWidth = {'1x', 300, '1x'};
        g.BackgroundColor = th.bg;
        t = uilabel(g, "Text", "Kinote", "FontSize", 36, "FontWeight", "bold", ...
            "FontColor", th.primary, "HorizontalAlignment", "center");
        t.Layout.Row = 2; t.Layout.Column = 2;
        s = uilabel(g, "Text", "Choose your patient ID to begin", ...
            "HorizontalAlignment", "center", "FontColor", th.muted);
        s.Layout.Row = 3; s.Layout.Column = 2;
        dd = uidropdown(g, "Items", cellstr(patients.patient_id));
        dd.Layout.Row = 4; dd.Layout.Column = 2;
        b = uibutton(g, "Text", "Continue", "BackgroundColor", th.primary, ...
            "FontColor", [1 1 1], "FontWeight", "bold", ...
            "ButtonPushedFcn", @(~,~) showMain(string(dd.Value)));
        b.Layout.Row = 5; b.Layout.Column = 2;
    end

    function showMain(id)
        pid = id;
        delete(fig.Children);
        g = uigridlayout(fig, [1 2]);
        g.ColumnWidth = {190, '1x'};
        g.BackgroundColor = th.bg;
        side = uipanel(g, "BackgroundColor", th.primary, "BorderType", "none");
        sg = uigridlayout(side, [7 1]);
        sg.RowHeight = {50, 20, 40, 40, 40, 40, '1x'};
        sg.BackgroundColor = th.primary;
        l = uilabel(sg, "Text", "Kinote", "FontSize", 24, "FontWeight", "bold", "FontColor", [1 1 1]);
        l.Layout.Row = 1;
        l2 = uilabel(sg, "Text", "Patient " + pid, "FontColor", [0.8 0.92 0.92]);
        l2.Layout.Row = 2;
        names = ["Home" "Session" "Progress" "Messages"];
        for i = 1:4
            nb = uibutton(sg, "Text", names(i), "FontSize", 14, "HorizontalAlignment", "left", ...
                "BackgroundColor", th.primary, "FontColor", [1 1 1], ...
                "ButtonPushedFcn", @(~,~) showPage(names(i)));
            nb.Layout.Row = 2 + i;
        end
        cp = uipanel(g, "BackgroundColor", th.bg, "BorderType", "none");
        showPage("Home");
    end

    function showPage(name)
        delete(cp.Children);
        switch name
            case "Home",     pageHome();
            case "Session",  pageSession();
            case "Progress", pageProgress();
            case "Messages", pageMessages();
            otherwise
                g = uigridlayout(cp, [1 1]); g.BackgroundColor = th.bg;
                uilabel(g, "Text", name + " screen: coming in the next step.", ...
                    "FontSize", 16, "FontColor", th.muted, "HorizontalAlignment", "center");
        end
    end

    function pageHome()
        ex = storeRead("exercises");
        ex = ex(ex.patient_id == pid, :);
        msgs = storeRead("messages");
        msgs = msgs(msgs.patient_id == pid & msgs.recipient == "patient", :);
        g = uigridlayout(cp, [4 1]);
        g.RowHeight = {45, 190, 30, '1x'};
        g.BackgroundColor = th.bg;
        h = uilabel(g, "Text", "Today's exercise", "FontSize", 24, "FontWeight", "bold", "FontColor", th.text);
        h.Layout.Row = 1;
        card = uipanel(g, "BackgroundColor", th.panel);
        card.Layout.Row = 2;
        cg = uigridlayout(card, [3 1]);
        cg.RowHeight = {35, '1x', 45};
        cg.BackgroundColor = th.panel;
        uilabel(cg, "Text", ex.exercise(1) + "  -  " + ex.target_reps(1) + " repetitions", ...
            "FontSize", 18, "FontWeight", "bold", "FontColor", th.primary);
        uilabel(cg, "Text", ex.instruction(1), "WordWrap", "on", "FontSize", 14, "FontColor", th.text);
        uibutton(cg, "Text", "Start session", "FontSize", 15, "FontWeight", "bold", ...
            "BackgroundColor", th.primary, "FontColor", [1 1 1], ...
            "ButtonPushedFcn", @(~,~) showPage("Session"));
        m = uilabel(g, "Text", "Latest message from your physiotherapist", "FontWeight", "bold", "FontColor", th.muted);
        m.Layout.Row = 3;
        body = "No messages yet.";
        if ~isempty(msgs), body = msgs.text(end); end
        b = uilabel(g, "Text", body, "WordWrap", "on", "VerticalAlignment", "top", ...
            "FontSize", 14, "FontColor", th.text);
        b.Layout.Row = 4;
    end

    function pageMessages()
        msgs = storeRead("messages");
        msgs = msgs(msgs.patient_id == pid, :);
        g = uigridlayout(cp, [3 2]);
        g.RowHeight = {45, '1x', 40};
        g.ColumnWidth = {'1x', 110};
        g.BackgroundColor = th.bg;
        h = uilabel(g, "Text", "Messages", "FontSize", 24, "FontWeight", "bold", "FontColor", th.text);
        h.Layout.Row = 1; h.Layout.Column = [1 2];
        data = table(string(msgs.time), msgs.sender, msgs.text, 'VariableNames', {'Time','From','Message'});
        tb = uitable(g, "Data", data, "ColumnWidth", {130, 70, 'auto'});
        tb.Layout.Row = 2; tb.Layout.Column = [1 2];
        ef = uieditfield(g, "text", "Placeholder", "Write a message to your physiotherapist");
        ef.Layout.Row = 3; ef.Layout.Column = 1;
        sb = uibutton(g, "Text", "Send", "BackgroundColor", th.primary, "FontColor", [1 1 1], ...
            "ButtonPushedFcn", @(~,~) sendMessage(ef));
        sb.Layout.Row = 3; sb.Layout.Column = 2;
    end

    function sendMessage(ef)
        txt = strtrim(string(ef.Value));
        if txt == "", return, end
        row = table(string(datetime("now", "Format", "yyyy-MM-dd HH:mm")), "patient", "doctor", pid, txt, ...
            'VariableNames', {'time','sender','recipient','patient_id','text'});
        storeAppend("messages", row);
        showPage("Messages");
    end

    function pageSession()
        ex = storeRead("exercises");
        ex = ex(strcmp(cellstr(ex.patient_id), char(pid)), :);
        affRow = strcmp(cellstr(patients.patient_id), char(pid));
        aff = 'right';
        if any(affRow), aff = char(patients.affected_hand(find(affRow, 1))); end
        g = uigridlayout(cp, [5 3]);
        g.RowHeight = {45, '1x', 40, 40, 45};
        g.ColumnWidth = {'1x', 150, 150};
        g.BackgroundColor = th.bg;
        h = uilabel(g, "Text", "Exercise session", "FontSize", 24, "FontWeight", "bold", "FontColor", th.text);
        h.Layout.Row = 1; h.Layout.Column = [1 3];
        ax = uiaxes(g);
        ax.Layout.Row = 2; ax.Layout.Column = [1 3];
        ax.XTick = []; ax.YTick = []; ax.Box = "on"; ax.Toolbar.Visible = "off";
        stat = uilabel(g, "Text", "Choose the arm to track, then press Start.", ...
            "FontSize", 16, "FontWeight", "bold", "FontColor", th.text);
        stat.Layout.Row = 3; stat.Layout.Column = [1 3];
        info = uilabel(g, "Text", ex.instruction(1), "WordWrap", "on", "FontSize", 14, "FontColor", th.muted);
        info.Layout.Row = 4; info.Layout.Column = [1 3];
        armDD = uidropdown(g, "Items", {'right','left'}, "Value", aff);
        armDD.Layout.Row = 5; armDD.Layout.Column = 1;
        startBtn = uibutton(g, "Text", "Start", "FontWeight", "bold", ...
            "BackgroundColor", th.primary, "FontColor", [1 1 1]);
        startBtn.Layout.Row = 5; startBtn.Layout.Column = 2;
        stopBtn = uibutton(g, "Text", "Stop", "FontWeight", "bold", "Enable", "off");
        stopBtn.Layout.Row = 5; stopBtn.Layout.Column = 3;
        startBtn.ButtonPushedFcn = @(~,~) runSession(ax, stat, info, armDD.Value, ...
            ex.target_reps(1), ex.exercise(1), startBtn, stopBtn);
        stopBtn.ButtonPushedFcn = @(~,~) set(fig, "UserData", struct("stop", true));
    end

    function runSession(ax, stat, info, side, target, exName, startBtn, stopBtn)
        side = string(side);
        if side == "right", sh = 7; el = 9; wr = 11; else, sh = 6; el = 8; wr = 10; end
        startBtn.Enable = "off"; stopBtn.Enable = "on";
        fig.UserData = struct("stop", false);
        stat.FontColor = th.text;
        stat.Text = "Loading the tracker, the first time takes a moment...";
        drawnow
        try
            det = hrnetObjectKeypointDetector("human-full-body-w32");
            cam = webcam;
        catch err
            uialert(fig, err.message, "Could not start");
            startBtn.Enable = "on"; stopBtn.Enable = "off";
            return
        end
        maxSec = 45; redrawEvery = 4; minScore = 0.5; edgeMargin = 15;
        img = snapshot(cam);
        im = image(ax, imresize(img, 0.5));
        axis(ax, "image"); ax.XTick = []; ax.YTick = [];
        ln = line(ax, nan, nan, "Color", "g", "LineWidth", 3);
        frames = {}; n = 0; reps = 0; isDown = false;
        stat.Text = "Tracking. Do " + target + " slow bends, then press Stop.";
        t0 = tic;
        while toc(t0) < maxSec && isvalid(fig) && ~fig.UserData.stop
            img = snapshot(cam);
            n = n + 1; frames{n} = img;
            [kp, sc, ~] = detect(det, img, [1 1 size(img,2) size(img,1)]);
            kp = kp(:,:,1); sc = sc(:,1);
            p = kp([sh el wr], :);
            edgeHit = any(p(:,1) < edgeMargin | p(:,1) > size(img,2)-edgeMargin | ...
                          p(:,2) < edgeMargin | p(:,2) > size(img,1)-edgeMargin);
            ok = min(sc([sh el wr])) >= minScore && ~edgeHit;
            ang = NaN;
            if ok
                ang = jointAngle(p(1,:), p(2,:), p(3,:));
                if ang < 100, isDown = true; end
                if isDown && ang > 140, reps = reps + 1; isDown = false; end
            end
            if mod(n, redrawEvery) == 0
                set(im, "CData", imresize(img, 0.5));
                set(ln, "XData", p(:,1)/2, "YData", p(:,2)/2);
                if ok
                    stat.FontColor = th.text;
                    stat.Text = sprintf("Elbow %.0f deg      Live count: %d of %d", ang, reps, target);
                else
                    stat.FontColor = th.warn;
                    stat.Text = "Keep your arm fully in view.";
                end
                drawnow
            end
        end
        elapsed = toc(t0);
        clear cam
        if ~isvalid(fig), return, end
        stopBtn.Enable = "off";
        stat.FontColor = th.text;
        if n < 10
            stat.Text = "Session too short to analyse. Please try again.";
            startBtn.Enable = "on"; return
        end
        stat.Text = "Saving and analysing the clip, about 30 seconds..."; drawnow
        clipDir = fullfile(fileparts(which("storeRead")), "store", "clips");
        if ~isfolder(clipDir), mkdir(clipDir); end
        sid = "S" + string(datetime("now", "Format", "yyyyMMddHHmmss"));
        clipName = pid + "_" + sid + ".avi";
        clipFile = fullfile(clipDir, clipName);
        vw = VideoWriter(char(clipFile), "Motion JPEG AVI");
        vw.FrameRate = n / elapsed;
        open(vw);
        for k = 1:n, writeVideo(vw, frames{k}); end
        close(vw);
        try
            res = analyzeElbowVideo(clipFile, side);
        catch err
            uialert(fig, err.message, "Analysis failed");
            startBtn.Enable = "on"; return
        end
        row = table(sid, string(datetime("now", "Format", "yyyy-MM-dd HH:mm")), pid, string(exName), ...
            double(target), res.repetitions, res.range_of_motion_deg, res.visibility, ...
            res.edge_fraction, res.status, clipName, "live camera", ...
            'VariableNames', {'session_id','time','patient_id','exercise','target_reps', ...
            'repetitions','range_of_motion_deg','visibility','edge_fraction','status','clip','source'});
        storeAppend("sessions", row);
        if res.status == "low_tracking_quality"
            stat.FontColor = th.warn;
            stat.Text = "Your arm was not clearly tracked, so no result was recorded. Please try again.";
        else
            stat.Text = sprintf("Done: %d repetitions, range of motion %.0f degrees, tracking %.0f%%.", ...
                res.repetitions, res.range_of_motion_deg, 100*res.visibility);
        end
        info.Text = "Saved as session " + sid + ". Your physiotherapist can review it.";
        startBtn.Enable = "on";
    end

    function pageProgress()
        S = storeRead("sessions");
        g = uigridlayout(cp, [3 1]);
        g.RowHeight = {45, '1x', '1x'};
        g.BackgroundColor = th.bg;
        h = uilabel(g, "Text", "Your progress", "FontSize", 24, "FontWeight", "bold", "FontColor", th.text);
        h.Layout.Row = 1;
        if isempty(S) || ~any(strcmp(cellstr(S.patient_id), char(pid)))
            l = uilabel(g, "Text", "No sessions yet. Complete a session and it will appear here.", ...
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
            hold(ax, "on");
            plot(ax, [0 height(S)+1], [S.target_reps(1) S.target_reps(1)], "--", "Color", th.muted);
            hold(ax, "off");
        end
        xlim(ax, [0 height(S)+1]);
        ax.YGrid = "on";
        title(ax, "Repetitions per session (dashed line = target)");
        xlabel(ax, "Session, oldest to newest");
        ylabel(ax, "Repetitions");
        reps = string(S.repetitions);          reps(~ok) = "not tracked";
        rom  = string(round(S.range_of_motion_deg)) + " deg";  rom(~ok) = "not tracked";
        data = table(string(S.time), reps, rom, string(round(100*S.visibility)) + "%", string(S.status), ...
            'VariableNames', {'Time','Repetitions','Range of motion','Tracking','Status'});
        tb = uitable(g, "Data", data);
        tb.Layout.Row = 3;
    end
end