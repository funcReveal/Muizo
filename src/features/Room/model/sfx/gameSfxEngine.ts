export type SfxPresetId = "arcade" | "focus" | "soft";

export type GameSfxEvent =
  | "countdown"
  | "countdownFinal"
  | "urgency"
  | "deadlineTick"
  | "deadlineFinal"
  | "go"
  | "lock"
  | "reveal"
  | "combo"
  | "comboBreak"
  | "correct"
  | "wrong"
  | "unanswered";

type SfxStep = {
  atSec: number;
  durationSec: number;
  freq: number;
  endFreq?: number;
  gain: number;
  type: OscillatorType;
};

type SfxPresetProfile = {
  id: SfxPresetId;
  label: string;
  hint: string;
  pitchMul: number;
  gainMul: number;
  primaryWave: OscillatorType;
  accentWave: OscillatorType;
  softWave: OscillatorType;
};

const SFX_PRESET_PROFILES: Record<SfxPresetId, SfxPresetProfile> = {
  arcade: {
    id: "arcade",
    label: "Arcade",
    hint: "銳利、搶答感強",
    pitchMul: 1,
    gainMul: 1,
    primaryWave: "square",
    accentWave: "triangle",
    softWave: "sine",
  },
  focus: {
    id: "focus",
    label: "Focus",
    hint: "乾淨提示音",
    pitchMul: 0.95,
    gainMul: 0.9,
    primaryWave: "triangle",
    accentWave: "sine",
    softWave: "sine",
  },
  soft: {
    id: "soft",
    label: "Soft",
    hint: "較柔和、不刺耳",
    pitchMul: 0.9,
    gainMul: 0.75,
    primaryWave: "sine",
    accentWave: "triangle",
    softWave: "sine",
  },
};

export const parseStoredSfxPreset = (value: string | null): SfxPresetId => {
  if (value === "arcade" || value === "focus" || value === "soft") {
    return value;
  }
  return "arcade";
};

export const resolveCountdownSfxEvent = (
  countdownSec: number,
): GameSfxEvent => {
  if (countdownSec <= 1) return "countdownFinal";
  if (countdownSec === 2) return "urgency";
  return "countdown";
};

export const resolveGuessDeadlineSfxEvent = (
  countdownSec: number,
): GameSfxEvent => {
  if (countdownSec <= 1) return "deadlineFinal";
  return "deadlineTick";
};

