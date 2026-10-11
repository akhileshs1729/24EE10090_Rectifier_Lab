import React, { useState } from 'react';
import {
  Zap,
  Moon,
  Sun,
  Maximize,
  Minimize,
  BookOpen,
  RotateCcw,
  Sparkles,
  Calculator,
  ChevronDown,
  Layers,
  Cpu,
  Activity,
  Check
} from 'lucide-react';
import { CircuitParameters, PresetCircuit } from '../types/rectifier';
import { ALL_PRESET_CIRCUITS } from './PresetsModal';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenTheory: () => void;
  onOpenPresets: () => void;
  onReset: () => void;
  onApplyPreset: (preset: Partial<CircuitParameters>) => void;
  currentTopology?: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenTheory,
  onOpenPresets,
  onReset,
  onApplyPreset,
  currentTopology
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Group presets into 3 logical categories
  const singlePhasePresets = ALL_PRESET_CIRCUITS.filter(
    (p) => p.params.phaseMode === '1-phase' && !p.id.includes('inversion') && !p.id.includes('idc') && !p.id.includes('motor') && !p.id.includes('ls')
  );
  const threePhasePresets = ALL_PRESET_CIRCUITS.filter(
    (p) => p.params.phaseMode === '3-phase' && !p.id.includes('ls')
  );
  const advancedPresets = ALL_PRESET_CIRCUITS.filter(
    (p) => p.id.includes('inversion') || p.id.includes('idc') || p.id.includes('motor') || p.id.includes('ls')
  );

  return (
    <header className="flex flex-col transition-colors select-none">
      {/* Top Academic & Student Credentials Banner */}
      <div className="bg-slate-900 text-white dark:bg-slate-950 border-b border-slate-800 px-4 lg:px-6 py-2">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-6 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans font-medium text-[11px] tracking-wide">Name :</span>
              <span className="font-bold text-sky-400 text-xs sm:text-sm">Seeramsetty Akhilesh</span>
            </div>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans font-medium text-[11px] tracking-wide">Roll No. :</span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm tracking-wider">24EE10090</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span className="hidden md:inline">Department of Electrical Engineering</span>
            <span className="hidden md:inline text-slate-600">·</span>
            <span className="text-slate-300 font-medium">IIT Kharagpur</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] ml-1 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Lab Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Navigation Bar matching Image 2 */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand identity matching Image 2 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  RectifierLab
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Power Electronics Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                Interactive Single-Phase & Three-Phase Diode/Thyristor Bridge Converter Simulation
              </p>
            </div>
          </div>

          {/* Action Controls matching Image 2 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dark Mode toggle */}
            <button
              id="btn-toggle-theme"
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span className="hidden sm:inline">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Full Screen Studio */}
            <button
              id="btn-open-fullscreen-studio"
              onClick={toggleFullscreen}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen Studio'}</span>
            </button>

            {/* Waveform Analysis & Derivations Button matching Image 2 */}
            <button
              id="btn-open-analysis"
              onClick={onOpenTheory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-xs"
            >
              <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Waveform Analysis & Derivations</span>
              <span className="sm:hidden">Analysis</span>
            </button>

            {/* Presets / Present Circuits Dropdown Button matching Image 2, 3, 4 */}
            <div className="relative">
              <button
                id="btn-open-presets"
                onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-xs ${
                  showPresetsMenu
                    ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-500/30'
                    : 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/60'
                }`}
                title="Present / Presets Circuits (Click to choose any circuit)"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Present Circuits</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-sky-200/60 dark:bg-sky-800/60 text-sky-900 dark:text-sky-100">
                  {ALL_PRESET_CIRCUITS.length}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPresetsMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Comprehensive Dropdown Menu with all 13 circuits */}
              {showPresetsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPresetsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[540px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Select Circuit to Display
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                            Updates schematic, switches & waveforms instantly
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowPresetsMenu(false);
                          onOpenPresets();
                        }}
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800"
                      >
                        Grid Gallery ↗
                      </button>
                    </div>

                    {/* Scrollable Circuits List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Section 1: Single-Phase Rectifiers */}
                      <div className="p-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <Layers className="w-3 h-3 text-sky-500" />
                          <span>Single-Phase Converters (1Φ)</span>
                        </div>
                        {singlePhasePresets.map((preset) => {
                          const isCurrent = currentTopology === preset.params.topology;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                onApplyPreset(preset.params);
                                setShowPresetsMenu(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                                isCurrent
                                  ? 'bg-sky-50/80 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 font-medium'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {preset.title}
                                  </span>
                                  {preset.alphaLabel && (
                                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                      {preset.alphaLabel}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {preset.description}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                                  {preset.specs}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                {preset.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Section 2: Three-Phase Rectifiers */}
                      <div className="p-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <Cpu className="w-3 h-3 text-rose-500" />
                          <span>Three-Phase Converters (3Φ)</span>
                        </div>
                        {threePhasePresets.map((preset) => {
                          const isCurrent = currentTopology === preset.params.topology;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                onApplyPreset(preset.params);
                                setShowPresetsMenu(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                                isCurrent
                                  ? 'bg-sky-50/80 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 font-medium'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {preset.title}
                                  </span>
                                  {preset.alphaLabel && (
                                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                      {preset.alphaLabel}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {preset.description}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                                  {preset.specs}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                                {preset.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Section 3: Specialized & Advanced Circuits */}
                      <div className="p-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <Activity className="w-3 h-3 text-amber-500" />
                          <span>Specialized & Industrial Drives</span>
                        </div>
                        {advancedPresets.map((preset) => {
                          const isCurrent = currentTopology === preset.params.topology;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                onApplyPreset(preset.params);
                                setShowPresetsMenu(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                                isCurrent
                                  ? 'bg-sky-50/80 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 font-medium'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {preset.title}
                                  </span>
                                  {preset.alphaLabel && (
                                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                      {preset.alphaLabel}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {preset.description}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                                  {preset.specs}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                                {preset.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theory Guide button */}
            <button
              id="btn-open-theory"
              onClick={onOpenTheory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Theory</span>
            </button>

            {/* Reset button */}
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
