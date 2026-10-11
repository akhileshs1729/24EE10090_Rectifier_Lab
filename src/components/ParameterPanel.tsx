import React from 'react';
import { CircuitParameters, LoadType } from '../types/rectifier';
import {
  Layers,
  Zap,
  Sliders,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Activity
} from 'lucide-react';

interface ParameterPanelProps {
  params: CircuitParameters;
  onChangeParams: (updater: (prev: CircuitParameters) => CircuitParameters) => void;
  isRunning?: boolean;
  onTogglePlay?: () => void;
  onStep?: (stepDeg: number) => void;
  onReset?: () => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  params,
  onChangeParams,
  isRunning = false,
  onTogglePlay,
  onStep,
  onReset,
  speed = 0.05,
  onSpeedChange
}) => {
  const alphaPresets = [0, 30, 45, 60, 90, 120, 150];
  const speedPresets = [0.1, 0.2, 0.5, 1.0, 2.0];
  const idcPresets = [1, 2, 5, 10, 15, 20];
  const lsPresets = [0.5, 1, 2, 5, 10];

  const is3Phase =
    params.topology === 'three_phase_bridge' ||
    params.topology === '3phase_full_bridge' ||
    params.topology === 'three_phase_controlled' ||
    params.topology === 'three_phase_semi';

  const isHalfWave =
    params.topology === 'half_wave' || params.topology === '1phase_half_wave';

  const currentLoadType = params.loadType || (params.E > 0 ? 'RLE' : params.L > 0.0001 ? 'RL' : 'R');
  const isThyristorMode = params.switchType === 'thyristor' || params.topology === 'thyristor_controlled' || params.topology === 'single_phase_semi' || params.topology === 'three_phase_semi';

  const handleAlphaChange = (newAlpha: number) => {
    onChangeParams((prev) => ({
      ...prev,
      alpha: newAlpha,
      switchType: newAlpha > 0 ? 'thyristor' : prev.switchType
    }));
  };

  const handlePhaseModeChange = (mode: '1-phase' | '3-phase') => {
    onChangeParams((prev) => {
      if (mode === '3-phase') {
        return {
          ...prev,
          topology: 'three_phase_bridge',
          phaseMode: '3-phase'
        };
      } else {
        return {
          ...prev,
          topology: prev.circuitType === 'half-wave' ? 'half_wave' : 'thyristor_controlled',
          phaseMode: '1-phase'
        };
      }
    });
  };

  const handleCircuitTypeChange = (type: 'full-bridge' | 'half-wave') => {
    onChangeParams((prev) => {
      if (type === 'half-wave') {
        return {
          ...prev,
          topology: 'half_wave',
          circuitType: 'half-wave'
        };
      } else {
        return {
          ...prev,
          topology: prev.phaseMode === '3-phase' ? 'three_phase_bridge' : 'thyristor_controlled',
          circuitType: 'full-bridge'
        };
      }
    });
  };

  const handleQuickDeviceSetup = (device: 'all_diodes' | 'all_thyristors' | 'semi_conv') => {
    onChangeParams((prev) => {
      if (device === 'all_diodes') {
        return {
          ...prev,
          topology: is3Phase ? 'three_phase_bridge' : (isHalfWave ? 'half_wave' : 'diode_bridge'),
          switchType: 'diode',
          alpha: 0,
          deviceMode: 'all_diodes'
        };
      } else if (device === 'all_thyristors') {
        return {
          ...prev,
          topology: is3Phase ? 'three_phase_bridge' : (isHalfWave ? 'half_wave' : 'thyristor_controlled'),
          switchType: 'thyristor',
          alpha: prev.alpha === 0 ? 45 : prev.alpha,
          deviceMode: 'all_thyristors'
        };
      } else {
        // Semi-Converter
        return {
          ...prev,
          topology: is3Phase ? 'three_phase_semi' : 'single_phase_semi',
          switchType: 'thyristor',
          alpha: prev.alpha === 0 ? 45 : prev.alpha,
          hasFreewheelingDiode: true,
          isFWDActive: true,
          deviceMode: 'semi_conv'
        };
      }
    });
  };

  const handleLoadTypeChange = (type: LoadType) => {
    onChangeParams((prev) => {
      switch (type) {
        case 'R':
          return { ...prev, loadType: 'R', R: prev.R === 0 ? 20 : prev.R, L: 0.0001, E: 0 };
        case 'RL':
          return { ...prev, loadType: 'RL', L: prev.L <= 0.0001 ? 0.045 : prev.L, E: 0 };
        case 'RLE':
          return { ...prev, loadType: 'RLE', L: prev.L <= 0.0001 ? 0.045 : prev.L, E: prev.E === 0 ? 60 : prev.E };
        case 'I':
          return { ...prev, loadType: 'I', Idc: prev.Idc || 8.0 };
        default:
          return prev;
      }
    });
  };

  return (
    <div id="converter-control-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
      {/* Top Playback & Simulation Speed Controls Dock matching Image 1 */}
      {onTogglePlay && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {/* Real-Time Run Button */}
            <button
              id="btn-play-pause"
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Real-Time</span>
                </>
              )}
            </button>

            {/* Step Backwards */}
            {onStep && (
              <>
                <button
                  id="btn-step-back"
                  onClick={() => onStep(-10)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Step Backward 10°"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Step Forward */}
                <button
                  id="btn-step-fwd"
                  onClick={() => onStep(10)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Step Forward 10°"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Reset Angle */}
            {onReset && (
              <button
                id="btn-reset-time"
                onClick={onReset}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset Angle to 0°"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Speed Slider & Quick Speed Selectors matching Image 1 */}
          {onSpeedChange && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Speed:
                </span>
                <input
                  id="slider-sim-speed"
                  type="range"
                  min="0.02"
                  max="2.5"
                  step="0.02"
                  value={speed}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="w-28 sm:w-44 accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  title={`Simulation Speed: ${speed.toFixed(2)}x`}
                />
                <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 min-w-8">
                  {speed.toFixed(1)}x
                </span>
              </div>

              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-mono">
                {speedPresets.map((val) => (
                  <button
                    key={val}
                    onClick={() => onSpeedChange(val)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      Math.abs(speed - val) < 0.05
                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3 Columns Section matching Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: CONVERTER TOPOLOGY */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-sky-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Converter Topology
              </h4>
            </div>

            {/* Row 1: Single-Phase vs Three-Phase */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handlePhaseModeChange('1-phase')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  !is3Phase
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Single-Phase (1Φ)
              </button>
              <button
                onClick={() => handlePhaseModeChange('3-phase')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  is3Phase
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Three-Phase (3Φ)
              </button>
            </div>

            {/* Row 2: Full-Bridge vs Half-Wave */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleCircuitTypeChange('full-bridge')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  !isHalfWave
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Full-Bridge
              </button>
              <button
                onClick={() => handleCircuitTypeChange('half-wave')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  isHalfWave
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Half-Wave
              </button>
            </div>
          </div>

          {/* Quick Device Setup */}
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Quick Device Setup:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleQuickDeviceSetup('all_diodes')}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-colors ${
                  params.switchType === 'diode' && params.topology !== 'single_phase_semi' && params.topology !== 'three_phase_semi'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                All Diodes
              </button>
              <button
                onClick={() => handleQuickDeviceSetup('all_thyristors')}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-colors ${
                  params.switchType === 'thyristor' && params.topology !== 'single_phase_semi' && params.topology !== 'three_phase_semi'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                All Thyristors
              </button>
              <button
                onClick={() => handleQuickDeviceSetup('semi_conv')}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-colors ${
                  params.topology === 'single_phase_semi' || params.topology === 'three_phase_semi'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title="Semi-converter (Top Thyristors, Bottom Diodes)"
              >
                Semi-Conv
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: FIRING ANGLE α & FWD */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Firing Angle α & FWD
              </h4>
            </div>

            {/* Slider with Live Degree Badge */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Firing Angle (α):
                </span>
                <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {params.alpha}°
                </span>
              </div>
              <input
                id="slider-firing-angle"
                type="range"
                min="0"
                max="180"
                step="1"
                disabled={!isThyristorMode}
                value={params.alpha}
                onChange={(e) => handleAlphaChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Quick Angle Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {alphaPresets.map((deg) => (
                <button
                  key={deg}
                  disabled={!isThyristorMode}
                  onClick={() => handleAlphaChange(deg)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-colors ${
                    params.alpha === deg && isThyristorMode
                      ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Freewheeling Diode (D_FW) Controls */}
          <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Freewheeling Diode (D_FW):
              </span>
              <button
                id="btn-toggle-fwd-presence"
                onClick={() =>
                  onChangeParams((prev) => ({
                    ...prev,
                    hasFreewheelingDiode: !prev.hasFreewheelingDiode,
                    isFWDActive: !prev.hasFreewheelingDiode
                  }))
                }
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  params.hasFreewheelingDiode
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {params.hasFreewheelingDiode ? 'Connected' : 'Disconnected'}
              </button>
            </div>

            {/* Diode Conduction Toggle when FWD is Connected matching Image 1 */}
            {params.hasFreewheelingDiode && (
              <div className="flex items-center justify-between text-xs pl-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Diode Conduction:
                </span>
                <button
                  id="btn-toggle-fwd-active"
                  onClick={() =>
                    onChangeParams((prev) => ({
                      ...prev,
                      isFWDActive: prev.isFWDActive === false ? true : false
                    }))
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    params.isFWDActive !== false
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {params.isFWDActive !== false ? 'Active (Conducting)' : 'Disabled / Bypassed'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: LOAD & SOURCE PARAMETERS */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Load & Source Parameters
              </h4>
            </div>

            {/* 4 Load Type Tabs matching Image 1 */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 text-xs font-medium">
              {(['R', 'RL', 'RLE', 'I'] as LoadType[]).map((type) => {
                const label = type === 'I' ? 'Current (Idc)' : `${type} Load`;
                const isSelected = currentLoadType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleLoadTypeChange(type)}
                    className={`py-1.5 px-1 text-center rounded-lg border transition-all text-[11px] truncate ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Load specifics: If I Load vs R/RL/RLE */}
            {currentLoadType === 'I' ? (
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Idc (DC Current):
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800">
                      Ideal Source
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="slider-idc"
                      type="range"
                      min="0.5"
                      max="30"
                      step="0.5"
                      value={params.Idc || 8.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        onChangeParams((prev) => ({ ...prev, Idc: val }));
                      }}
                      className="w-24 sm:w-28 accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 min-w-12 text-right text-xs">
                      {(params.Idc || 8.0).toFixed(1)} A
                    </span>
                  </div>
                </div>

                {/* Quick Idc preset buttons */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {idcPresets.map((val) => (
                    <button
                      key={val}
                      onClick={() => onChangeParams((prev) => ({ ...prev, Idc: val }))}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                        Math.abs((params.Idc || 8.0) - val) < 0.1
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {val}A
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs mb-3">
                {/* Resistance R */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-24">
                    <span className="text-slate-600 dark:text-slate-400">
                      R (Resistance):
                    </span>
                    {(currentLoadType === 'RL' || currentLoadType === 'RLE') && params.R === 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold border bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800">
                        Pure L
                      </span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={currentLoadType === 'RL' || currentLoadType === 'RLE' ? 0 : 1}
                    max="100"
                    step="1"
                    value={params.R}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeParams((prev) => ({ ...prev, R: isNaN(val) ? 0 : val }));
                    }}
                    className="flex-1 accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 min-w-10 text-right">
                    {params.R === 0 ? '0 Ω' : `${params.R} Ω`}
                  </span>
                </div>

                {/* Inductance L (for RL & RLE) */}
                {(currentLoadType === 'RL' || currentLoadType === 'RLE') && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-400 min-w-24">
                      L (Inductance):
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      step="1"
                      value={Math.round(params.L * 1000)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onChangeParams((prev) => ({ ...prev, L: val / 1000 }));
                      }}
                      className="flex-1 accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 min-w-10 text-right">
                      {Math.round(params.L * 1000)} mH
                    </span>
                  </div>
                )}

                {/* Back EMF E (for RLE) */}
                {currentLoadType === 'RLE' && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-400 min-w-24">
                      E (Back-EMF):
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="2"
                      value={params.E}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onChangeParams((prev) => ({ ...prev, E: val }));
                      }}
                      className="flex-1 accent-rose-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 min-w-10 text-right">
                      {params.E}V
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Source Voltage & Frequency Sliders */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 dark:text-slate-400 min-w-24">
                  Source RMS:
                </span>
                <input
                  type="range"
                  min="50"
                  max="440"
                  step="10"
                  value={params.Vs_rms}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChangeParams((prev) => ({ ...prev, Vs_rms: val }));
                  }}
                  className="flex-1 accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 min-w-10 text-right">
                  {params.Vs_rms}V
                </span>
              </div>

              {/* AC Frequency */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 dark:text-slate-400 min-w-24">
                  Frequency (f):
                </span>
                <div className="flex items-center gap-1.5">
                  {[50, 60].map((f) => (
                    <button
                      key={f}
                      onClick={() => onChangeParams((prev) => ({ ...prev, frequency: f }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        params.frequency === f
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {f} Hz
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Source Inductance (Ls) Section matching Image 1 */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                Source Inductance (L_s):
              </span>
              <button
                id="btn-toggle-source-inductance"
                onClick={() =>
                  onChangeParams((prev) => ({
                    ...prev,
                    hasSourceInductance: !prev.hasSourceInductance,
                    Ls: prev.Ls || 2.5
                  }))
                }
                className={`px-3 py-1 font-semibold rounded-lg border transition-colors ${
                  params.hasSourceInductance
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {params.hasSourceInductance ? 'Connected' : 'Bypassed'}
              </button>
            </div>

            {/* When Ls Connected: Slider + Quick presets matching Image 1 */}
            {params.hasSourceInductance && (
              <div className="pl-1 pt-1 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Ls Inductance:
                  </span>
                  <input
                    id="slider-source-inductance"
                    type="range"
                    min="0.1"
                    max="15"
                    step="0.1"
                    value={params.Ls || 2.5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0.1;
                      onChangeParams((prev) => ({ ...prev, Ls: val }));
                    }}
                    className="flex-1 accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400 min-w-12 text-right text-xs">
                    {(params.Ls || 2.5).toFixed(1)} mH
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {lsPresets.map((val) => (
                    <button
                      key={val}
                      onClick={() => onChangeParams((prev) => ({ ...prev, Ls: val }))}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                        Math.abs((params.Ls || 2.5) - val) < 0.05
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {val}mH
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