const getSfxSteps = (preset: SfxPresetProfile, event: GameSfxEvent): SfxStep[] => {
  const p = (freq: number) => Math.max(40, freq * preset.pitchMul);
  const g = (gain: number) => Math.max(0.0001, gain * preset.gainMul);
  switch (event) {
    case "countdown":
      return [
        {
          atSec: 0,
          durationSec: 0.08,
          freq: p(980),
          endFreq: p(920),
          gain: g(0.18),
          type: preset.accentWave,
        },
      ];
    case "countdownFinal":
      return [
        {
          atSec: 0,
          durationSec: 0.11,
          freq: p(1320),
          endFreq: p(1180),
          gain: g(0.22),
          type: preset.primaryWave,
        },
      ];
    case "urgency":
      return [
        {
          atSec: 0,
          durationSec: 0.06,
          freq: p(1180),
          endFreq: p(1240),
          gain: g(0.13),
          type: preset.primaryWave,
        },
      ];
    case "deadlineTick":
      return [
        {
          atSec: 0,
          durationSec: 0.045,
          freq: p(1180),
          endFreq: p(1260),
          gain: g(0.065),
          type: preset.accentWave,
        },
        {
          atSec: 0.04,
          durationSec: 0.05,
          freq: p(1320),
          endFreq: p(1420),
          gain: g(0.055),
          type: preset.softWave,
        },
      ];
    case "deadlineFinal":
      return [
        {
          atSec: 0,
          durationSec: 0.05,
          freq: p(1380),
          endFreq: p(1480),
          gain: g(0.075),
          type: preset.primaryWave,
        },
        {
          atSec: 0.045,
          durationSec: 0.06,
          freq: p(1560),
          endFreq: p(1680),
          gain: g(0.065),
          type: preset.accentWave,
        },
        {
          atSec: 0.11,
          durationSec: 0.04,
          freq: p(1320),
          endFreq: p(1180),
          gain: g(0.045),
          type: preset.softWave,
        },
      ];
    case "lock":
      return [
        {
          atSec: 0,
          durationSec: 0.055,
          freq: p(760),
          endFreq: p(840),
          gain: g(0.15),
          type: preset.accentWave,
        },
        {
          atSec: 0.07,
          durationSec: 0.06,
          freq: p(940),
          endFreq: p(1120),
          gain: g(0.11),
          type: preset.softWave,
        },
      ];
    case "go":
      return [
        {
          atSec: 0,
          durationSec: 0.06,
          freq: p(760),
          endFreq: p(920),
          gain: g(0.12),
          type: preset.softWave,
        },
        {
          atSec: 0.045,
          durationSec: 0.09,
          freq: p(1040),
          endFreq: p(1360),
          gain: g(0.13),
          type: preset.accentWave,
        },
        {
          atSec: 0.11,
          durationSec: 0.08,
          freq: p(1480),
          endFreq: p(1680),
          gain: g(0.1),
          type: preset.primaryWave,
        },
      ];
    case "reveal":
      return [
        {
          atSec: 0,
          durationSec: 0.08,
          freq: p(520),
          endFreq: p(640),
          gain: g(0.11),
          type: preset.softWave,
        },
        {
          atSec: 0.06,
          durationSec: 0.12,
          freq: p(720),
          endFreq: p(980),
          gain: g(0.15),
          type: preset.accentWave,
        },
      ];
    case "combo":
      return [
        {
          atSec: 0,
          durationSec: 0.06,
          freq: p(1040),
          endFreq: p(1180),
          gain: g(0.11),
          type: preset.accentWave,
        },
        {
          atSec: 0.055,
          durationSec: 0.075,
          freq: p(1320),
          endFreq: p(1520),
          gain: g(0.1),
          type: preset.primaryWave,
        },
      ];
    case "comboBreak":
      return [
        {
          atSec: 0,
          durationSec: 0.07,
          freq: p(430),
          endFreq: p(360),
          gain: g(0.09),
          type: preset.softWave,
        },
        {
          atSec: 0.05,
          durationSec: 0.09,
          freq: p(330),
          endFreq: p(240),
          gain: g(0.08),
          type: "sawtooth",
        },
      ];
    case "correct":
      return [
        {
          atSec: 0,
          durationSec: 0.08,
          freq: p(740),
          endFreq: p(880),
          gain: g(0.16),
          type: preset.accentWave,
        },
        {
          atSec: 0.07,
          durationSec: 0.1,
          freq: p(988),
          endFreq: p(1175),
          gain: g(0.14),
          type: preset.primaryWave,
        },
        {
          atSec: 0.14,
          durationSec: 0.14,
          freq: p(1318),
          endFreq: p(1480),
          gain: g(0.12),
          type: preset.softWave,
        },
      ];
    case "wrong":
      return [
        {
          atSec: 0,
          durationSec: 0.1,
          freq: p(520),
          endFreq: p(420),
          gain: g(0.14),
          type: preset.primaryWave,
        },
        {
          atSec: 0.09,
          durationSec: 0.14,
          freq: p(380),
          endFreq: p(260),
          gain: g(0.12),
          type: "sawtooth",
        },
      ];
    case "unanswered":
      return [
        {
          atSec: 0,
          durationSec: 0.11,
          freq: p(430),
          endFreq: p(350),
          gain: g(0.09),
          type: preset.softWave,
        },
      ];
    default:
      return [];
  }
};

const scheduleSfxStep = (
  ctx: AudioContext,
  destination: AudioNode,
  baseTime: number,
  step: SfxStep,
) => {
  const startAt = baseTime + Math.max(0, step.atSec);
  const durationSec = Math.max(0.03, step.durationSec);
  const endAt = startAt + durationSec;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = step.type;
  osc.frequency.setValueAtTime(Math.max(1, step.freq), startAt);
  if (typeof step.endFreq === "number" && step.endFreq > 0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, step.endFreq), endAt);
  }
  const peakGain = Math.max(0.0001, step.gain);
  const attackSec = Math.min(0.012, durationSec * 0.35);
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(peakGain, startAt + attackSec);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);
  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(startAt);
  osc.stop(endAt + 0.02);
};

export const playSynthSfx = (
  ctx: AudioContext,
  presetId: SfxPresetId,
  event: GameSfxEvent,
  volumeRatio: number,
  offsetSec = 0,
) => {
  const preset = SFX_PRESET_PROFILES[presetId];
  const steps = getSfxSteps(preset, event);
  if (steps.length === 0) return;

  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const limiter = ctx.createDynamicsCompressor();
  const baseTime = ctx.currentTime + Math.max(0, offsetSec);
  const safeVolume = Math.min(1, Math.max(0, volumeRatio));

  filter.type = "highpass";
  filter.frequency.setValueAtTime(90, baseTime);
  limiter.threshold.setValueAtTime(-16, baseTime);
  limiter.knee.setValueAtTime(10, baseTime);
  limiter.ratio.setValueAtTime(10, baseTime);
  limiter.attack.setValueAtTime(0.002, baseTime);
  limiter.release.setValueAtTime(0.06, baseTime);

  master.gain.setValueAtTime(0.0001, baseTime);
  master.gain.linearRampToValueAtTime(0.5 * safeVolume, baseTime + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, baseTime + 0.45);

  master.connect(filter);
  filter.connect(limiter);
  limiter.connect(ctx.destination);

  steps.forEach((step) => {
    scheduleSfxStep(ctx, master, baseTime, step);
  });
};
