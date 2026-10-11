import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: (stepDeg: number) => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onSpeedChange
}) => {
  const speedPresets = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Left Playback Buttons */}
      <div className="flex items-center gap-2">
        {/* Run Real-Time Play / Pause */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all shadow-xs ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunning ? 'Pause Simulation' : 'Run Real-Time'}</span>
        </button>

        {/* Step Backward */}
        <button
          onClick={() => onStep(-5)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Step Backward (5°)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step Forward */}
        <button
          onClick={() => onStep(5)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Step Forward (5°)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Reset Angle */}
        <button
          onClick={onReset}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Reset to 0°"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Speed Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Gauge className="w-4 h-4 text-sky-500" />
          <span>Speed:</span>
        </div>

        {/* Speed Slider */}
        <input
          type="range"
          min="0.01"
          max="0.5"
          step="0.01"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-24 md:w-36 accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />

        {/* Current Speed readout */}
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[42px]">
          {speed < 0.1 ? speed.toFixed(2) : speed.toFixed(1)}x
        </span>

        {/* Speed preset pills */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          {speedPresets.map((val) => (
            <button
              key={val}
              onClick={() => onSpeedChange(val)}
              className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                Math.abs(speed - val) < 0.005
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {val < 0.1 ? val.toFixed(2) : val.toFixed(1)}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
