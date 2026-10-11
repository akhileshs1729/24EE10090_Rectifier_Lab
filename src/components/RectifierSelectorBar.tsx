import React from 'react';
import { RectifierTopology, SwitchType, CircuitParameters } from '../types/rectifier';
import { Zap, GitMerge, Radio, Layers, Cpu, Sparkles } from 'lucide-react';
import { ALL_PRESET_CIRCUITS } from './PresetsModal';

export interface RectifierTypeItem {
  id: RectifierTopology;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  defaultSwitchType: SwitchType;
  icon: React.ReactNode;
}

interface RectifierSelectorBarProps {
  currentTopology: RectifierTopology;
  onSelect: (topology: RectifierTopology, defaultSwitch: SwitchType) => void;
  onApplyPreset?: (preset: Partial<CircuitParameters>) => void;
}

export const RECTIFIER_TYPES: RectifierTypeItem[] = [
  {
    id: 'diode_bridge',
    name: 'Diode Bridge Rectifier',
    shortName: 'Diode Bridge',
    badge: '1Φ Uncontrolled',
    description: '4-Diode Full-Wave Bridge (D1-D4), continuous smooth DC output',
    defaultSwitchType: 'diode',
    icon: <Layers className="w-4 h-4 text-emerald-500" />
  },
  {
    id: 'thyristor_controlled',
    name: 'Thyristor Controlled Rectifier',
    shortName: 'Thyristor Converter',
    badge: '1Φ Fully Controlled',
    description: '4-SCR Full-Bridge Converter (T1-T4) with firing angle α delay',
    defaultSwitchType: 'thyristor',
    icon: <Zap className="w-4 h-4 text-amber-500" />
  },
  {
    id: 'half_wave',
    name: 'Half-Wave Rectifier',
    shortName: 'Half-Wave',
    badge: '1Φ Single-Pulse',
    description: 'Single series diode/SCR conducting positive half-cycle only',
    defaultSwitchType: 'diode',
    icon: <Radio className="w-4 h-4 text-purple-500" />
  },
  {
    id: 'single_phase_semi',
    name: 'Single-Phase Semi-Converter',
    shortName: 'Semi-Converter',
    badge: 'Half-Controlled (2T + 2D)',
    description: '2 Thyristors + 2 Diodes with natural zero-voltage freewheeling',
    defaultSwitchType: 'thyristor',
    icon: <GitMerge className="w-4 h-4 text-indigo-500" />
  },
  {
    id: 'three_phase_bridge',
    name: '3-Phase Rectifier (6-Pulse)',
    shortName: '3-Phase Bridge',
    badge: '3Φ 6-Pulse Bridge',
    description: '6-switch three-phase converter with high efficiency and 300Hz ripple',
    defaultSwitchType: 'diode',
    icon: <Cpu className="w-4 h-4 text-rose-500" />
  }
];

export const RectifierSelectorBar: React.FC<RectifierSelectorBarProps> = ({
  currentTopology,
  onSelect,
  onApplyPreset
}) => {
  // Normalize topology ID
  const activeId =
    currentTopology === '1phase_full_bridge'
      ? 'thyristor_controlled'
      : currentTopology === '1phase_half_wave'
      ? 'half_wave'
      : currentTopology === '3phase_full_bridge'
      ? 'three_phase_bridge'
      : currentTopology;

  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const found = ALL_PRESET_CIRCUITS.find((p) => p.id === selectedId);
    if (found && onApplyPreset) {
      onApplyPreset(found.params);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Select Rectifier Circuit Topology:
          </span>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            (Click any card below or select from the circuits dropdown)
          </span>
        </div>

        {/* Dropdown list of all circuits */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <select
            onChange={handleDropdownSelect}
            defaultValue=""
            className="text-xs font-medium py-1 px-2.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
            title="Present / Preset Circuits Dropdown List"
          >
            <option value="" disabled>
              ⚡ Dropdown of All Preset Circuits ({ALL_PRESET_CIRCUITS.length})...
            </option>
            <optgroup label="Single-Phase Converters (1Φ)">
              {ALL_PRESET_CIRCUITS.filter(
                (p) => p.params.phaseMode === '1-phase' && !p.id.includes('inversion') && !p.id.includes('idc') && !p.id.includes('motor') && !p.id.includes('ls')
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.badge})
                </option>
              ))}
            </optgroup>
            <optgroup label="Three-Phase Converters (3Φ)">
              {ALL_PRESET_CIRCUITS.filter(
                (p) => p.params.phaseMode === '3-phase' && !p.id.includes('ls')
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.badge})
                </option>
              ))}
            </optgroup>
            <optgroup label="Industrial & Advanced Circuits">
              {ALL_PRESET_CIRCUITS.filter(
                (p) => p.id.includes('inversion') || p.id.includes('idc') || p.id.includes('motor') || p.id.includes('ls')
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.badge})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Grid of selectable rectifier topology buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {RECTIFIER_TYPES.map((item) => {
          const isSelected = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id, item.defaultSwitchType)}
              className={`flex flex-col text-left p-2.5 rounded-lg border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 shadow-xs ring-1 ring-sky-400/30'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  {item.icon}
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isSelected
                        ? 'text-sky-900 dark:text-sky-200'
                        : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900'
                    }`}
                  >
                    {item.shortName}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono block mb-1 font-medium ${
                  isSelected
                    ? 'text-sky-700 dark:text-sky-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.badge}
              </span>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              {/* Bottom active accent line */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
