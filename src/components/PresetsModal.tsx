import React from 'react';
import { CircuitParameters, PresetCircuit } from '../types/rectifier';
import { Sparkles, X, ArrowRight } from 'lucide-react';

export const ALL_PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: '1p-diode-rl',
    badge: '1Φ Uncontrolled',
    title: '1-Phase Diode Bridge (RL Load)',
    description: 'Full-wave 4-diode bridge with inductive filter for smooth DC current.',
    specs: 'RL Load • R=20Ω L=40mH',
    params: {
      topology: 'diode_bridge',
      switchType: 'diode',
      alpha: 0,
      R: 20,
      L: 0.04,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_diodes'
    }
  },
  {
    id: '1p-full-controlled',
    badge: '1Φ Controlled',
    alphaLabel: 'α = 45°',
    title: '1-Phase Fully Controlled Bridge',
    description: '4-Thyristor full converter allowing variable DC voltage via firing angle α control.',
    specs: 'RL Load • R=20Ω L=50mH',
    params: {
      topology: 'thyristor_controlled',
      switchType: 'thyristor',
      alpha: 45,
      R: 20,
      L: 0.05,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: '1p-semi-fwd',
    badge: '1Φ Semi-Converter',
    alphaLabel: 'α = 60°',
    title: '1-Phase Semi-Converter + FWD',
    description: '2 Thyristors (top) + 2 Diodes (bottom) with Freewheeling Diode to prevent negative output spikes.',
    specs: 'RL Load • R=15Ω L=60mH',
    params: {
      topology: 'single_phase_semi',
      switchType: 'thyristor',
      alpha: 60,
      R: 15,
      L: 0.06,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: true,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'semi_conv'
    }
  },
  {
    id: '3p-diode-6p',
    badge: '3Φ 6-Pulse',
    title: '3-Phase 6-Pulse Diode Bridge',
    description: 'Industry standard 6-diode rectifier producing low ripple 300Hz DC output.',
    specs: 'RL Load • R=25Ω L=30mH',
    params: {
      topology: 'three_phase_bridge',
      switchType: 'diode',
      alpha: 0,
      R: 25,
      L: 0.03,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '3-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_diodes'
    }
  },
  {
    id: '3p-full-controlled',
    badge: '3Φ Controlled',
    alphaLabel: 'α = 30°',
    title: '3-Phase Fully Controlled Converter',
    description: '6-Thyristor bridge providing wide range DC voltage regulation and regenerative braking capability.',
    specs: 'RL Load • R=25Ω L=45mH',
    params: {
      topology: 'three_phase_bridge',
      switchType: 'thyristor',
      alpha: 30,
      R: 25,
      L: 0.045,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '3-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: '3p-semi-conv',
    badge: '3Φ Semi-Converter',
    alphaLabel: 'α = 45°',
    title: '3-Phase Semi-Converter (3T + 3D)',
    description: '3 Controlled thyristors in top leg and 3 uncontrolled diodes in bottom leg.',
    specs: 'RL Load • R=20Ω L=40mH',
    params: {
      topology: 'three_phase_semi',
      switchType: 'thyristor',
      alpha: 45,
      R: 20,
      L: 0.04,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: true,
      isFWDActive: true,
      hasSourceInductance: false,
      phaseMode: '3-phase',
      circuitType: 'full-bridge',
      deviceMode: 'semi_conv'
    }
  },
  {
    id: '1p-half-wave-fwd',
    badge: '1Φ Half-Wave',
    alphaLabel: 'α = 30°',
    title: '1-Phase Half-Wave Rectifier + FWD',
    description: 'Single switch converter demonstrating freewheeling diode inductor energy discharge.',
    specs: 'RL Load • R=15Ω L=35mH',
    params: {
      topology: 'half_wave',
      switchType: 'thyristor',
      alpha: 30,
      R: 15,
      L: 0.035,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: true,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'half-wave',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: 'rle-motor-drive',
    badge: 'RLE Drive',
    alphaLabel: 'α = 30°',
    title: 'RLE Load (Battery Charger / Motor)',
    description: 'Controlled converter driving an active Back-EMF load (E = 80V) with continuous current.',
    specs: 'RLE Load • R=10Ω L=50mH',
    params: {
      topology: 'thyristor_controlled',
      switchType: 'thyristor',
      alpha: 30,
      R: 10,
      L: 0.05,
      E: 80,
      loadType: 'RLE',
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: 'line-inversion',
    badge: 'Line Inverter',
    alphaLabel: 'α = 120°',
    title: 'Inversion Mode (α = 120°, Power back to AC)',
    description: 'RLE load operating in regeneration (inverter) mode transferring DC energy back to AC line.',
    specs: 'RLE Load • R=8Ω L=80mH',
    params: {
      topology: 'thyristor_controlled',
      switchType: 'thyristor',
      alpha: 120,
      R: 8,
      L: 0.08,
      E: -80,
      loadType: 'RLE',
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: '1p-source-ls',
    badge: '1Φ Ls Overlap',
    alphaLabel: 'α = 40°',
    title: '1-Phase Bridge + Source Inductance (Ls = 2.5 mH)',
    description: 'Demonstrates source inductance commutation overlap (μ), terminal voltage notches, and DC voltage drop.',
    specs: 'RL Load • R=18Ω L=120mH',
    params: {
      topology: 'thyristor_controlled',
      switchType: 'thyristor',
      alpha: 40,
      R: 18,
      L: 0.12,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: false,
      hasSourceInductance: true,
      Ls: 2.5,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: '3p-source-ls',
    badge: '3Φ Ls Overlap',
    alphaLabel: 'α = 30°',
    title: '3-Phase 6-Pulse + Source Inductance (Ls = 1.5 mH)',
    description: 'Demonstrates 3-phase commutation overlap across all 6 switching intervals with line voltage notches.',
    specs: 'RL Load • R=22Ω L=45mH',
    params: {
      topology: 'three_phase_bridge',
      switchType: 'thyristor',
      alpha: 30,
      R: 22,
      L: 0.045,
      E: 0,
      loadType: 'RL',
      hasFreewheelingDiode: false,
      hasSourceInductance: true,
      Ls: 1.5,
      phaseMode: '3-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  },
  {
    id: '1p-constant-idc',
    badge: '1Φ Idc Load',
    alphaLabel: 'α = 45°',
    title: '1-Phase Full Converter (Constant Current Load Idc)',
    description: 'Ideal constant ripple-free DC current source load (Idc = 8.0 A, L → ∞) with source inductance commutation overlap.',
    specs: 'I Load • R=0Ω',
    params: {
      topology: 'thyristor_controlled',
      switchType: 'thyristor',
      alpha: 45,
      R: 0,
      L: 0.5,
      E: 0,
      loadType: 'I',
      Idc: 8.0,
      hasFreewheelingDiode: false,
      hasSourceInductance: false,
      phaseMode: '1-phase',
      circuitType: 'full-bridge',
      deviceMode: 'all_thyristors'
    }
  }
];

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetCircuit) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header matching Image 3 & 4 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 shadow-xs">
              <Sparkles className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Standard Converter Presets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Load classic single-phase, three-phase, semi-converter, and controlled bridge configurations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Presets Grid matching Image 3 & 4 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_PRESET_CIRCUITS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="group border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-900/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {preset.badge}
                  </span>
                  {preset.alphaLabel && (
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {preset.alphaLabel}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {preset.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="font-mono text-slate-400 dark:text-slate-500">
                  {preset.specs}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                  Load <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
