/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CircuitParameters } from './types/rectifier';
import { simulateRectifier, getInstantaneousState } from './utils/rectifierPhysics';
import { Header } from './components/Header';
import { RectifierSelectorBar } from './components/RectifierSelectorBar';
import { CircuitSchematic } from './components/CircuitSchematic';
import { WaveformOscilloscope } from './components/WaveformOscilloscope';
import { SimulationControls } from './components/SimulationControls';
import { ParameterPanel } from './components/ParameterPanel';
import { MetricsDashboard } from './components/MetricsDashboard';
import { TheoryModal } from './components/TheoryModal';
import { PresetsModal } from './components/PresetsModal';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Circuit simulation parameters
  const [params, setParams] = useState<CircuitParameters>({
    topology: '1phase_full_bridge',
    switchType: 'thyristor',
    alpha: 45,
    Vs_rms: 230,
    frequency: 50,
    R: 20,
    L: 0.045, // 45 mH
    E: 0,
    hasFreewheelingDiode: false,
    isFWDActive: true,
    hasSourceInductance: false,
    Ls: 2.5,
    loadType: 'RL',
    phaseMode: '1-phase',
    circuitType: 'full-bridge',
    deviceMode: 'all_thyristors'
  });

  // Display cycles (1 = 360°, 2 = 720°)
  const [cycles, setCycles] = useState<number>(1);

  // Time & Animation state
  const [currentAngleDeg, setCurrentAngleDeg] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(0.05); // Default comfortable viewing speed
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);

  // Synchronize dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Compute steady-state waveforms and metrics whenever parameters or cycles change
  const { points, metrics, harmonics } = useMemo(() => {
    return simulateRectifier(params, cycles, 360);
  }, [params, cycles]);

  // Compute instantaneous electrical state for the current angle
  const instantaneousState = useMemo(() => {
    return getInstantaneousState(currentAngleDeg, points, params);
  }, [currentAngleDeg, points, params]);

  // Real-time animation loop using requestAnimationFrame
  const lastTimeRef = useRef<number | null>(null);
  const reqIdRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current != null) {
        const deltaMs = timestamp - lastTimeRef.current;
        const basePeriodMs = 1000 / params.frequency;
        const deltaDeg = (deltaMs / basePeriodMs) * 360 * speed;

        setCurrentAngleDeg((prev) => {
          const maxDeg = cycles * 360;
          return (prev + deltaDeg) % maxDeg;
        });
      }
      lastTimeRef.current = timestamp;
      reqIdRef.current = requestAnimationFrame(animate);
    },
    [params.frequency, speed, cycles]
  );

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = null;
      reqIdRef.current = requestAnimationFrame(animate);
    } else {
      if (reqIdRef.current != null) {
        cancelAnimationFrame(reqIdRef.current);
        reqIdRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (reqIdRef.current != null) {
        cancelAnimationFrame(reqIdRef.current);
      }
    };
  }, [isRunning, animate]);

  // Handlers
  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
  };

  const handleStep = (stepDeg: number) => {
    setIsRunning(false);
    setCurrentAngleDeg((prev) => {
      const maxDeg = cycles * 360;
      let next = prev + stepDeg;
      if (next < 0) next += maxDeg;
      return next % maxDeg;
    });
  };

  const handleReset = () => {
    setCurrentAngleDeg(0);
  };

  const handleToggleSwitchType = (_switchId?: string) => {
    setParams((prev) => ({
      ...prev,
      switchType: prev.switchType === 'diode' ? 'thyristor' : 'diode',
      alpha: prev.switchType === 'diode' ? (prev.alpha === 0 ? 45 : prev.alpha) : 0
    }));
  };

  const handleToggleFreewheeling = () => {
    setParams((prev) => ({
      ...prev,
      hasFreewheelingDiode: !prev.hasFreewheelingDiode,
      isFWDActive: !prev.hasFreewheelingDiode
    }));
  };

  const handleSelectTopology = (topology: CircuitParameters['topology']) => {
    setParams((prev) => ({
      ...prev,
      topology
    }));
  };

  const handleSelectRectifierType = (
    topology: CircuitParameters['topology'],
    defaultSwitch: CircuitParameters['switchType']
  ) => {
    setParams((prev) => {
      const is3p = topology === 'three_phase_bridge' || topology === '3phase_full_bridge' || topology === 'three_phase_semi';
      const isHw = topology === 'half_wave' || topology === '1phase_half_wave';
      return {
        ...prev,
        topology,
        switchType: defaultSwitch,
        alpha: defaultSwitch === 'diode' ? 0 : prev.alpha === 0 ? 45 : prev.alpha,
        hasFreewheelingDiode: topology === 'single_phase_semi' ? true : prev.hasFreewheelingDiode,
        phaseMode: is3p ? '3-phase' : '1-phase',
        circuitType: isHw ? 'half-wave' : 'full-bridge',
        deviceMode: defaultSwitch === 'diode' ? 'all_diodes' : topology === 'single_phase_semi' ? 'semi_conv' : 'all_thyristors'
      };
    });
    setCurrentAngleDeg(0);
  };

  const handleApplyPreset = (presetParams: Partial<CircuitParameters>) => {
    setParams((prev) => ({
      ...prev,
      ...presetParams
    }));
    setCurrentAngleDeg(0);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-sky-500/20">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onReset={handleReset}
        onApplyPreset={handleApplyPreset}
        currentTopology={params.topology}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1720px] w-full mx-auto space-y-4">
        {/* Prominent Rectifier Selection Bar at Top with Dropdown List */}
        <RectifierSelectorBar
          currentTopology={params.topology}
          onSelect={handleSelectRectifierType}
          onApplyPreset={handleApplyPreset}
        />

        {/* Dual Main Panels: Schematic (Left) & Waveform Oscilloscope (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          {/* Left Panel: Circuit Schematic Diagram */}
          <div className="h-[460px] xl:h-[520px]">
            <CircuitSchematic
              params={params}
              state={instantaneousState}
              onToggleSwitchType={handleToggleSwitchType}
              onToggleFreewheeling={handleToggleFreewheeling}
              onSelectTopology={handleSelectTopology}
            />
          </div>

          {/* Right Panel: Waveform Generator / Oscilloscope */}
          <div className="h-[460px] xl:h-[520px]">
            <WaveformOscilloscope
              points={points}
              metrics={metrics}
              harmonics={harmonics}
              params={params}
              currentAngleDeg={currentAngleDeg}
              onAngleChange={(deg) => {
                setIsRunning(false);
                setCurrentAngleDeg(deg);
              }}
              cycles={cycles}
              onToggleCycles={() => setCycles((prev) => (prev === 1 ? 2 : 1))}
            />
          </div>
        </div>

        {/* Bottom Control Bar: Run Real-Time, Step, Speed */}
        <SimulationControls
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onStep={handleStep}
          onReset={handleReset}
          speed={speed}
          onSpeedChange={setSpeed}
        />

        {/* Live Metrics Dashboard */}
        <MetricsDashboard metrics={metrics} />

        {/* Interactive Converter & Load Knobs */}
        <ParameterPanel
          params={params}
          onChangeParams={setParams}
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onStep={handleStep}
          onReset={handleReset}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </main>

      {/* Academic Attribution Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 transition-colors mt-auto">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span>Name: <strong className="text-slate-800 dark:text-slate-200 font-semibold">Seeramsetty Akhilesh</strong></span>
            <span>·</span>
            <span>Roll No.: <strong className="text-slate-800 dark:text-slate-200 font-semibold">24EE10090</strong></span>
          </div>
          <div className="text-[11px]">
            Power Electronics Virtual Laboratory · Indian Institute of Technology Kharagpur
          </div>
        </div>
      </footer>

      {/* Virtual Lab Theory and Formula Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />

      {/* Standard Converter Presets Gallery Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={(preset) => handleApplyPreset(preset.params)}
      />
    </div>
  );
}
