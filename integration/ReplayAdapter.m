classdef ReplayAdapter < handle
    % REPLAYADAPTER  Feeds a stored recording to the app in short segments,
    % as if it were arriving live. A future DeviceAdapter must expose the
    % same getNextSegment() method and return the same struct (see makeRecording).
    properties (Access = private)
        rec        % full recording struct from makeRecording
        pos = 1    % next sample to hand out
        segLen     % samples per segment
    end

    methods
        function obj = ReplayAdapter(rec, segSeconds)
            arguments
                rec (1,1) struct
                segSeconds (1,1) double {mustBePositive} = 2
            end
            obj.rec = rec;
            obj.segLen = round(segSeconds * rec.fs);
        end

        function seg = getNextSegment(obj)
            % Returns [] when the recording has been fully replayed.
            n = size(obj.rec.data, 2);
            if obj.pos > n
                seg = [];
                return
            end
            idx = obj.pos : min(obj.pos + obj.segLen - 1, n);
            seg = obj.rec;
            seg.data = obj.rec.data(:, idx);
            seg.timestamp = obj.rec.timestamp + seconds((obj.pos - 1) / obj.rec.fs);
            obj.pos = idx(end) + 1;
        end

        function reset(obj)
            obj.pos = 1;
        end
    end
end
