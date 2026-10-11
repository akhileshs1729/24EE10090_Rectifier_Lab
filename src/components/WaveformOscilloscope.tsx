import React, { useRef, useEffect, useState, useMemo } from 'react';
import { WaveformPoint, RectifierMetrics, HarmonicComponent, CircuitParameters } from '../types/rectifier';
import {
  Layers,
  Split,
  BarChart2,
  BookOpen,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Sliders,
  Download
} from 'lucide-react';

interface WaveformOscilloscopeProps {
  points: WaveformPoint[];
  metrics: RectifierMetrics;
  harmonics: HarmonicComponent[];
  params: CircuitParameters;
  currentAngleDeg: number;
  onAngleChange: (deg: number) => void;
  cycles: number;
  onToggleCycles: () => void;
}

type TabType = 'superimposed' | 'channels' | 'harmonics' | 'derivations';

export const WaveformOscilloscope: React.FC<WaveformOscilloscopeProps> = ({
  points,
  metrics,
  harmonics,
  params,
  currentAngleDeg,
  onAngleChange,
  cycles,
  onToggleCycles
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('superimposed');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVavg, setShowVavg] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Peak limits for auto-scaling
  const { maxV, maxI } = useMemo(() => {
    let mV = params.Vs_rms * Math.SQRT2 * 1.15;
    let mI = 2;
    for (const pt of points) {
      if (Math.abs(pt.vs) > mV) mV = Math.abs(pt.vs);
      if (Math.abs(pt.vo) > mV) mV = Math.abs(pt.vo);
      if (Math.abs(pt.io) > mI) mI = Math.abs(pt.io);
      if (Math.abs(pt.is) > mI) mI = Math.abs(pt.is);
    }
    return {
      maxV: Math.max(50, Math.ceil(mV / 50) * 50),
      maxI: Math.max(2, Math.ceil(mI * 1.25))
    };
  }, [points, params.Vs_rms]);

  // Handle canvas mouse scrubbing
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const leftPadding = 55;
    const rightPadding = 25;
    const plotWidth = rect.width - leftPadding - rightPadding;

    if (x >= leftPadding && x <= rect.width - rightPadding) {
      const frac = (x - leftPadding) / plotWidth;
      const totalDeg = cycles * 360;
      const deg = Math.max(0, Math.min(totalDeg, frac * totalDeg));
      onAngleChange(deg);
    }
  };

  // Redraw canvas whenever points, metrics, angle, or settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'superimposed') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark mode check
    const isDark = document.documentElement.classList.contains('dark');
    const colors = {
      bg: isDark ? '#090d16' : '#ffffff',
      grid: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
      axis: isDark ? '#475569' : '#cbd5e1',
      text: isDark ? '#94a3b8' : '#64748b',
      vs: '#0284c7', // Sky blue
      vo: '#10b981', // Emerald green
      vAvg: '#a855f7', // Purple
      io: '#f59e0b', // Amber
      is: '#6366f1', // Indigo
      cursor: isDark ? '#38bdf8' : '#0284c7',
      cursorTextBg: isDark ? '#1e293b' : '#f8fafc'
    };

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    const leftPadding = 55;
    const rightPadding = 25;
    const plotWidth = width - leftPadding - rightPadding;

    // Layout: Top 46% for Voltage, Middle 44% for Current, Bottom 10% for Conduction Timeline
    const vPlotTop = 26;
    const vPlotHeight = height * 0.44 - vPlotTop;
    const iPlotTop = height * 0.48;
    const iPlotHeight = height * 0.38;
    const barTop = height * 0.90;
    const barHeight = height * 0.07;

    // Helper: Map deg to X
    const totalDeg = cycles * 360;
    const degToX = (deg: number) => leftPadding + (deg / totalDeg) * plotWidth;

    // 1. Draw Grids
    if (showGrid) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;

      // Vertical grid lines (every 90 degrees)
      const stepDeg = 90;
      for (let d = 0; d <= totalDeg; d += stepDeg) {
        const x = degToX(d);
        ctx.beginPath();
        ctx.moveTo(x, vPlotTop);
        ctx.lineTo(x, iPlotTop + iPlotHeight);
        ctx.stroke();

        // Degree label
        ctx.fillStyle = colors.text;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${d}°`, x, iPlotTop + iPlotHeight + 12);
      }

      // Horizontal grid lines for Voltage
      const vZeroY = vPlotTop + vPlotHeight / 2;
      const vTopY = vPlotTop + 8;
      const vBotY = vPlotTop + vPlotHeight - 8;

      ctx.beginPath();
      ctx.moveTo(leftPadding, vTopY);
      ctx.lineTo(width - rightPadding, vTopY);
      ctx.moveTo(leftPadding, vBotY);
      ctx.lineTo(width - rightPadding, vBotY);
      ctx.stroke();

      // Horizontal grid lines for Current
      const iZeroY = iPlotTop + iPlotHeight / 2;
      const iTopY = iPlotTop + 8;
      const iBotY = iPlotTop + iPlotHeight - 8;

      ctx.beginPath();
      ctx.moveTo(leftPadding, iTopY);
      ctx.lineTo(width - rightPadding, iTopY);
      ctx.moveTo(leftPadding, iBotY);
      ctx.lineTo(width - rightPadding, iBotY);
      ctx.stroke();
    }

    // Zero Axis Lines
    const vZeroY = vPlotTop + vPlotHeight / 2;
    const iZeroY = iPlotTop + iPlotHeight / 2;

    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftPadding, vZeroY);
    ctx.lineTo(width - rightPadding, vZeroY);
    ctx.moveTo(leftPadding, iZeroY);
    ctx.lineTo(width - rightPadding, iZeroY);
    ctx.stroke();

    // Axis Labels: Voltage
    ctx.fillStyle = colors.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxV}V`, leftPadding - 6, vPlotTop + 12);
    ctx.fillText(`0V`, leftPadding - 6, vZeroY + 4);
    ctx.fillText(`-${maxV}V`, leftPadding - 6, vPlotTop + vPlotHeight - 4);

    // Axis Labels: Current
    ctx.fillText(`${maxI}A`, leftPadding - 6, iPlotTop + 12);
    ctx.fillText(`0A`, leftPadding - 6, iZeroY + 4);
    ctx.fillText(`-${maxI}A`, leftPadding - 6, iPlotTop + iPlotHeight - 4);

    // Titles
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.text;
    ctx.fillText('Voltage Waveforms (vs & vo Superimposed)', leftPadding + 6, vPlotTop + 12);
    ctx.fillText('Current Waveforms (io & is)', leftPadding + 6, iPlotTop + 12);

    // Helper functions to map values to Y coordinates
    const vToY = (v: number) => vZeroY - (v / maxV) * (vPlotHeight / 2 - 8);
    const iToY = (val: number) => iZeroY - (val / maxI) * (iPlotHeight / 2 - 8);

    // 2. Draw Voltage Waveforms
    // A. Source Voltage vs (dashed blue sine)
    ctx.strokeStyle = colors.vs;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = degToX(pt.deg);
      const y = vToY(pt.vs);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // B. Output Voltage vo (solid emerald)
    ctx.strokeStyle = colors.vo;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = degToX(pt.deg);
      const y = vToY(pt.vo);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // C. V_dc Guideline (dashed purple)
    if (showVavg && metrics.Vdc > 0) {
      const vAvgY = vToY(metrics.Vdc);
      ctx.strokeStyle = colors.vAvg;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(leftPadding, vAvgY);
      ctx.lineTo(width - rightPadding, vAvgY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colors.vAvg;
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`V_avg=${metrics.Vdc.toFixed(1)}V`, width - rightPadding, vAvgY - 4);
    }

    // 3. Draw Current Waveforms
    // A. Source Current is (solid indigo)
    ctx.strokeStyle = colors.is;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = degToX(pt.deg);
      const y = iToY(pt.is);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // B. Load Current io (solid amber)
    ctx.strokeStyle = colors.io;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const x = degToX(pt.deg);
      const y = iToY(pt.io);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Conduction Bar at Bottom
    ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
    ctx.fillRect(leftPadding, barTop, plotWidth, barHeight);

    // Draw active pair segments
    let segStartDeg = 0;
    let currentPair = points[0]?.activePair || 'OFF';

    for (let i = 1; i < points.length; i++) {
      const pt = points[i];
      if (pt.activePair !== currentPair || i === points.length - 1) {
        const x1 = degToX(segStartDeg);
        const x2 = degToX(pt.deg);
        const w = Math.max(1, x2 - x1);

        if (currentPair !== 'OFF') {
          ctx.fillStyle = currentPair.includes('T1')
            ? 'rgba(16, 185, 129, 0.25)' // Green
            : currentPair.includes('D_FW')
            ? 'rgba(56, 189, 248, 0.25)' // Sky
            : 'rgba(52, 211, 153, 0.25)'; // Emerald
          ctx.fillRect(x1, barTop, w, barHeight);

          ctx.fillStyle = isDark ? '#34d399' : '#059669';
          ctx.font = '9px monospace font-bold';
          ctx.textAlign = 'center';
          if (w > 28) {
            ctx.fillText(currentPair, x1 + w / 2, barTop + barHeight / 2 + 3);
          }
        } else {
          ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          if (w > 20) {
            ctx.fillText('OFF', x1 + w / 2, barTop + barHeight / 2 + 3);
          }
        }

        ctx.strokeStyle = colors.axis;
        ctx.beginPath();
        ctx.moveTo(x2, barTop);
        ctx.lineTo(x2, barTop + barHeight);
        ctx.stroke();

        segStartDeg = pt.deg;
        currentPair = pt.activePair;
      }
    }

    // Timeline label
    ctx.fillStyle = colors.text;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ACTIVE PAIR', leftPadding - 6, barTop + barHeight / 2 + 3);

    // 5. Draw Interactive Cursor Line
    const cursorX = degToX(currentAngleDeg);
    ctx.strokeStyle = colors.cursor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cursorX, vPlotTop);
    ctx.lineTo(cursorX, barTop + barHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Circle handles on active point
    const curIdx = Math.min(
      points.length - 1,
      Math.max(0, Math.round((currentAngleDeg / totalDeg) * (points.length - 1)))
    );
    const curPt = points[curIdx];

    if (curPt) {
      const curVoY = vToY(curPt.vo);
      const curIoY = iToY(curPt.io);

      ctx.fillStyle = colors.vo;
      ctx.beginPath();
      ctx.arc(cursorX, curVoY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.io;
      ctx.beginPath();
      ctx.arc(cursorX, curIoY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [points, metrics, currentAngleDeg, cycles, showGrid, showVavg, activeTab, maxV, maxI]);

  // Export waveform data as CSV
  const handleExportCSV = () => {
    let csv = 'Angle_Deg,Time_ms,Vs_V,Vo_V,Io_A,Is_A,ActivePair\n';
    points.forEach((p) => {
      csv += `${p.deg.toFixed(1)},${p.timeMs.toFixed(3)},${p.vs.toFixed(2)},${p.vo.toFixed(2)},${p.io.toFixed(3)},${p.is.toFixed(3)},${p.activePair}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rectifier_waveforms_alpha${params.alpha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col shadow-sm transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : 'h-full'
      }`}
    >
      {/* Tab Navigation and Controls Bar */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('superimposed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'superimposed'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Superimposed</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'channels'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Oscilloscope Channels</span>
          </button>

          <button
            onClick={() => setActiveTab('harmonics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'harmonics'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Harmonics (FFT)</span>
          </button>

          <button
            onClick={() => setActiveTab('derivations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'derivations'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Derivations</span>
          </button>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-2">
          {/* Cycle Toggle */}
          <button
            onClick={onToggleCycles}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {cycles === 1 ? '1 Cycle (360°)' : '2 Cycles (720°)'}
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
              showGrid
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-medium'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            # Grid
          </button>

          {/* V_avg Line Toggle */}
          <button
            onClick={() => setShowVavg(!showVavg)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
              showVavg
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            V_avg
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Export CSV Data"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Plot Area */}
      <div className="relative flex-1 min-h-[360px] bg-white dark:bg-slate-950/50 flex flex-col overflow-hidden">
        {/* 1. SUPERIMPOSED VIEW */}
        {activeTab === 'superimposed' && (
          <div className="relative w-full h-full flex-1 flex flex-col">
            {/* Trace Legend Pill Row */}
            <div className="absolute top-2 right-4 z-10 flex items-center gap-3 text-[11px] font-mono bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-500 inline-block"></span>
                <span>vs (Source)</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
                <span>vo (Output)</span>
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <span className="w-3 h-0.5 bg-amber-500 inline-block"></span>
                <span>io (Load)</span>
              </span>
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <span className="w-3 h-0.5 bg-indigo-500 inline-block"></span>
                <span>is (Source)</span>
              </span>
            </div>

            {/* Interactive Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => {
                setIsDragging(true);
                handleCanvasInteraction(e);
              }}
              onMouseMove={(e) => {
                if (isDragging) handleCanvasInteraction(e);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                setIsDragging(true);
                handleCanvasInteraction(e);
              }}
              onTouchMove={(e) => {
                if (isDragging) handleCanvasInteraction(e);
              }}
              onTouchEnd={() => setIsDragging(false)}
              className="w-full flex-1 cursor-crosshair select-none"
            />
          </div>
        )}

        {/* 2. OSCILLOSCOPE CHANNELS VIEW */}
        {activeTab === 'channels' && (
          <div className="w-full h-full p-4 overflow-y-auto space-y-3">
            <ChannelRow
              name="CH1: Source Voltage (v_s)"
              color="text-sky-600 dark:text-sky-400"
              strokeColor="#0284c7"
              unit="V"
              currentVal={points.find((p) => Math.abs(p.deg - currentAngleDeg) < 2)?.vs || 0}
              points={points}
              valueKey="vs"
              min={-maxV}
              max={maxV}
              currentAngleDeg={currentAngleDeg}
              cycles={cycles}
            />
            <ChannelRow
              name="CH2: Output Rectified Voltage (v_o)"
              color="text-emerald-600 dark:text-emerald-400"
              strokeColor="#10b981"
              unit="V"
              currentVal={points.find((p) => Math.abs(p.deg - currentAngleDeg) < 2)?.vo || 0}
              points={points}
              valueKey="vo"
              min={-maxV * 0.2}
              max={maxV}
              currentAngleDeg={currentAngleDeg}
              cycles={cycles}
            />
            <ChannelRow
              name="CH3: Output Load Current (i_o)"
              color="text-amber-600 dark:text-amber-400"
              strokeColor="#f59e0b"
              unit="A"
              currentVal={points.find((p) => Math.abs(p.deg - currentAngleDeg) < 2)?.io || 0}
              points={points}
              valueKey="io"
              min={0}
              max={maxI}
              currentAngleDeg={currentAngleDeg}
              cycles={cycles}
            />
            <ChannelRow
              name="CH4: Input Source Current (i_s)"
              color="text-indigo-600 dark:text-indigo-400"
              strokeColor="#6366f1"
              unit="A"
              currentVal={points.find((p) => Math.abs(p.deg - currentAngleDeg) < 2)?.is || 0}
              points={points}
              valueKey="is"
              min={-maxI}
              max={maxI}
              currentAngleDeg={currentAngleDeg}
              cycles={cycles}
            />
            <ChannelRow
              name="CH5: Switch Voltage (v_T1)"
              color="text-slate-600 dark:text-slate-300"
              strokeColor="#64748b"
              unit="V"
              currentVal={points.find((p) => Math.abs(p.deg - currentAngleDeg) < 2)?.vT1 || 0}
              points={points}
              valueKey="vT1"
              min={-maxV}
              max={maxV * 0.2}
              currentAngleDeg={currentAngleDeg}
              cycles={cycles}
            />
          </div>
        )}

        {/* 3. HARMONICS (FFT) VIEW */}
        {activeTab === 'harmonics' && (
          <div className="w-full h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Fourier Harmonic Spectrum of Rectified Output (v_o)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Base frequency: {params.frequency} Hz · THD: {metrics.thdPercent.toFixed(1)}% · Ripple Factor:{' '}
                    {metrics.rippleFactor.toFixed(3)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                    V_dc = {metrics.Vdc.toFixed(1)} V
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    V_rms = {metrics.Vrms.toFixed(1)} V
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-56 flex items-end gap-3 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                {harmonics.map((h) => {
                  const maxMag = Math.max(...harmonics.map((item) => item.magnitude), 10);
                  const barHeight = Math.max(4, (h.magnitude / maxMag) * 100);

                  return (
                    <div key={h.order} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-slate-500">
                        {h.magnitude.toFixed(0)}V
                      </span>
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-t transition-all ${
                          h.order === 0
                            ? 'bg-purple-500 dark:bg-purple-400'
                            : h.order % 2 === 0
                            ? 'bg-sky-500 dark:bg-sky-400'
                            : 'bg-emerald-500 dark:bg-emerald-400'
                        }`}
                        title={`Order ${h.order} (${h.freqHz}Hz): ${h.magnitude.toFixed(1)}V (${h.percentageOfDc.toFixed(1)}% of DC)`}
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {h.order === 0 ? 'DC' : `${h.order}ω`}
                      </span>
                      <span className="text-[9px] text-slate-400">{h.freqHz}Hz</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Harmonics analysis notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block mb-1">Dominant Ripple Frequency</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {params.topology.includes('three_phase') || params.topology.includes('3phase')
                    ? params.topology.includes('semi')
                      ? `${3 * params.frequency} Hz (3-Pulse 150 Hz)`
                      : `${6 * params.frequency} Hz (6-Pulse 300 Hz)`
                    : `${2 * params.frequency} Hz (100 Hz)`}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Full bridge eliminates odd harmonic components from output voltage.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block mb-1">Total Harmonic Distortion (THD)</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {metrics.thdPercent.toFixed(1)} %
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {metrics.thdPercent > 48 ? 'High AC ripple present in output DC rail' : 'Moderate ripple requiring filter capacitor/choke'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block mb-1">Form Factor (FF) & Ripple Factor (RF)</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  FF = {metrics.formFactor.toFixed(3)} · RF = {metrics.rippleFactor.toFixed(3)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ideal DC has FF = 1.0 and RF = 0.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. DERIVATIONS & THEORY VIEW */}
        {activeTab === 'derivations' && (
          <div className="w-full h-full p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-800">
              Mathematical Derivations for {params.topology.replace(/_/g, ' ').toUpperCase()}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Average Voltage Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                  1. Average Output Voltage (V_dc)
                </h4>
                <div className="bg-white dark:bg-slate-950 p-3 rounded font-mono text-emerald-600 dark:text-emerald-400 text-xs mb-2 border border-slate-200 dark:border-slate-800">
                  {params.hasFreewheelingDiode ? (
                    <div>V_dc = (Vm / π) · (1 + cos α)</div>
                  ) : (
                    <div>V_dc = (2 · Vm / π) · cos α</div>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Where <span className="font-mono">Vm = Vs_rms · √2 = {(params.Vs_rms * Math.SQRT2).toFixed(1)} V</span>,{' '}
                  <span className="font-mono">α = {params.alpha}°</span>.
                  <br />
                  Theoretical: <span className="font-bold font-mono text-emerald-600">{metrics.Vdc.toFixed(2)} V</span>.
                </p>
              </div>

              {/* RMS Voltage Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                  2. RMS Output Voltage (V_rms)
                </h4>
                <div className="bg-white dark:bg-slate-950 p-3 rounded font-mono text-sky-600 dark:text-sky-400 text-xs mb-2 border border-slate-200 dark:border-slate-800">
                  V_rms = (Vm / √2) · √[ 1 - (2α / π) + (sin(2α) / π) ]
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Simulated RMS: <span className="font-bold font-mono text-sky-600">{metrics.Vrms.toFixed(2)} V</span>.
                </p>
              </div>

              {/* Load Current & Time Constant */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                  3. RL Load Impedance & Time Constant
                </h4>
                <div className="space-y-1 font-mono text-slate-600 dark:text-slate-300">
                  <div>Impedance Z = √(R² + (ωL)²) = {Math.sqrt(params.R ** 2 + (2 * Math.PI * params.frequency * params.L) ** 2).toFixed(2)} Ω</div>
                  <div>Load Angle φ = arctan(ωL / R) = {((Math.atan2(2 * Math.PI * params.frequency * params.L, params.R) * 180) / Math.PI).toFixed(1)}°</div>
                  <div>Time constant τ = L / R = {((params.L / Math.max(1, params.R)) * 1000).toFixed(2)} ms</div>
                </div>
              </div>

              {/* Freewheeling Diode Effects */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                  4. Conduction Regimes & Freewheeling
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  {params.hasFreewheelingDiode
                    ? 'Freewheeling Diode clamps load voltage to 0V when source reverses at π (180°), preventing negative voltage excursions and improving average DC voltage and displacement factor.'
                    : 'Without Freewheeling Diode, inductor releases stored magnetic energy into the source, driving output voltage negative between 180° and 180°+α.'}
                </p>
                <div className="mt-2 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  Mode: {metrics.conductionMode}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Angle ωt Interactive Scrubber Slider Bar */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-[110px]">
          <Sliders className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Angle ωt:</span>
        </div>

        <input
          type="range"
          min="0"
          max={cycles * 360}
          step="0.5"
          value={currentAngleDeg}
          onChange={(e) => onAngleChange(parseFloat(e.target.value))}
          className="flex-1 accent-sky-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />

        <div className="w-16 text-right font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
          {currentAngleDeg.toFixed(1)}°
        </div>
      </div>
    </div>
  );
};

interface ChannelRowProps {
  name: string;
  color: string;
  strokeColor: string;
  unit: string;
  currentVal: number;
  points: WaveformPoint[];
  valueKey: keyof WaveformPoint;
  min: number;
  max: number;
  currentAngleDeg: number;
  cycles: number;
}

const ChannelRow: React.FC<ChannelRowProps> = ({
  name,
  color,
  strokeColor,
  unit,
  currentVal,
  points,
  valueKey,
  min,
  max,
  currentAngleDeg,
  cycles
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Zero line
    const zeroY = height - ((0 - min) / (max - min || 1)) * height;
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    // Waveform
    const totalDeg = cycles * 360;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const val = Number(pt[valueKey]);
      const x = (pt.deg / totalDeg) * width;
      const y = height - ((val - min) / (max - min || 1)) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Cursor line
    const curX = (currentAngleDeg / totalDeg) * width;
    ctx.strokeStyle = '#0284c7';
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, height);
    ctx.stroke();
  }, [points, valueKey, min, max, currentAngleDeg, cycles, strokeColor]);

  return (
    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className={`font-semibold ${color}`}>{name}</span>
        <span className="font-mono font-bold">
          {currentVal.toFixed(2)} {unit}
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full h-14 rounded border border-slate-200 dark:border-slate-800" />
    </div>
  );
};
