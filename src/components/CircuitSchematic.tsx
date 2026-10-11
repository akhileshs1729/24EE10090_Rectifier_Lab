import React from 'react';
import { CircuitParameters, InstantaneousState } from '../types/rectifier';
import { Zap, Maximize2, Minimize2 } from 'lucide-react';

interface CircuitSchematicProps {
  params: CircuitParameters;
  state: InstantaneousState;
  onToggleSwitchType: (switchId?: string) => void;
  onToggleFreewheeling: () => void;
  onSelectTopology: (topology: CircuitParameters['topology']) => void;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  params,
  state,
  onToggleSwitchType,
  onToggleFreewheeling
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { topology, switchType, hasFreewheelingDiode, R, L, E, hasSourceInductance, Ls = 2.5, loadType } = params;
  const { vs, vo, io, activeSwitches, activeLoopDescription, isFreewheeling } = state;

  const isT1Active = activeSwitches.includes('T1') || activeSwitches.includes('D1');
  const isT2Active = activeSwitches.includes('T2') || activeSwitches.includes('D2');
  const isT3Active = activeSwitches.includes('T3') || activeSwitches.includes('D3');
  const isT4Active = activeSwitches.includes('T4') || activeSwitches.includes('D4');
  const isT5Active = activeSwitches.includes('T5') || activeSwitches.includes('D5');
  const isT6Active = activeSwitches.includes('T6') || activeSwitches.includes('D6');
  const isDfwActive = isFreewheeling || activeSwitches.includes('D_FW');

  // Animation speed factor based on current, smoothly tuned for slower viewing
  const flowSpeed = io > 0.05 ? Math.max(0.25, Math.min(1.2, io / 7)) : 0;
  const isAnyActive = io > 0.05;

  const isFullBridge =
    topology === '1phase_full_bridge' ||
    topology === 'diode_bridge' ||
    topology === 'thyristor_controlled';
  const isCenterTap = topology === 'full_wave_center_tap';
  const isSemiConverter = topology === 'single_phase_semi';
  const isHalfWave = topology === 'half_wave' || topology === '1phase_half_wave';
  const isThreePhase =
    topology === 'three_phase_bridge' ||
    topology === '3phase_full_bridge' ||
    topology === 'three_phase_controlled' ||
    topology === 'three_phase_semi';
  const isThreePhaseSemi = topology === 'three_phase_semi';

  // 3-Phase switch type resolution:
  // - Semi-Converter (3T + 3D): Top are SCRs (thyristors T1, T3, T5), bottom are Diodes (D4, D6, D2)
  // - 3-Phase Diode Bridge (switchType === 'diode'): ALL 6 switches are DIODES (D1, D3, D5 top; D4, D6, D2 bottom)
  // - 3-Phase Fully Controlled Converter (switchType === 'thyristor'): ALL 6 switches are SCRs (T1, T3, T5 top; T4, T6, T2 bottom)
  const is3PTopThyristor = isThreePhaseSemi || switchType === 'thyristor';
  const is3PBottomThyristor = !isThreePhaseSemi && switchType === 'thyristor';

  // Determine switch labels and types based on topology
  const bridgeSwitchType =
    topology === 'diode_bridge'
      ? 'diode'
      : topology === 'thyristor_controlled'
      ? 'thyristor'
      : switchType;

