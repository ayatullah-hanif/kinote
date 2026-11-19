function C = sweepConditions()
% The damage conditions. group: clean | seen (damage types that existed when the
% quality score v1 was designed) | heldout (new types, never used to design anything).
name = ["clean"; "emg_noise_8"; "emg_dropout_1"; "eeg_spike_10"; ...
        "emg_pops_10"; "emg_hum_3"; "emg_attenuation_0.3"; "eeg_noise_6"];
type = ["none"; "emg_noise"; "emg_dropout"; "eeg_spike"; ...
        "emg_pops"; "emg_hum"; "emg_attenuation"; "eeg_noise"];
severity = [0; 8; 1; 10; 10; 3; 0.3; 6];
fraction = [0; 0.25; 0.25; 0.25; 0.25; 0.25; 0.25; 0.25];
group = ["clean"; "seen"; "seen"; "seen"; "heldout"; "heldout"; "heldout"; "heldout"];
C = table(name, type, severity, fraction, group);
end
