export type RectifierTopology =
  | 'diode_bridge'
  | 'thyristor_controlled'
  | 'half_wave'
  | 'full_wave_center_tap'
  | 'single_phase_semi'
  | 'three_phase_bridge'
  | 'three_phase_controlled'
  | 'three_phase_semi'
  | '1phase_full_bridge'
  | '1phase_half_wave'
  | '3phase_full_bridge';

export type SwitchType = 'diode' | 'thyristor';

export type LoadType = 'R' | 'RL' | 'RLE' | 'I';

export interface TopologyOption {
  id: RectifierTopology;
  name: string;
  category: string;
  badge: string;
  description: string;
  defaultSwitchType: SwitchType;
}

export interface CircuitParameters {
  topology: RectifierTopology;
  switchType: SwitchType;
  alpha: number; // Firing angle in degrees (0 to 180)
  Vs_rms: number; // RMS AC voltage in Volts (e.g. 230)
  frequency: number; // Hz (e.g. 50)
  R: number; // Ohms (e.g. 20)
  L: number; // Henries (e.g. 0.045 for 45mH)
  E: number; // Back EMF in Volts (e.g. 0)
  hasFreewheelingDiode: boolean;
  isFWDActive?: boolean;
  loadType?: LoadType; // 'R' | 'RL' | 'RLE' | 'I'
  Idc?: number; // Constant DC current load in Amperes (e.g. 5.0 or 8.0)
  Ls?: number; // Source Inductance in mH (e.g. 1.5, 2.5)
  hasSourceInductance?: boolean;
  phaseMode?: '1-phase' | '3-phase';
  circuitType?: 'full-bridge' | 'half-wave';
  deviceMode?: 'all_diodes' | 'all_thyristors' | 'semi_conv';
  switchesOverride?: {
    [key: string]: SwitchType; // Can customize individual switches
  };
}

export interface InstantaneousState {
  omegaT: number; // in radians
  angleDeg: number; // 0 to 360 (or 720)
  vs: number; // Source voltage
  vo: number; // Output voltage
  io: number; // Output load current
  is: number; // Source input current
  vT1: number; // Voltage across T1
  gateT1: boolean; // Gate pulse active for T1
  gateT3: boolean; // Gate pulse active for T3
  activeSwitches: string[]; // e.g. ['T1', 'T2'] or ['D_FW']
  activeLoopDescription: string;
  isFreewheeling: boolean;
  conductionMode: 'CCM' | 'DCM';
  // 3-phase details if applicable
  vsa?: number;
  vsb?: number;
  vsc?: number;
}

export interface WaveformPoint {
  deg: number;
  rad: number;
  timeMs: number;
  vs: number;
  vo: number;
  io: number;
  is: number;
  vT1: number;
  gatePulse: number;
  activePair: string;
}

export interface RectifierMetrics {
  Vdc: number; // Average DC voltage
  Vrms: number; // RMS output voltage
  Idc: number; // Average DC current
  Irms: number; // RMS output current
  Pload: number; // Output power in Watts (P_load)
  Sin: number; // Apparent input power in VA (S_in)
  powerFactor: number; // Input displacement / power factor (PF)
  cosPhi1: number; // cos(φ1)
  rippleFactor: number; // RF
  formFactor: number; // FF
  thdPercent: number; // Source current THD_i %
  conductionMode: 'Continuous (CCM)' | 'Discontinuous (DCM)';
  extinctionAngleDeg: number; // beta
  idealVdc: number; // Ideal theoretical DC voltage
  theoreticalFormula: string; // LaTeX/display formula string
  theoreticalName: string; // Topology formula title
  theoreticalDesc: string; // Formula description
}

export interface HarmonicComponent {
  order: number;
  freqHz: number;
  magnitude: number;
  phaseDeg: number;
  percentageOfDc: number;
}

export interface PresetCircuit {
  id: string;
  badge: string;
  alphaLabel?: string;
  title: string;
  description: string;
  specs: string;
  params: Partial<CircuitParameters>;
}