  const getTopologyTitle = () => {
    switch (topology) {
      case 'diode_bridge':
        return '1-Phase Diode Full-Bridge Rectifier';
      case 'thyristor_controlled':
        return '1-Phase Controlled Thyristor Converter';
      case 'full_wave_center_tap':
        return 'Full-Wave Center-Tapped Transformer Rectifier';
      case 'half_wave':
      case '1phase_half_wave':
        return 'Single-Phase Half-Wave Rectifier';
      case 'single_phase_semi':
        return 'Single-Phase Semi-Controlled Converter (2 SCR + 2 Diode)';
      case 'three_phase_semi':
        return 'Three-Phase Semi-Converter (3T + 3D + FWD)';
      case 'three_phase_bridge':
      case '3phase_full_bridge':
        return switchType === 'diode'
          ? 'Three-Phase 6-Pulse Diode Bridge Rectifier'
          : 'Three-Phase Fully Controlled Converter (6 SCR)';
      case 'three_phase_controlled':
        return 'Three-Phase Fully Controlled Converter (6 SCR)';
      default:
        return 'Circuit Schematic Diagram';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col transition-all shadow-sm ${
        isExpanded ? 'fixed inset-4 z-50 overflow-auto' : 'h-full'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getTopologyTitle()}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Current flows towards positive load rail. Click switch card to toggle Diode (D) ↔ Thyristor (T).
            </p>
          </div>
        </div>

        {/* Right side status badge and controls */}
        <div className="flex items-center gap-2">
          {/* Active Loop Status */}
          <div
            className={`px-3 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${
              isAnyActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="text-[10px] tracking-wider uppercase block text-emerald-600 dark:text-emerald-400 font-sans">
              ACTIVE CURRENT LOOP
            </span>
            <span className="font-semibold">{activeLoopDescription}</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Close Full Screen' : 'Full Screen Diagram'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Schematic SVG canvas */}
      <div className="relative flex-1 min-h-[380px] bg-slate-50/50 dark:bg-slate-950/60 p-2 flex items-center justify-center overflow-hidden">
        {/* CSS for moving electron current dots */}
        <style>{`
          @keyframes flow-forward {
            from { stroke-dashoffset: 40; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes flow-reverse {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 40; }
          }
          .anim-flow-forward {
            animation: flow-forward ${flowSpeed > 0 ? (2.8 / flowSpeed).toFixed(2) : 999}s linear infinite;
          }
          .anim-flow-reverse {
            animation: flow-reverse ${flowSpeed > 0 ? (2.8 / flowSpeed).toFixed(2) : 999}s linear infinite;
          }
        `}</style>

        {/* 1. FULL-BRIDGE & SEMI-CONVERTER SCHEMATIC */}
        {(isFullBridge || isSemiConverter) && (
          <svg
            viewBox="0 0 840 480"
            className="w-full h-full max-h-[500px] select-none"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            <defs>
              <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" className="fill-slate-300 dark:fill-slate-800" />
              </pattern>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="840" height="480" fill="url(#grid-dots)" />

            {/* Static Circuit Wires */}
            <g className="stroke-slate-300 dark:stroke-slate-700 stroke-2 fill-none" strokeLinecap="round">
              <line x1="240" y1="80" x2="680" y2="80" />
              <line x1="240" y1="400" x2="680" y2="400" />
              <line x1="240" y1="80" x2="240" y2="104" />
              <line x1="240" y1="176" x2="240" y2="304" />
              <line x1="240" y1="376" x2="240" y2="400" />
              <line x1="380" y1="80" x2="380" y2="104" />
              <line x1="380" y1="176" x2="380" y2="304" />
              <line x1="380" y1="376" x2="380" y2="400" />
              <line x1="90" y1="212" x2="90" y2="190" />
              <line x1="90" y1="190" x2="240" y2="190" />
              <path d="M 90,268 L 90,290 L 233,290 A 7,7 0 0 1 247,290 L 380,290" />

              {(hasFreewheelingDiode || isSemiConverter || loadType === 'RLE') && (
                <>
                  <line
                    x1="530"
                    y1="80"
                    x2="530"
                    y2="204"
                    className={!hasFreewheelingDiode ? 'stroke-dashed opacity-60' : ''}
                  />
                  <line
                    x1="530"
                    y1="276"
                    x2="530"
                    y2="400"
                    className={!hasFreewheelingDiode ? 'stroke-dashed opacity-60' : ''}
                  />
                  <circle cx="530" cy="80" r="4" className={hasFreewheelingDiode ? 'fill-slate-700 dark:fill-slate-300' : 'fill-slate-400'} />
                  <circle cx="530" cy="400" r="4" className={hasFreewheelingDiode ? 'fill-slate-700 dark:fill-slate-300' : 'fill-slate-400'} />
                </>
              )}
              <line x1="680" y1="80" x2="680" y2="150" />
              <line x1="680" y1="330" x2="680" y2="400" />
              <circle cx="680" cy="80" r="4" className="fill-slate-700 dark:fill-slate-300" />
              <circle cx="680" cy="400" r="4" className="fill-slate-700 dark:fill-slate-300" />
              <circle cx="240" cy="190" r="4.5" className="fill-rose-500" />
              <circle cx="380" cy="290" r="4.5" className="fill-sky-500" />
            </g>

            {/* Active Current Flow Paths */}
            {isAnyActive && (
              <g className="fill-none stroke-emerald-500 dark:stroke-emerald-400 stroke-[3.5] stroke-linecap-round" filter="url(#glow)">
                {isT1Active && isT2Active && (
                  <path
                    d="M 90,240 L 90,190 L 240,190 L 240,80 L 680,80 L 680,400 L 380,400 L 380,290 L 247,290 A 7,7 0 0 0 233,290 L 90,290 L 90,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {isT3Active && isT4Active && (
                  <path
                    d="M 90,240 L 90,290 L 233,290 A 7,7 0 0 1 247,290 L 380,290 L 380,80 L 680,80 L 680,400 L 240,400 L 240,190 L 90,190 L 90,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {isDfwActive && (
                  <path
                    d="M 680,400 L 530,400 L 530,80 L 680,80 L 680,400 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
              </g>
            )}

            {/* Current Direction Flow Arrows */}
            {isAnyActive && (
              <g className="select-none pointer-events-none">
                <g transform="translate(460, 80)">
                  <polygon points="-6,-4 6,0 -6,4" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="0" y="-8" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    Idc ►
                  </text>
                </g>
                <g transform="translate(680, 115)">
                  <polygon points="-4,-6 0,6 4,-6" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="10" y="2" textAnchor="start" className="text-[9.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    io ▼
                  </text>
                </g>
                {isDfwActive && (
                  <g transform="translate(530, 140)">
                    <polygon points="-4,-6 0,-14 4,-6" className="fill-emerald-500 dark:fill-emerald-400" />
                    <text x="8" y="-6" textAnchor="start" className="text-[9.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                      i_dfw ▲
                    </text>
                  </g>
                )}
                <g transform="translate(460, 400)">
                  <polygon points="6,-4 -6,0 6,4" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="0" y="16" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    ◄ Return
                  </text>
                </g>
              </g>
            )}

            {/* AC Source Circle */}
            <g transform="translate(90, 240)">
              <circle cx="0" cy="0" r="28" className="fill-white dark:fill-slate-900 stroke-sky-500 stroke-2" />
              <path d="M -16,0 Q -8,-14 0,0 T 16,0" className="fill-none stroke-sky-500 stroke-2" />
              <text x="0" y="44" textAnchor="middle" className="text-xs font-semibold fill-slate-800 dark:fill-slate-200">
                AC Source
              </text>
              <text x="0" y="58" textAnchor="middle" className="text-[11px] font-mono fill-sky-600 dark:fill-sky-400">
                vs = {vs.toFixed(1)} V
              </text>
            </g>

            {/* Switches */}
            <SwitchCard cx={240} cy={140} id="T1" type={bridgeSwitchType} isActive={isT1Active} label={bridgeSwitchType === 'diode' ? 'D1' : 'T1'} sublabel="Leg 1 Top" onClick={() => onToggleSwitchType('T1')} />
            <SwitchCard cx={240} cy={340} id="T4" type={isSemiConverter ? 'diode' : bridgeSwitchType} isActive={isT4Active} label={isSemiConverter ? 'D4' : (bridgeSwitchType === 'diode' ? 'D4' : 'T4')} sublabel="Leg 1 Bot" onClick={() => onToggleSwitchType('T4')} />
            <SwitchCard cx={380} cy={140} id="T3" type={bridgeSwitchType} isActive={isT3Active} label={bridgeSwitchType === 'diode' ? 'D3' : 'T3'} sublabel="Leg 2 Top" onClick={() => onToggleSwitchType('T3')} />
            <SwitchCard cx={380} cy={340} id="T2" type={isSemiConverter ? 'diode' : bridgeSwitchType} isActive={isT2Active} label={isSemiConverter ? 'D2' : (bridgeSwitchType === 'diode' ? 'D2' : 'T2')} sublabel="Leg 2 Bot" onClick={() => onToggleSwitchType('T2')} />

            {/* Freewheeling Diode (D_FW) at x=530, y=240 */}
            {(hasFreewheelingDiode || isSemiConverter || loadType === 'RLE') && (
              <FreewheelingDiodeCard
                cx={530}
                cy={240}
                isConnected={hasFreewheelingDiode}
                isActive={isDfwActive}
                onClick={onToggleFreewheeling}
              />
            )}

            {/* Load Component at x=680, y=240 */}
            <LoadBox cx={680} cy={240} R={R} L={L} E={E} io={io} loadType={loadType} />
          </svg>
        )}

        {/* 2. FULL-WAVE CENTER-TAPPED TRANSFORMER SCHEMATIC */}
        {isCenterTap && (
          <svg viewBox="0 0 840 480" className="w-full h-full max-h-[500px] select-none">
            <defs>
              <pattern id="grid-dots-ct" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" className="fill-slate-300 dark:fill-slate-800" />
              </pattern>
            </defs>
            <rect width="840" height="480" fill="url(#grid-dots-ct)" />

            <g className="stroke-slate-300 dark:stroke-slate-700 stroke-2 fill-none" strokeLinecap="round">
              <line x1="380" y1="80" x2="680" y2="80" />
              <line x1="380" y1="400" x2="680" y2="400" />
              <line x1="380" y1="80" x2="380" y2="104" />
              <line x1="380" y1="176" x2="380" y2="240" />
              <line x1="380" y1="240" x2="380" y2="304" />
              <line x1="380" y1="376" x2="380" y2="400" />
              <line x1="220" y1="240" x2="680" y2="240" className="stroke-slate-400 stroke-dasharray-[4,4]" />
              <circle cx="220" cy="240" r="4" className="fill-slate-600" />
              <line x1="680" y1="80" x2="680" y2="150" />
              <line x1="680" y1="330" x2="680" y2="400" />
              <circle cx="680" cy="80" r="4" className="fill-slate-700 dark:fill-slate-300" />
              <circle cx="680" cy="400" r="4" className="fill-slate-700 dark:fill-slate-300" />

              {/* FWD Branch in Center-Tap when enabled */}
              {hasFreewheelingDiode && (
                <>
                  <line x1="530" y1="80" x2="530" y2="204" />
                  <line x1="530" y1="276" x2="530" y2="400" />
                  <circle cx="530" cy="80" r="4" className="fill-slate-700 dark:fill-slate-300" />
                  <circle cx="530" cy="400" r="4" className="fill-slate-700 dark:fill-slate-300" />
                </>
              )}
            </g>

            {/* Active Current Flow Paths in Center-Tap */}
            {isAnyActive && (
              <g className="fill-none stroke-emerald-500 dark:stroke-emerald-400 stroke-[3.5] stroke-linecap-round" filter="url(#glow)">
                {isT1Active && !isDfwActive && (
                  <path
                    d="M 220,240 L 380,240 L 380,80 L 680,80 L 680,240 L 220,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {isT2Active && !isDfwActive && (
                  <path
                    d="M 220,240 L 680,240 L 680,400 L 380,400 L 380,240 L 220,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {isDfwActive && hasFreewheelingDiode && (
                  <path
                    d="M 680,400 L 530,400 L 530,80 L 680,80 L 680,400 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
              </g>
            )}

            <SwitchCard cx={380} cy={140} id="T1" type={switchType} isActive={isT1Active} label={switchType === 'diode' ? 'D1' : 'T1'} sublabel="Top Sec" onClick={() => onToggleSwitchType('T1')} />
            <SwitchCard cx={380} cy={340} id="T2" type={switchType} isActive={isT2Active} label={switchType === 'diode' ? 'D2' : 'T2'} sublabel="Bot Sec" onClick={() => onToggleSwitchType('T2')} />

            {/* Freewheeling Diode (D_FW) in Center-Tap */}
            {hasFreewheelingDiode && (
              <FreewheelingDiodeCard
                cx={530}
                cy={240}
                isConnected={hasFreewheelingDiode}
                isActive={isDfwActive}
                onClick={onToggleFreewheeling}
              />
            )}

            <LoadBox cx={680} cy={240} R={R} L={L} E={E} io={io} loadType={loadType} />
          </svg>
        )}

        {/* 3. HALF-WAVE SCHEMATIC */}
        {isHalfWave && (
          <svg viewBox="0 0 840 480" className="w-full h-full max-h-[500px] select-none">
            <defs>
              <pattern id="grid-dots-hw" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" className="fill-slate-300 dark:fill-slate-800" />
              </pattern>
            </defs>
            <rect width="840" height="480" fill="url(#grid-dots-hw)" />

            <g className="stroke-slate-300 dark:stroke-slate-700 stroke-2 fill-none">
              <line x1="100" y1="140" x2="670" y2="140" />
              <line x1="100" y1="360" x2="670" y2="360" />
              <line x1="100" y1="140" x2="100" y2="212" />
              <line x1="100" y1="268" x2="100" y2="360" />
              <line x1="670" y1="140" x2="670" y2="170" />
              <line x1="670" y1="330" x2="670" y2="360" />
              <circle cx="670" cy="140" r="4" className="fill-slate-700 dark:fill-slate-300" />
              <circle cx="670" cy="360" r="4" className="fill-slate-700 dark:fill-slate-300" />
              {(hasFreewheelingDiode || loadType === 'RLE') && (
                <>
                  <line
                    x1="470"
                    y1="140"
                    x2="470"
                    y2="214"
                    className={!hasFreewheelingDiode ? 'stroke-dashed opacity-60' : ''}
                  />
                  <line
                    x1="470"
                    y1="286"
                    x2="470"
                    y2="360"
                    className={!hasFreewheelingDiode ? 'stroke-dashed opacity-60' : ''}
                  />
                  <circle cx="470" cy="140" r="4" className={hasFreewheelingDiode ? 'fill-slate-700 dark:fill-slate-300' : 'fill-slate-400'} />
                  <circle cx="470" cy="360" r="4" className={hasFreewheelingDiode ? 'fill-slate-700 dark:fill-slate-300' : 'fill-slate-400'} />
                </>
              )}
            </g>

            {/* Active Current Flow Paths in Half-Wave */}
            {isAnyActive && (
              <g className="fill-none stroke-emerald-500 dark:stroke-emerald-400 stroke-[3.5] stroke-linecap-round" filter="url(#glow)">
                {isT1Active && !isDfwActive && (
                  <path
                    d="M 100,240 L 100,140 L 670,140 L 670,360 L 100,360 L 100,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {isDfwActive && hasFreewheelingDiode && (
                  <path
                    d="M 670,360 L 470,360 L 470,140 L 670,140 L 670,360 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
              </g>
            )}

            {/* Current Direction Flow Arrows in Half-Wave */}
            {isAnyActive && (
              <g className="select-none pointer-events-none">
                <g transform="translate(370, 140)">
                  <polygon points="-6,-4 6,0 -6,4" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="0" y="-8" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    Idc ►
                  </text>
                </g>
                <g transform="translate(670, 175)">
                  <polygon points="-4,-6 0,6 4,-6" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="10" y="2" textAnchor="start" className="text-[9.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    io ▼
                  </text>
                </g>
                {isDfwActive && hasFreewheelingDiode && (
                  <g transform="translate(470, 175)">
                    <polygon points="-4,-6 0,-14 4,-6" className="fill-emerald-500 dark:fill-emerald-400" />
                    <text x="8" y="-6" textAnchor="start" className="text-[9.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                      i_dfw ▲
                    </text>
                  </g>
                )}
                <g transform="translate(370, 360)">
                  <polygon points="6,-4 -6,0 6,4" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="0" y="16" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    ◄ Return
                  </text>
                </g>
              </g>
            )}

            <g transform="translate(100, 240)">
              <circle cx="0" cy="0" r="28" className="fill-white dark:fill-slate-900 stroke-sky-500 stroke-2" />
              <path d="M -14,0 Q -7,-12 0,0 T 14,0" className="fill-none stroke-sky-500 stroke-2" />
              <text x="0" y="48" textAnchor="middle" className="text-xs font-semibold fill-slate-800 dark:fill-slate-200">
                AC Source
              </text>
            </g>

            <SwitchCard cx={270} cy={140} id="T1" type={switchType} isActive={isT1Active} label={switchType === 'diode' ? 'D1' : 'T1'} sublabel="Series" horizontal={true} onClick={() => onToggleSwitchType('T1')} />

            {/* Freewheeling Diode (D_FW) in Half-Wave */}
            {(hasFreewheelingDiode || loadType === 'RLE') && (
              <FreewheelingDiodeCard
                cx={470}
                cy={250}
                isConnected={hasFreewheelingDiode}
                isActive={isDfwActive}
                onClick={onToggleFreewheeling}
              />
            )}

            <LoadBox cx={670} cy={250} R={R} L={L} E={E} io={io} loadType={loadType} />
          </svg>
        )}

        {/* 4. THREE-PHASE SCHEMATIC (MATCHING IMAGE 2 EXACTLY) */}
        {isThreePhase && (
          <svg viewBox="0 0 880 480" className="w-full h-full max-h-[500px] select-none">
            <defs>
              <pattern id="grid-dots-3p" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" className="fill-slate-300 dark:fill-slate-800" />
              </pattern>
              <filter id="glow-3p" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="880" height="480" fill="url(#grid-dots-3p)" />

            {/* Static Rails & Bridge Wires */}
            <g className="stroke-slate-400 dark:stroke-slate-600 stroke-2 fill-none" strokeLinecap="round">
              {/* Top Positive DC Rail (passes all 3 legs, D_FW at 580, and connects to Load at 700) */}
              <line x1="220" y1="80" x2="700" y2="80" />
              {/* Bottom Negative DC Rail (passes all 3 legs, D_FW at 580, and connects to Load at 700) */}
              <line x1="220" y1="400" x2="700" y2="400" />

              {/* Vertical connection wires to Load at x=700 */}
              <line x1="700" y1="80" x2="700" y2="150" />
              <line x1="700" y1="330" x2="700" y2="400" />

              {/* Leg 1 Wires (x=220) */}
              <line x1="220" y1="80" x2="220" y2="104" />
              <line x1="220" y1="176" x2="220" y2="304" />
              <line x1="220" y1="376" x2="220" y2="400" />

              {/* Leg 2 Wires (x=340) */}
              <line x1="340" y1="80" x2="340" y2="104" />
              <line x1="340" y1="176" x2="340" y2="304" />
              <line x1="340" y1="376" x2="340" y2="400" />

              {/* Leg 3 Wires (x=460) */}
              <line x1="460" y1="80" x2="460" y2="104" />
              <line x1="460" y1="176" x2="460" y2="304" />
              <line x1="460" y1="376" x2="460" y2="400" />

              {/* STAR-CONNECTED SOURCE WIRING matching Image 2 */}
              {/* Radiating lines from Star Point N (46, 240) */}
              <line x1="46" y1="240" x2="90" y2="160" className="stroke-rose-500 stroke-2" />
              <line x1="46" y1="240" x2="90" y2="240" className="stroke-amber-500 stroke-2" />
              <line x1="46" y1="240" x2="90" y2="320" className="stroke-sky-500 stroke-2" />

              {/* Phase A Lead (Red): from (130, 160) -> (200, 160) -> turns down to (200, 210) -> (220, 210) */}
              <path d="M 130,160 L 200,160 L 200,210 L 220,210" className="stroke-rose-500 stroke-2" />

              {/* Phase B Lead (Orange): from (130, 240) -> hops over Leg 1 at x=220 -> (340, 240) */}
              <path d="M 130,240 L 213,240 A 7,7 0 0 1 227,240 L 340,240" className="stroke-amber-500 stroke-2" />

              {/* Phase C Lead (Blue): from (130, 320) -> (200, 320) -> turns up to (200, 270) -> hops Leg 1 & 2 -> (460, 270) */}
              <path d="M 130,320 L 200,320 L 200,270 L 213,270 A 7,7 0 0 1 227,270 L 333,270 A 7,7 0 0 1 347,270 L 460,270" className="stroke-sky-500 stroke-2" />

              {/* Freewheeling Diode Branch at x=580 */}
              {(hasFreewheelingDiode || isThreePhaseSemi || loadType === 'RLE') && (
                <>
                  <line
                    x1="580"
                    y1="80"
                    x2="580"
                    y2="204"
                    className={`stroke-2 ${!hasFreewheelingDiode ? 'stroke-slate-400 stroke-dashed opacity-60' : 'stroke-slate-400 dark:stroke-slate-600'}`}
                  />
                  <line
                    x1="580"
                    y1="276"
                    x2="580"
                    y2="400"
                    className={`stroke-2 ${!hasFreewheelingDiode ? 'stroke-slate-400 stroke-dashed opacity-60' : 'stroke-slate-400 dark:stroke-slate-600'}`}
                  />
                </>
              )}
            </g>

            {/* Active Current Flow Paths in 3-Phase */}
            {isAnyActive && (
              <g className="fill-none stroke-emerald-500 dark:stroke-emerald-400 stroke-[3.5] stroke-linecap-round" filter="url(#glow-3p)">
                {/* 1. T1 & D2 (Phase A -> Phase C) */}
                {isT1Active && isT2Active && (
                  <path
                    d="M 46,240 L 90,160 L 130,160 L 200,160 L 200,210 L 220,210 L 220,80 L 700,80 L 700,400 L 460,400 L 460,270 L 347,270 A 7,7 0 0 0 333,270 L 227,270 A 7,7 0 0 0 213,270 L 200,270 L 200,320 L 130,320 L 90,320 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {/* 2. T1 & D6 (Phase A -> Phase B) */}
                {isT1Active && isT6Active && (
                  <path
                    d="M 46,240 L 90,160 L 130,160 L 200,160 L 200,210 L 220,210 L 220,80 L 700,80 L 700,400 L 340,400 L 340,240 L 227,240 A 7,7 0 0 0 213,240 L 130,240 L 90,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {/* 3. T3 & D6 (Phase B -> Phase B loop / freewheel) */}
                {isT3Active && isT6Active && !isT1Active && (
                  <path
                    d="M 46,240 L 90,240 L 130,240 L 213,240 A 7,7 0 0 1 227,240 L 340,240 L 340,80 L 700,80 L 700,400 L 340,400 L 340,240 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {/* 4. T3 & D4 (Phase B -> Phase A) */}
                {isT3Active && isT4Active && (
                  <path
                    d="M 46,240 L 90,240 L 130,240 L 213,240 A 7,7 0 0 1 227,240 L 340,240 L 340,80 L 700,80 L 700,400 L 220,400 L 220,210 L 200,210 L 200,160 L 130,160 L 90,160 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {/* 5. T5 & D4 (Phase C -> Phase A) */}
                {isT5Active && isT4Active && (
                  <path
                    d="M 46,240 L 90,320 L 130,320 L 200,320 L 200,270 L 213,270 A 7,7 0 0 1 227,270 L 333,270 A 7,7 0 0 1 347,270 L 460,270 L 460,80 L 700,80 L 700,400 L 220,400 L 220,210 L 200,210 L 200,160 L 130,160 L 90,160 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {/* 6. T5 & D2 (Phase C -> Phase C loop / freewheel) */}
                {isT5Active && isT2Active && !isT1Active && (
                  <path
                    d="M 46,240 L 90,320 L 130,320 L 200,320 L 200,270 L 213,270 A 7,7 0 0 1 227,270 L 333,270 A 7,7 0 0 1 347,270 L 460,270 L 460,80 L 700,80 L 700,400 L 460,400 L 460,270 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
                {/* 7. Freewheeling Diode (D_FW) loop */}
                {isDfwActive && (
                  <path
                    d="M 700,400 L 580,400 L 580,80 L 700,80 L 700,400 Z"
                    strokeDasharray="6,8"
                    className="anim-flow-forward"
                  />
                )}
              </g>
            )}

            {/* REAL-TIME CURRENT DIRECTION FLOW ARROWS */}
            {isAnyActive && (
              <g className="select-none pointer-events-none">
                {/* Top Positive Rail (Idc ►) */}
                <g transform="translate(635, 80)">
                  <polygon points="-6,-4 6,0 -6,4" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="0" y="-8" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    Idc ►
                  </text>
                </g>

                {/* Entry wire to Load (io ▼) */}
                <g transform="translate(700, 115)">
                  <polygon points="-4,-6 0,6 4,-6" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="10" y="2" textAnchor="start" className="text-[9.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    io ▼
                  </text>
                </g>

                {/* Exit wire from Load (io ▼) */}
                <g transform="translate(700, 365)">
                  <polygon points="-4,-6 0,6 4,-6" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="10" y="2" textAnchor="start" className="text-[9.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    io ▼
                  </text>
                </g>

                {/* Bottom Negative Rail (◄ Return) */}
                <g transform="translate(635, 400)">
                  <polygon points="6,-4 -6,0 6,4" className="fill-emerald-500 dark:fill-emerald-400" />
                  <text x="0" y="16" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                    ◄ Return
                  </text>
                </g>
              </g>
            )}

            {/* Voltage Rail Terminal Labels */}
            <text x="725" y="84" className="text-[13px] font-mono font-bold fill-rose-600 dark:fill-rose-400">
              + Vo
            </text>
            <text x="725" y="404" className="text-[12px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
              - Vo (GND)
            </text>

            {/* STAR-CONNECTED SOURCE COMPONENTS matching Image 2 */}
            <g id="star-source-group">
              {/* Star point N */}
              <circle cx="46" cy="240" r="8" className="fill-slate-100 dark:fill-slate-800 stroke-slate-600 dark:stroke-slate-400 stroke-2" />
              <circle cx="46" cy="240" r="3.5" className="fill-sky-500" />
              <text x="46" y="222" textAnchor="middle" className="text-[13px] font-bold fill-slate-800 dark:fill-slate-100">
                N
              </text>
              <text x="46" y="260" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">
                STAR
              </text>

              {/* Generator A at (110, 160) */}
              <g transform="translate(110, 160)">
                <circle cx="0" cy="0" r="18" className="fill-rose-50 dark:fill-rose-950/40 stroke-rose-500 stroke-2" />
                <text x="0" y="-3" textAnchor="middle" className="text-[11px] font-bold fill-rose-600 dark:fill-rose-400">
                  A
                </text>
                <path d="M -7,6 Q -3.5,0 0,6 T 7,6" className="fill-none stroke-rose-500 stroke-1.5" />
                <text x="0" y="-23" textAnchor="middle" className="text-[8px] font-mono font-bold fill-rose-500">
                  50 Hz
                </text>
              </g>

              {/* Ls Bypassed box A at (165, 160) */}
              <g transform="translate(165, 160)">
                <rect x="-24" y="-7" width="48" height="14" rx="3" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700 stroke-1 stroke-dashed" />
                <text x="0" y="3" textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500">
                  {hasSourceInductance ? `Ls=${Ls}mH` : 'Ls Bypassed'}
                </text>
              </g>

              {/* Generator B at (110, 240) */}
              <g transform="translate(110, 240)">
                <circle cx="0" cy="0" r="18" className="fill-amber-50 dark:fill-amber-950/40 stroke-amber-500 stroke-2" />
                <text x="0" y="-3" textAnchor="middle" className="text-[11px] font-bold fill-amber-600 dark:fill-amber-400">
                  B
                </text>
                <path d="M -7,6 Q -3.5,0 0,6 T 7,6" className="fill-none stroke-amber-500 stroke-1.5" />
                <text x="0" y="-23" textAnchor="middle" className="text-[8px] font-mono font-bold fill-amber-500">
                  50 Hz
                </text>
              </g>

              {/* Ls Bypassed box B at (165, 240) */}
              <g transform="translate(165, 240)">
                <rect x="-24" y="-7" width="48" height="14" rx="3" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700 stroke-1 stroke-dashed" />
                <text x="0" y="3" textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500">
                  {hasSourceInductance ? `Ls=${Ls}mH` : 'Ls Bypassed'}
                </text>
              </g>

              {/* Generator C at (110, 320) */}
              <g transform="translate(110, 320)">
                <circle cx="0" cy="0" r="18" className="fill-sky-50 dark:fill-sky-950/40 stroke-sky-500 stroke-2" />
                <text x="0" y="-3" textAnchor="middle" className="text-[11px] font-bold fill-sky-600 dark:fill-sky-400">
                  C
                </text>
                <path d="M -7,6 Q -3.5,0 0,6 T 7,6" className="fill-none stroke-sky-500 stroke-1.5" />
                <text x="0" y="-23" textAnchor="middle" className="text-[8px] font-mono font-bold fill-sky-500">
                  50 Hz
                </text>
              </g>

              {/* Ls Bypassed box C at (165, 320) */}
              <g transform="translate(165, 320)">
                <rect x="-24" y="-7" width="48" height="14" rx="3" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700 stroke-1 stroke-dashed" />
                <text x="0" y="3" textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500">
                  {hasSourceInductance ? `Ls=${Ls}mH` : 'Ls Bypassed'}
                </text>
              </g>

              {/* Source Labels */}
              <text x="96" y="375" textAnchor="middle" className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300">
                Star-Connected 3-Phase Source
              </text>
              <text x="96" y="390" textAnchor="middle" className="text-[8.5px] font-mono fill-slate-500">
                Y-Configuration (Star Point N)
              </text>

              {/* Terminal Junction Dots */}
              <circle cx="220" cy="210" r="4.5" className="fill-rose-500" />
              <circle cx="340" cy="240" r="4.5" className="fill-amber-500" />
              <circle cx="460" cy="270" r="4.5" className="fill-sky-500" />
            </g>

            {/* 6 SWITCHES (LEG 1: T1/D1 & T4/D4, LEG 2: T3/D3 & T6/D6, LEG 3: T5/D5 & T2/D2) */}
            {/* Leg 1 Top Switch */}
            <SwitchCard
              cx={220}
              cy={140}
              id={is3PTopThyristor ? 'T1' : 'D1'}
              type={is3PTopThyristor ? 'thyristor' : 'diode'}
              isActive={isT1Active}
              label={is3PTopThyristor ? 'T1' : 'D1'}
              sublabel="Ph A"
              tag={is3PTopThyristor ? 'SCR' : 'DIODE'}
              onClick={() => onToggleSwitchType(is3PTopThyristor ? 'T1' : 'D1')}
            />
            {/* Leg 1 Bottom Switch */}
            <SwitchCard
              cx={220}
              cy={340}
              id={is3PBottomThyristor ? 'T4' : 'D4'}
              type={is3PBottomThyristor ? 'thyristor' : 'diode'}
              isActive={isT4Active}
              label={is3PBottomThyristor ? 'T4' : 'D4'}
              sublabel="Ph A"
              tag={is3PBottomThyristor ? 'SCR' : 'DIODE'}
              onClick={() => onToggleSwitchType(is3PBottomThyristor ? 'T4' : 'D4')}
            />

            {/* Leg 2 Top Switch */}
            <SwitchCard
              cx={340}
              cy={140}
              id={is3PTopThyristor ? 'T3' : 'D3'}
              type={is3PTopThyristor ? 'thyristor' : 'diode'}
              isActive={isT3Active}
              label={is3PTopThyristor ? 'T3' : 'D3'}
              sublabel="Ph B"
              tag={is3PTopThyristor ? 'SCR' : 'DIODE'}
              onClick={() => onToggleSwitchType(is3PTopThyristor ? 'T3' : 'D3')}
            />
            {/* Leg 2 Bottom Switch */}
            <SwitchCard
              cx={340}
              cy={340}
              id={is3PBottomThyristor ? 'T6' : 'D6'}
              type={is3PBottomThyristor ? 'thyristor' : 'diode'}
              isActive={isT6Active}
              label={is3PBottomThyristor ? 'T6' : 'D6'}
              sublabel="Ph B"
              tag={is3PBottomThyristor ? 'SCR' : 'DIODE'}
              onClick={() => onToggleSwitchType(is3PBottomThyristor ? 'T6' : 'D6')}
            />

            {/* Leg 3 Top Switch */}
            <SwitchCard
              cx={460}
              cy={140}
              id={is3PTopThyristor ? 'T5' : 'D5'}
              type={is3PTopThyristor ? 'thyristor' : 'diode'}
              isActive={isT5Active}
              label={is3PTopThyristor ? 'T5' : 'D5'}
              sublabel="Ph C"
              tag={is3PTopThyristor ? 'SCR' : 'DIODE'}
              onClick={() => onToggleSwitchType(is3PTopThyristor ? 'T5' : 'D5')}
            />
            {/* Leg 3 Bottom Switch */}
            <SwitchCard
              cx={460}
              cy={340}
              id={is3PBottomThyristor ? 'T2' : 'D2'}
              type={is3PBottomThyristor ? 'thyristor' : 'diode'}
              isActive={isT2Active}
              label={is3PBottomThyristor ? 'T2' : 'D2'}
              sublabel="Ph C"
              tag={is3PBottomThyristor ? 'SCR' : 'DIODE'}
              onClick={() => onToggleSwitchType(is3PBottomThyristor ? 'T2' : 'D2')}
            />

            {/* Rail Junction Dots */}
            <circle cx="220" cy="80" r="4" className="fill-slate-600 dark:fill-slate-400" />
            <circle cx="340" cy="80" r="4" className="fill-slate-600 dark:fill-slate-400" />
            <circle cx="460" cy="80" r="4" className="fill-slate-600 dark:fill-slate-400" />
            {(hasFreewheelingDiode || isThreePhaseSemi || loadType === 'RLE') && (
              <circle cx="580" cy="80" r="4" className={hasFreewheelingDiode ? 'fill-slate-600 dark:fill-slate-400' : 'fill-slate-400'} />
            )}
            <circle cx="700" cy="80" r="4" className="fill-slate-600 dark:fill-slate-400" />

            <circle cx="220" cy="400" r="4" className="fill-slate-600 dark:fill-slate-400" />
            <circle cx="340" cy="400" r="4" className="fill-slate-600 dark:fill-slate-400" />
            <circle cx="460" cy="400" r="4" className="fill-slate-600 dark:fill-slate-400" />
            {(hasFreewheelingDiode || isThreePhaseSemi || loadType === 'RLE') && (
              <circle cx="580" cy="400" r="4" className={hasFreewheelingDiode ? 'fill-slate-600 dark:fill-slate-400' : 'fill-slate-400'} />
            )}
            <circle cx="700" cy="400" r="4" className="fill-slate-600 dark:fill-slate-400" />

            {/* FREEWHEELING DIODE (D_FW) BRANCH matching Image 2 */}
            {(hasFreewheelingDiode || isThreePhaseSemi || loadType === 'RLE') && (
              <FreewheelingDiodeCard
                cx={580}
                cy={240}
                isConnected={hasFreewheelingDiode}
                isActive={isDfwActive}
                onClick={onToggleFreewheeling}
              />
            )}

            {/* 3P LOAD COMPONENT AT x=700, y=240 matching Image 2 */}
            <LoadBox cx={700} cy={240} R={R} L={L} E={E} io={io} loadType={loadType} />
          </svg>
        )}
      </div>

      {/* Schematic Quick Legend */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Conduction Path (ON)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
            <span>Reverse Biased (OFF)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Gate Triggered (α)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block border border-emerald-400"></span>
            <span>D_FW (Freewheeling)</span>
          </span>
        </div>
        <div className="text-[11px] font-mono">
          <span>Instantaneous: </span>
          <span className="text-sky-600 dark:text-sky-400 font-bold">vs = {vs.toFixed(1)}V</span>
          <span className="mx-1.5">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">vo = {vo.toFixed(1)}V</span>
          <span className="mx-1.5">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">io = {io.toFixed(2)}A</span>
        </div>
      </div>
    </div>
  );
};

interface FreewheelingDiodeCardProps {
  cx: number;
  cy: number;
  isConnected: boolean;
  isActive: boolean;
  onClick: () => void;
  label?: string;
  sublabel?: string;
}

const FreewheelingDiodeCard: React.FC<FreewheelingDiodeCardProps> = ({
  cx,
  cy,
  isConnected,
  isActive,
  onClick,
  label = 'D_FW',
  sublabel = 'Freewheel'
}) => {
  const width = 64;
  const height = 74;
  const x = cx - width / 2;
  const y = cy - height / 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background card container */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="10"
        onClick={onClick}
        className={`cursor-pointer transition-all duration-200 ${
          !isConnected
            ? 'fill-slate-50/70 dark:fill-slate-900/40 stroke-slate-300 dark:stroke-slate-700 stroke-1 stroke-dashed hover:stroke-slate-400'
            : isActive
            ? 'fill-emerald-50/90 dark:fill-emerald-950/70 stroke-emerald-500 stroke-2 filter drop-shadow(0 0 8px rgba(16,185,129,0.35))'
            : 'fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700 stroke-1 hover:stroke-slate-400'
        }`}
      />

      {/* Switch ID / Label */}
      <text
        x={width - 12}
        y="14"
        textAnchor="end"
        className={`text-[11px] font-mono font-bold select-none ${
          !isConnected
            ? 'fill-slate-400 dark:fill-slate-500'
            : isActive
            ? 'fill-emerald-600 dark:fill-emerald-400'
            : 'fill-slate-800 dark:fill-slate-100'
        }`}
      >
        {label}
      </text>

      {/* Sublabel */}
      <text
        x={width - 12}
        y="23"
        textAnchor="end"
        className="text-[8px] font-mono fill-slate-400 dark:fill-slate-500 select-none"
      >
        {sublabel}
      </text>

      {/* Bottom status tag: CONNECTED / BYPASSED */}
      <text
        x={width / 2}
        y={height - 8}
        textAnchor="middle"
        className={`text-[7.5px] font-mono font-bold tracking-wider select-none ${
          !isConnected
            ? 'fill-slate-400 dark:fill-slate-500'
            : isActive
            ? 'fill-emerald-600 dark:fill-emerald-400 font-extrabold'
            : 'fill-slate-500 dark:fill-slate-400'
        }`}
      >
        {!isConnected ? 'BYPASS' : isActive ? 'ON (FWD)' : 'CONNECTED'}
      </text>

      {/* Diode Symbol pointing UPWARDS (Cathode on top positive rail, Anode on bottom negative rail) */}
      <g
        transform={`translate(${width / 2}, ${height / 2 + 2})`}
        className={
          !isConnected
            ? 'stroke-slate-400 dark:stroke-slate-600'
            : isActive
            ? 'stroke-emerald-600 dark:stroke-emerald-400'
            : 'stroke-slate-900 dark:stroke-slate-100'
        }
      >
        {/* Anode lead (bottom vertical line entering base from negative rail) */}
        <line x1="0" y1="8" x2="0" y2="19" strokeWidth="2.5" strokeLinecap="square" />

        {/* Solid filled Triangle (apex pointing UPWARDS towards top cathode bar) */}
        <polygon
          points="0,-8 -10,8 10,8"
          className={
            !isConnected
              ? 'fill-transparent stroke-slate-400 dark:stroke-slate-600 stroke-1 stroke-dasharray-[2,2]'
              : isActive
              ? 'fill-emerald-500 dark:fill-emerald-400'
              : 'fill-slate-800 dark:fill-slate-100 stroke-slate-900 dark:stroke-slate-100'
          }
          strokeWidth="1.8"
          strokeLinejoin="miter"
        />

        {/* Cathode Bar (horizontal bar across apex at top) */}
        <line x1="-13" y1="-8" x2="13" y2="-8" strokeWidth="2.5" strokeLinecap="square" />

        {/* Cathode lead (top vertical line extending through apex to positive rail) */}
        <line x1="0" y1="-8" x2="0" y2="-19" strokeWidth="2.5" strokeLinecap="square" />

        {/* Active upward current flow arrow through the diode */}
        {isActive && (
          <g transform="translate(18, 0)">
            <polygon points="0,-6 -4,2 4,2" className="fill-emerald-500 dark:fill-emerald-400" />
            <text x="5" y="2" className="text-[7.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400 select-none">
              i_fw
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

interface SwitchCardProps {
  cx: number;
  cy: number;
  id: string;
  type: 'diode' | 'thyristor';
  isActive: boolean;
  label: string;
  sublabel: string;
  tag?: string;
  horizontal?: boolean;
  onClick: () => void;
}

const SwitchCard: React.FC<SwitchCardProps> = ({
  cx,
  cy,
  type,
  isActive,
  label,
  sublabel,
  tag,
  horizontal = false,
  onClick
}) => {
  const width = horizontal ? 80 : 64;
  const height = horizontal ? 60 : 74;
  const x = cx - width / 2;
  const y = cy - height / 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background card container */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="10"
        onClick={onClick}
        className={`cursor-pointer transition-all duration-200 ${
          isActive
            ? 'fill-emerald-50/90 dark:fill-emerald-950/70 stroke-emerald-500 stroke-2 filter drop-shadow(0 0 6px rgba(16,185,129,0.3))'
            : 'fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700 stroke-1 hover:stroke-slate-400'
        }`}
      />

      {/* Switch ID & Sublabel matching Image 2 */}
      <text
        x={horizontal ? width / 2 : width - 14}
        y="14"
        textAnchor={horizontal ? 'middle' : 'end'}
        className="text-[11px] font-mono font-bold fill-slate-800 dark:fill-slate-100"
      >
        {label}
      </text>
      <text
        x={horizontal ? width / 2 : width - 14}
        y="23"
        textAnchor={horizontal ? 'middle' : 'end'}
        className="text-[8px] font-mono fill-slate-400 dark:fill-slate-500"
      >
        {sublabel}
      </text>

      {/* Bottom tag: SCR / DIODE matching Image 2 */}
      <text
        x={width / 2}
        y={height - 8}
        textAnchor="middle"
        className="text-[8px] font-mono font-bold tracking-wider fill-slate-400 dark:fill-slate-500"
      >
        {tag || (type === 'thyristor' ? 'SCR' : 'DIODE')}
      </text>

      {/* Diode / Thyristor Symbol */}
      {horizontal ? (
        /* Horizontal orientation */
        <g
          transform={`translate(${width / 2}, ${height / 2 + 2})`}
          className={
            isActive
              ? 'stroke-emerald-600 dark:stroke-emerald-400'
              : 'stroke-slate-900 dark:stroke-slate-100'
          }
        >
          <line x1="-24" y1="0" x2="-10" y2="0" strokeWidth="2.5" strokeLinecap="square" />
          <polygon
            points="6,0 -10,-11 -10,11"
            className={
              isActive
                ? 'fill-emerald-500 dark:fill-emerald-400'
                : 'fill-slate-900 dark:fill-slate-100'
            }
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
          <line x1="6" y1="-14" x2="6" y2="14" strokeWidth="2.5" strokeLinecap="square" />
          <line x1="6" y1="0" x2="24" y2="0" strokeWidth="2.5" strokeLinecap="square" />

          {type === 'thyristor' && (
            <g>
              <path
                d="M 6,5 L 14,13 L 22,13"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                className="stroke-amber-500"
              />
              <circle cx="22" cy="13" r="2" className="fill-amber-500" />
              <text x="22" y="21" textAnchor="middle" className="text-[7.5px] font-bold font-mono fill-amber-500">
                G
              </text>
            </g>
          )}
        </g>
      ) : (
        /* Vertical orientation pointing UP matching Image 2 */
        <g
          transform={`translate(${width / 2}, ${height / 2 + 2})`}
          className={
            isActive
              ? 'stroke-emerald-600 dark:stroke-emerald-400'
              : 'stroke-slate-900 dark:stroke-slate-100'
          }
        >
          {/* Anode lead (bottom vertical line entering base) */}
          <line x1="0" y1="8" x2="0" y2="19" strokeWidth="2.5" strokeLinecap="square" />

          {/* Solid filled Triangle (apex at top) */}
          <polygon
            points="0,-8 -10,8 10,8"
            className={
              isActive
                ? 'fill-emerald-500 dark:fill-emerald-400'
                : 'fill-white dark:fill-slate-900 stroke-slate-500 dark:stroke-slate-400'
            }
            strokeWidth="1.8"
            strokeLinejoin="miter"
          />

          {/* Cathode Bar (horizontal bar across apex) */}
          <line x1="-13" y1="-8" x2="13" y2="-8" strokeWidth="2.5" strokeLinecap="square" />

          {/* Cathode lead (top vertical line extending through apex) */}
          <line x1="0" y1="-8" x2="0" y2="-19" strokeWidth="2.5" strokeLinecap="square" />

          {/* Thyristor Gate lead on the LEFT matching Image 2 */}
          {type === 'thyristor' && (
            <g>
              <path
                d="M -22,-14 L -13,-14 L -6,-8"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="stroke-slate-400 dark:stroke-slate-500"
              />
              <circle cx="-22" cy="-14" r="1.5" className="fill-slate-400" />
              <text x="-26" y="-12" textAnchor="end" className="text-[7.5px] font-mono fill-slate-400">
                G
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

interface LoadBoxProps {
  cx: number;
  cy: number;
  R: number;
  L: number;
  E: number;
  io: number;
  loadType?: string;
}

const LoadBox: React.FC<LoadBoxProps> = ({ cx, cy, R, L, E, io, loadType = 'RL' }) => {
  const effectiveLoadType = loadType || (E > 0 ? 'RLE' : L > 0.0001 ? 'RL' : 'R');
  const isCharging = io > 0.02;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Load Container Card */}
      <rect
        x="-52"
        y="-90"
        width="104"
        height="180"
        rx="10"
        className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700 stroke-1.5 shadow-sm"
      />

      {/* Top Terminal (+ Polarity Marker) */}
      <circle cx="0" cy="-90" r="3" className="fill-slate-700 dark:fill-slate-300" />
      <text x="-8" y="-83" textAnchor="end" className="text-[9.5px] font-mono font-bold fill-rose-500">
        +
      </text>

      {/* Bottom Terminal (− Polarity Marker) */}
      <circle cx="0" cy="90" r="3" className="fill-slate-700 dark:fill-slate-300" />
      <text x="-8" y="87" textAnchor="end" className="text-[9.5px] font-mono font-bold fill-slate-500 dark:fill-slate-400">
        −
      </text>

      {/* Active Conduction Flow Path through the Load */}
      {isCharging && (
        <line
          x1="0"
          y1="-90"
          x2="0"
          y2="90"
          strokeWidth="2.5"
          strokeDasharray="4,6"
          className="stroke-emerald-400 anim-flow-forward pointer-events-none opacity-80"
        />
      )}

      {/* ==================== 1. RLE LOAD (BATTERY CHARGER) ==================== */}
      {effectiveLoadType === 'RLE' && (
        <g>
          {/* Header Title & Subtitle */}
          <text x="0" y="-76" textAnchor="middle" className="text-[10px] font-bold fill-sky-700 dark:fill-sky-300">
            RLE Load
          </text>
          <text x="0" y="-64" textAnchor="middle" className="text-[8px] font-semibold fill-emerald-600 dark:fill-emerald-400">
            Battery Charger
          </text>

          {/* Top Wire: from top terminal (0, -90) to Resistor (0, -50) */}
          <line x1="0" y1="-90" x2="0" y2="-50" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Component 1: Resistor R (Battery Internal / Series Resistor) */}
          <g>
            <path
              d="M 0,-50 L 0,-47 L 6,-43 L -6,-39 L 6,-35 L -6,-31 L 6,-27 L 0,-24 L 0,-22"
              fill="none"
              strokeWidth="2"
              className="stroke-slate-800 dark:stroke-slate-200"
            />
            <text x="12" y="-36" className="text-[8.5px] font-mono font-bold fill-slate-800 dark:fill-slate-200">
              R = {R} Ω
            </text>
            <text x="12" y="-27" className="text-[7px] font-mono fill-slate-400">
              Series R
            </text>
          </g>

          {/* Inter-component Wire: from Resistor (0, -22) to Inductor (0, -12) */}
          <line x1="0" y1="-22" x2="0" y2="-12" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Component 2: Inductor L (Series Smoothing Choke) */}
          <g>
            <path
              d="M 0,-12 C 8,-12 8,-6 0,-6 C 8,-6 8,0 0,0 C 8,0 8,6 0,6 C 8,6 8,12 0,12 C 8,12 8,18 0,18 L 0,20"
              fill="none"
              strokeWidth="2"
              className="stroke-amber-500"
            />
            <text x="12" y="2" className="text-[8.5px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
              L = {(L * 1000).toFixed(0)} mH
            </text>
            <text x="12" y="11" className="text-[7px] font-mono fill-slate-400">
              Filter Choke
            </text>
          </g>

          {/* Inter-component Wire: from Inductor (0, 20) to Battery (0, 28) */}
          <line x1="0" y1="20" x2="0" y2="28" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Component 3: Battery E (Battery Charger Target with Dual Plates) */}
          <g>
            {/* Long Plate 1 (+) */}
            <line x1="-14" y1="28" x2="14" y2="28" strokeWidth="2.5" className="stroke-rose-500" />
            {/* Short Thick Plate 1 (-) */}
            <line x1="-8" y1="33" x2="8" y2="33" strokeWidth="3.5" className="stroke-slate-700 dark:stroke-slate-300" />
            {/* Cell Interconnect Wire */}
            <line x1="0" y1="33" x2="0" y2="38" strokeWidth="2" className="stroke-slate-400" />
            {/* Long Plate 2 (+) */}
            <line x1="-14" y1="38" x2="14" y2="38" strokeWidth="2.5" className="stroke-rose-500" />
            {/* Short Thick Plate 2 (-) */}
            <line x1="-8" y1="43" x2="8" y2="43" strokeWidth="3.5" className="stroke-slate-700 dark:stroke-slate-300" />

            {/* Battery Polarity Labels on the Left */}
            <text x="-18" y="30" textAnchor="end" className="text-[9px] font-mono font-bold fill-rose-500">
              +
            </text>
            <text x="-18" y="45" textAnchor="end" className="text-[9px] font-mono font-bold fill-slate-600 dark:fill-slate-400">
              −
            </text>

            {/* Battery Specs & Label on the Right */}
            <text x="12" y="34" className="text-[9px] font-mono font-bold fill-rose-600 dark:fill-rose-400">
              E = {E} V
            </text>
            <text x="12" y="44" className="text-[7.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
              Battery
            </text>
          </g>

          {/* Bottom Wire: from Battery (0, 43) to bottom terminal (0, 90) */}
          <line x1="0" y1="43" x2="0" y2="90" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Bottom Status Badge */}
          <g transform="translate(0, 71)">
            <rect
              x="-46"
              y="-9"
              width="92"
              height="18"
              rx="9"
              className={
                isCharging
                  ? 'fill-emerald-50 dark:fill-emerald-950/70 stroke-emerald-400 dark:stroke-emerald-700 stroke-1'
                  : 'fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700 stroke-1'
              }
            />
            <text
              x="0"
              y="3.5"
              textAnchor="middle"
              className={`text-[8px] font-mono font-bold ${
                isCharging ? 'fill-emerald-700 dark:fill-emerald-300' : 'fill-slate-600 dark:fill-slate-400'
              }`}
            >
              {isCharging ? `⚡ Charge ${io.toFixed(1)}A` : `Standby (${E}V)`}
            </text>
          </g>
        </g>
      )}

      {/* ==================== 2. RL LOAD (INDUCTIVE) ==================== */}
      {effectiveLoadType === 'RL' && (
        <g>
          {/* Header */}
          <text x="0" y="-76" textAnchor="middle" className="text-[10px] font-bold fill-sky-700 dark:fill-sky-300">
            RL Load
          </text>
          <text x="0" y="-64" textAnchor="middle" className="text-[8px] font-semibold fill-slate-500 dark:fill-slate-400">
            Series R + L
          </text>

          {/* Top Wire */}
          <line x1="0" y1="-90" x2="0" y2="-44" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Resistor R */}
          <g>
            <path
              d="M 0,-44 L 0,-40 L 7,-35 L -7,-30 L 7,-25 L -7,-20 L 7,-15 L 0,-10 L 0,-6"
              fill="none"
              strokeWidth="2"
              className="stroke-slate-800 dark:stroke-slate-200"
            />
            <text x="12" y="-23" className="text-[9px] font-mono font-bold fill-slate-800 dark:fill-slate-200">
              R = {R} Ω
            </text>
          </g>

          {/* Inter-component Wire */}
          <line x1="0" y1="-6" x2="0" y2="4" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Inductor L */}
          <g>
            <path
              d="M 0,4 C 9,4 9,11 0,11 C 9,11 9,18 0,18 C 9,18 9,25 0,25 C 9,25 9,32 0,32 C 9,32 9,39 0,39 L 0,42"
              fill="none"
              strokeWidth="2"
              className="stroke-amber-500"
            />
            <text x="12" y="24" className="text-[9px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
              L = {(L * 1000).toFixed(0)} mH
            </text>
          </g>

          {/* Bottom Wire */}
          <line x1="0" y1="42" x2="0" y2="90" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Bottom Status Badge */}
          <g transform="translate(0, 71)">
            <rect x="-42" y="-9" width="84" height="18" rx="9" className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700 stroke-1" />
            <text x="0" y="3.5" textAnchor="middle" className="text-[8px] font-mono font-bold fill-slate-700 dark:fill-slate-300">
              io = {io.toFixed(1)} A
            </text>
          </g>
        </g>
      )}

      {/* ==================== 3. R LOAD (RESISTIVE) ==================== */}
      {effectiveLoadType === 'R' && (
        <g>
          {/* Header */}
          <text x="0" y="-76" textAnchor="middle" className="text-[10px] font-bold fill-sky-700 dark:fill-sky-300">
            R Load
          </text>
          <text x="0" y="-64" textAnchor="middle" className="text-[8px] font-semibold fill-slate-500 dark:fill-slate-400">
            Pure Resistive
          </text>

          {/* Top Wire */}
          <line x1="0" y1="-90" x2="0" y2="-30" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Resistor R (Centered) */}
          <g>
            <path
              d="M 0,-30 L 0,-24 L 8,-18 L -8,-12 L 8,-6 L -8,0 L 8,6 L -8,12 L 8,18 L 0,24 L 0,30"
              fill="none"
              strokeWidth="2.2"
              className="stroke-slate-800 dark:stroke-slate-200"
            />
            <text x="14" y="3" className="text-[10px] font-mono font-bold fill-slate-800 dark:fill-slate-200">
              R = {R} Ω
            </text>
          </g>

          {/* Bottom Wire */}
          <line x1="0" y1="30" x2="0" y2="90" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Bottom Status Badge */}
          <g transform="translate(0, 71)">
            <rect x="-42" y="-9" width="84" height="18" rx="9" className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700 stroke-1" />
            <text x="0" y="3.5" textAnchor="middle" className="text-[8px] font-mono font-bold fill-slate-700 dark:fill-slate-300">
              io = {io.toFixed(1)} A
            </text>
          </g>
        </g>
      )}

      {/* ==================== 4. CONSTANT CURRENT LOAD (I) ==================== */}
      {effectiveLoadType === 'I' && (
        <g>
          {/* Header */}
          <text x="0" y="-76" textAnchor="middle" className="text-[10px] font-bold fill-sky-700 dark:fill-sky-300">
            Current Sink
          </text>
          <text x="0" y="-64" textAnchor="middle" className="text-[8px] font-semibold fill-cyan-600 dark:fill-cyan-400">
            Ideal Constant Idc
          </text>

          {/* Top Wire */}
          <line x1="0" y1="-90" x2="0" y2="-22" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Constant Current Source Symbol */}
          <g transform="translate(0, 0)">
            <circle cx="0" cy="0" r="18" className="fill-cyan-50 dark:fill-cyan-950/40 stroke-cyan-500 stroke-2" />
            <line x1="0" y1="-9" x2="0" y2="9" className="stroke-cyan-600 stroke-2" />
            <polygon points="0,11 -4,3 4,3" className="fill-cyan-600" />
            <text x="0" y="32" textAnchor="middle" className="text-[9.5px] font-mono font-bold fill-cyan-600">
              Idc = {io.toFixed(1)} A
            </text>
          </g>

          {/* Bottom Wire */}
          <line x1="0" y1="22" x2="0" y2="90" strokeWidth="2" className="stroke-slate-700 dark:stroke-slate-300" />

          {/* Bottom Status Badge */}
          <g transform="translate(0, 71)">
            <rect x="-42" y="-9" width="84" height="18" rx="9" className="fill-cyan-50 dark:fill-cyan-950/60 stroke-cyan-300 dark:stroke-cyan-800 stroke-1" />
            <text x="0" y="3.5" textAnchor="middle" className="text-[8px] font-mono font-bold fill-cyan-700 dark:fill-cyan-300">
              Constant Sink
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
