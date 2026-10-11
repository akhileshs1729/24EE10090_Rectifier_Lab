import { CircuitParameters, WaveformPoint, RectifierMetrics, HarmonicComponent, InstantaneousState } from '../types/rectifier';

/**
 * Computes the periodic steady-state waveforms and metrics for the rectifier circuit.
 */
export function simulateRectifier(
  params: CircuitParameters,
  cycles: number = 1,
  pointsPerCycle: number = 360
): {
  points: WaveformPoint[];
  metrics: RectifierMetrics;
  harmonics: HarmonicComponent[];
} {
  const {
    topology,
    switchType,
    alpha,
    Vs_rms,
    frequency,
    R,
    L,
    E,
    hasFreewheelingDiode,
    loadType = 'RL',
    Idc = 8.0,
    Ls = 0,
    hasSourceInductance = false
  } = params;

  const Vm = Vs_rms * Math.SQRT2;
  const period = 1 / frequency;
  const omega = 2 * Math.PI * frequency;
  const alphaRad = (alpha * Math.PI) / 180;
  
  // Total points to generate for display
  const totalDisplayPoints = pointsPerCycle * cycles;
  const dt = period / pointsPerCycle;
  const dTheta = (2 * Math.PI) / pointsPerCycle;

  const isCurrentSourceLoad = loadType === 'I';
  const effectiveR = loadType === 'I' ? 0 : R;
  const effectiveL = isCurrentSourceLoad ? 0.2 : (loadType === 'R' ? 0.0001 : Math.max(L, 0.0001));
  const effectiveE = loadType === 'RLE' ? E : 0;

  // Run a warmup of 4 cycles to settle any RL transient into periodic steady state
  const warmupSteps = pointsPerCycle * 4;
  let current_i = isCurrentSourceLoad ? Idc : 0;

  if (!isCurrentSourceLoad) {
    for (let step = 0; step < warmupSteps; step++) {
      const theta = (step * dTheta) % (2 * Math.PI);
      const { vo } = calculateInstantaneousOutputVoltage(theta, current_i, params, Vm, alphaRad);
      
      const di = ((vo - effectiveR * current_i - effectiveE) / effectiveL) * dt;
      let next_i = current_i + di;
      if (next_i < 0) next_i = 0;
      current_i = next_i;
    }
  }

  // Now record the actual steady-state cycle points
  const points: WaveformPoint[] = [];
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let hasZeroCurrentInCycle = false;
  let extinctionAngleRad = 0;

  // Source inductance commutation overlap angle calculation
  const effectiveLsH = (hasSourceInductance && Ls > 0) ? (Ls / 1000) : 0;
  const is3Phase = topology === 'three_phase_bridge' || topology === '3phase_full_bridge' || topology === 'three_phase_controlled' || topology === 'three_phase_semi';

  for (let i = 0; i < totalDisplayPoints; i++) {
    const totalTheta = i * dTheta;
    const cycleTheta = totalTheta % (2 * Math.PI);
    const deg = (i * 360) / pointsPerCycle;
    const timeMs = (i * dt) * 1000;

    // AC Source voltage
    const vs = Vm * Math.sin(cycleTheta);

    // Instantaneous output voltage and active switches based on current conduction state
    const { vo: rawVo, activePair, isFreewheeling, gatePulse, vT1, is } = evaluatePoint(
      cycleTheta,
      current_i,
      params,
      Vm,
      vs,
      alphaRad
    );

    // Apply source inductance voltage notch during commutation if Ls is active
    let vo = rawVo;
    if (effectiveLsH > 0 && current_i > 0.05) {
      // Commutation notch lowers DC voltage slightly during overlap
      const overlapAngleRad = Math.acos(Math.max(-1, Math.min(1, Math.cos(alphaRad) - (2 * omega * effectiveLsH * current_i) / (is3Phase ? Math.sqrt(3) * Vm : Vm)))) - alphaRad;
      const relCycleTheta = cycleTheta % (is3Phase ? (Math.PI / 3) : Math.PI);
      if (relCycleTheta < Math.max(0.01, overlapAngleRad)) {
        vo = is3Phase ? rawVo * 0.5 : 0;
      }
    }

    if (!isCurrentSourceLoad) {
      const di = ((vo - effectiveR * current_i - effectiveE) / effectiveL) * dt;
      let next_i = current_i + di;
      if (next_i < 0) {
        next_i = 0;
        if (current_i > 0) {
          extinctionAngleRad = cycleTheta;
        }
        hasZeroCurrentInCycle = true;
      }
      current_i = next_i;
    } else {
      current_i = Idc;
    }

    // Accumulate for RMS and Average calculations (only for first cycle)
    if (i < pointsPerCycle) {
      sumVo += vo;
      sumVoSq += vo * vo;
      sumIo += current_i;
      sumIoSq += current_i * current_i;
      sumIsSq += is * is;
    }

    points.push({
      deg: Math.round(deg * 10) / 10,
      rad: totalTheta,
      timeMs,
      vs,
      vo,
      io: current_i,
      is,
      vT1,
      gatePulse,
      activePair
    });
  }

  const Vdc = sumVo / pointsPerCycle;
  const Vrms = Math.sqrt(sumVoSq / pointsPerCycle);
  const calculatedIdc = isCurrentSourceLoad ? Idc : (sumIo / pointsPerCycle);
  const Irms = isCurrentSourceLoad ? Idc : Math.sqrt(sumIoSq / pointsPerCycle);
  const Is_rms = Math.sqrt(sumIsSq / pointsPerCycle);

  const formFactor = Vdc > 0.01 ? Vrms / Vdc : 1;
  const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1));

  // Conduction mode determination
  const isContinuous = isCurrentSourceLoad || (!hasZeroCurrentInCycle && calculatedIdc > 0.05 && effectiveL > 0.001);

  // Power & Power factor calculation
  let sumPower = 0;
  for (let i = 0; i < pointsPerCycle; i++) {
    sumPower += points[i].vs * points[i].is;
  }
  const Pload = Math.max(0, Vdc * calculatedIdc);
  const Sin = Math.max(1, is3Phase ? Math.sqrt(3) * (Vs_rms * Math.sqrt(3)) * Is_rms : Vs_rms * Is_rms);
  const powerFactor = Math.min(1, Math.max(0, Pload / Sin));
  const cosPhi1 = Math.max(0, Math.cos(alphaRad));

  // Harmonics calculation (FFT of Vo)
  const harmonics = calculateHarmonics(points.slice(0, pointsPerCycle), frequency, Vdc);

  // Compute THD
  let sumHarmonicSq = 0;
  for (let h = 1; h < harmonics.length; h++) {
    sumHarmonicSq += harmonics[h].magnitude * harmonics[h].magnitude;
  }
  const thdPercent = harmonics[1] && harmonics[1].magnitude > 0.01
    ? (Math.sqrt(Math.max(0, sumHarmonicSq - harmonics[1].magnitude * harmonics[1].magnitude)) / harmonics[1].magnitude) * 100
    : 5.0;

  // Determine Theoretical Formula and Ideal V_dc
  const { theoreticalFormula, idealVdc, theoreticalName, theoreticalDesc } = getTheoreticalFormula(
    topology,
    switchType,
    Vm,
    Vs_rms,
    alphaRad,
    effectiveLsH,
    calculatedIdc,
    frequency
  );

  const metrics: RectifierMetrics = {
    Vdc,
    Vrms,
    Idc: calculatedIdc,
    Irms,
    Pload,
    Sin,
    powerFactor,
    cosPhi1,
    rippleFactor,
    formFactor,
    thdPercent: Math.min(thdPercent, 150),
    conductionMode: isContinuous ? 'Continuous (CCM)' : 'Discontinuous (DCM)',
    extinctionAngleDeg: Math.round((extinctionAngleRad * 180) / Math.PI),
    idealVdc,
    theoreticalFormula,
    theoreticalName,
    theoreticalDesc
  };

  return { points, metrics, harmonics };
}

function getTheoreticalFormula(
  topology: CircuitParameters['topology'],
  switchType: CircuitParameters['switchType'],
  Vm: number,
  Vs_rms: number,
  alphaRad: number,
  Ls: number,
  Idc: number,
  freq: number
): {
  theoreticalFormula: string;
  idealVdc: number;
  theoreticalName: string;
  theoreticalDesc: string;
} {
  const pi = Math.PI;
  const omega = 2 * pi * freq;
  let deltaV_Ls = 0;

  if (topology === 'single_phase_semi') {
    const ideal = (Vm / pi) * (1 + Math.cos(alphaRad));
    deltaV_Ls = Ls > 0 ? (omega * Ls * Idc) / pi : 0;
    return {
      theoreticalFormula: 'V_{dc} = \\frac{V_m}{\\pi} (1 + \\cos\\alpha)',
      idealVdc: Math.max(0, ideal - deltaV_Ls),
      theoreticalName: '1-Phase Semi-Converter (Half-Controlled Bridge / with FWD) — Analytical DC Voltage Equation',
      theoreticalDesc: 'One quadrant operation with freewheeling action clamping negative voltage spikes.'
    };
  }

  if (topology === 'three_phase_bridge' || topology === '3phase_full_bridge') {
    if (switchType === 'thyristor') {
      const ideal = ((3 * Math.sqrt(3) * Vm) / pi) * Math.cos(alphaRad);
      deltaV_Ls = Ls > 0 ? (3 * omega * Ls * Idc) / pi : 0;
      return {
        theoreticalFormula: 'V_{dc} = \\frac{3\\sqrt{3}V_m}{\\pi} \\cos\\alpha',
        idealVdc: Math.max(0, ideal - deltaV_Ls),
        theoreticalName: '3-Phase 6-Pulse Controlled Converter — Analytical DC Voltage Equation',
        theoreticalDesc: 'Fully controlled 6-SCR converter with wide DC voltage regulation.'
      };
    } else {
      const ideal = (3 * Math.sqrt(3) * Vm) / pi;
      deltaV_Ls = Ls > 0 ? (3 * omega * Ls * Idc) / pi : 0;
      return {
        theoreticalFormula: 'V_{dc} = \\frac{3\\sqrt{3}V_m}{\\pi} = \\frac{3 V_{LL,peak}}{\\pi}',
        idealVdc: Math.max(0, ideal - deltaV_Ls),
        theoreticalName: '3-Phase 6-Pulse Diode Bridge Rectifier — Analytical DC Voltage Equation',
        theoreticalDesc: 'Industry standard 6-diode converter with high 300Hz pulse ripple frequency.'
      };
    }
  }

  if (topology === 'three_phase_semi') {
    const ideal = ((3 * Math.sqrt(3) * Vm) / (2 * pi)) * (1 + Math.cos(alphaRad));
    deltaV_Ls = Ls > 0 ? (3 * omega * Ls * Idc) / (2 * pi) : 0;
    return {
      theoreticalFormula: 'V_{dc} = \\frac{3\\sqrt{3}V_m}{2\\pi} (1 + \\cos\\alpha)',
      idealVdc: Math.max(0, ideal - deltaV_Ls),
      theoreticalName: '3-Phase Semi-Converter (3T + 3D) — Analytical DC Voltage Equation',
      theoreticalDesc: 'Half-controlled 3-phase bridge with natural zero-voltage freewheeling.'
    };
  }

  if (topology === 'half_wave' || topology === '1phase_half_wave') {
    if (switchType === 'thyristor') {
      const ideal = (Vm / (2 * pi)) * (1 + Math.cos(alphaRad));
      return {
        theoreticalFormula: 'V_{dc} = \\frac{V_m}{2\\pi} (1 + \\cos\\alpha)',
        idealVdc: Math.max(0, ideal),
        theoreticalName: '1-Phase Half-Wave Controlled Rectifier — Analytical DC Voltage Equation',
        theoreticalDesc: 'Single switch converter conducting positive half-cycle only with gate trigger delay.'
      };
    } else {
      const ideal = Vm / pi;
      return {
        theoreticalFormula: 'V_{dc} = \\frac{V_m}{\\pi}',
        idealVdc: ideal,
        theoreticalName: '1-Phase Half-Wave Diode Rectifier — Analytical DC Voltage Equation',
        theoreticalDesc: 'Single diode conducting during positive half-cycle.'
      };
    }
  }

  // Single-phase Full-bridge
  if (switchType === 'thyristor') {
    const ideal = ((2 * Vm) / pi) * Math.cos(alphaRad);
    deltaV_Ls = Ls > 0 ? (2 * omega * Ls * Idc) / pi : 0;
    return {
      theoreticalFormula: 'V_{dc} = \\frac{2V_m}{\\pi} \\cos\\alpha',
      idealVdc: Math.max(0, ideal - deltaV_Ls),
      theoreticalName: '1-Phase Fully Controlled Bridge Converter — Analytical DC Voltage Equation',
      theoreticalDesc: 'Two-quadrant converter allowing variable DC voltage via firing delay angle α.'
    };
  } else {
    const ideal = (2 * Vm) / pi;
    deltaV_Ls = Ls > 0 ? (2 * omega * Ls * Idc) / pi : 0;
    return {
      theoreticalFormula: 'V_{dc} = \\frac{2V_m}{\\pi}',
      idealVdc: Math.max(0, ideal - deltaV_Ls),
      theoreticalName: '1-Phase Diode Full-Bridge Rectifier — Analytical DC Voltage Equation',
      theoreticalDesc: 'Uncontrolled 4-diode full-wave rectifier converting both AC half-cycles.'
    };
  }
}

function calculateInstantaneousOutputVoltage(
  theta: number,
  current_i: number,
  params: CircuitParameters,
  Vm: number,
  alphaRad: number
): { vo: number } {
  const { topology, switchType, hasFreewheelingDiode, E } = params;
  const isDiodeMode = switchType === 'diode' || topology === 'diode_bridge';
  const effectiveAlpha = isDiodeMode ? 0 : alphaRad;
  const pi = Math.PI;

  const isBridge = topology === '1phase_full_bridge' || topology === 'diode_bridge' || topology === 'thyristor_controlled';
  const isCenterTap = topology === 'full_wave_center_tap';
  const isSemi = topology === 'single_phase_semi';
  const isHalfWave = topology === 'half_wave' || topology === '1phase_half_wave';
  const isThreePhase = topology === 'three_phase_bridge' || topology === '3phase_full_bridge' || topology === 'three_phase_controlled' || topology === 'three_phase_semi';

  if (isBridge || isCenterTap) {
    const isPosCycle = theta < pi;
    const cycleOffset = isPosCycle ? 0 : pi;
    const relTheta = theta - cycleOffset;
    const vs = Vm * Math.sin(theta);

    if (relTheta >= effectiveAlpha && relTheta < pi) {
      return { vo: Math.abs(vs) };
    } else {
      if (hasFreewheelingDiode && current_i > 0.001) {
        return { vo: 0 };
      }
      if (!hasFreewheelingDiode && current_i > 0.001) {
        return { vo: isPosCycle ? -Math.abs(vs) : Math.abs(vs) };
      }
      return { vo: E };
    }
  } else if (isSemi) {
    const isPosCycle = theta < pi;
    const cycleOffset = isPosCycle ? 0 : pi;
    const relTheta = theta - cycleOffset;
    const vs = Vm * Math.sin(theta);

    if (relTheta >= effectiveAlpha && relTheta < pi) {
      return { vo: Math.abs(vs) };
    } else if (current_i > 0.001) {
      return { vo: 0 };
    } else {
      return { vo: E };
    }
  } else if (isHalfWave) {
    const vs = Vm * Math.sin(theta);
    if (theta >= effectiveAlpha && theta < pi) {
      return { vo: Math.max(0, vs) };
    } else if (theta >= pi && current_i > 0.001) {
      if (hasFreewheelingDiode) return { vo: 0 };
      return { vo: vs };
    }
    return { vo: E };
  } else if (topology === 'three_phase_semi') {
    // 3-Phase Semi-Converter (Half-Controlled Bridge)
    const norm = ((theta % (2 * pi)) + 2 * pi) % (2 * pi);
    const va = Vm * Math.sin(norm);
    const vb = Vm * Math.sin(norm - (2 * pi) / 3);
    const vc = Vm * Math.sin(norm + (2 * pi) / 3);

    const inRange = (angle: number, start: number, span: number) => {
      const diff = (angle - start + 4 * pi) % (2 * pi);
      return diff < span;
    };

    const t1_fire = (pi / 6 + effectiveAlpha) % (2 * pi);
    const t3_fire = (5 * pi / 6 + effectiveAlpha) % (2 * pi);

    let topV = va;
    if (inRange(norm, t1_fire, (2 * pi) / 3)) {
      topV = va;
    } else if (inRange(norm, t3_fire, (2 * pi) / 3)) {
      topV = vb;
    } else {
      topV = vc;
    }

    // Bottom diode conducts most negative phase: D4 (Ph A), D6 (Ph B), D2 (Ph C)
    let botV = vc;
    if (va <= vb && va <= vc) {
      botV = va;
    } else if (vb <= va && vb <= vc) {
      botV = vb;
    } else {
      botV = vc;
    }

    const rawVo = topV - botV;
    const vo = Math.max(0, rawVo);
    return { vo };
  } else {
    // 3-Phase Full Bridge (6-Pulse)
    const linePeak = Math.sqrt(3) * Vm;
    const pulseIndex = Math.floor((((theta - effectiveAlpha) % (2 * pi) + 2 * pi) % (2 * pi)) / (pi / 3));
    const phaseOffset = effectiveAlpha + pulseIndex * (pi / 3) + pi / 6;
    const vo = Math.max(0, linePeak * Math.cos(theta - phaseOffset));
    return { vo };
  }
}

function evaluatePoint(
  theta: number,
  current_i: number,
  params: CircuitParameters,
  Vm: number,
  vs: number,
  alphaRad: number
): {
  vo: number;
  activePair: string;
  isFreewheeling: boolean;
  gatePulse: number;
  vT1: number;
  is: number;
} {
  const { topology, switchType, hasFreewheelingDiode, E } = params;
  const isDiodeMode = switchType === 'diode' || topology === 'diode_bridge';
  const effectiveAlpha = isDiodeMode ? 0 : alphaRad;
  const pi = Math.PI;

  let vo = 0;
  let activePair = 'OFF';
  let isFreewheeling = false;
  let gatePulse = 0;
  let vT1 = 0;
  let is = 0;

  const isBridge = topology === '1phase_full_bridge' || topology === 'diode_bridge' || topology === 'thyristor_controlled';
  const isCenterTap = topology === 'full_wave_center_tap';
  const isSemi = topology === 'single_phase_semi';
  const isHalfWave = topology === 'half_wave' || topology === '1phase_half_wave';

  const pulseWidth = (10 * Math.PI) / 180;
  if (!isDiodeMode) {
    if ((theta >= alphaRad && theta <= alphaRad + pulseWidth) ||
        (theta >= pi + alphaRad && theta <= pi + alphaRad + pulseWidth)) {
      gatePulse = 1;
    }
  }

  if (isBridge) {
    const isPosCycle = theta < pi;
    const cycleOffset = isPosCycle ? 0 : pi;
    const relTheta = theta - cycleOffset;
    const p1 = isDiodeMode ? 'D1 + D2' : 'T1 + T2';
    const p2 = isDiodeMode ? 'D3 + D4' : 'T3 + T4';

    if (relTheta >= effectiveAlpha && relTheta < pi) {
      vo = Math.abs(vs);
      activePair = isPosCycle ? p1 : p2;
      is = isPosCycle ? current_i : -current_i;
      vT1 = isPosCycle ? 0 : -vs;
    } else {
      if (hasFreewheelingDiode && current_i > 0.001) {
        vo = 0;
        activePair = 'D_FW';
        isFreewheeling = true;
        is = 0;
        vT1 = isPosCycle ? vs : 0;
      } else if (!hasFreewheelingDiode && current_i > 0.001) {
        vo = vs;
        activePair = isPosCycle ? p2 : p1;
        is = isPosCycle ? -current_i : current_i;
        vT1 = isPosCycle ? -vs : 0;
      } else {
        vo = E;
        activePair = 'OFF';
        is = 0;
        vT1 = vs / 2;
      }
    }
  } else if (isCenterTap) {
    const sw1 = isDiodeMode ? 'D1' : 'T1';
    const sw2 = isDiodeMode ? 'D2' : 'T2';

    if (theta >= effectiveAlpha && theta < pi) {
      vo = Math.max(0, vs);
      activePair = sw1;
      is = current_i;
      vT1 = 0;
    } else if (theta >= pi && theta < pi + effectiveAlpha) {
      if (hasFreewheelingDiode && current_i > 0.001) {
        vo = 0;
        activePair = 'D_FW';
        isFreewheeling = true;
        is = 0;
        vT1 = vs;
      } else if (!hasFreewheelingDiode && current_i > 0.001) {
        vo = vs;
        activePair = sw1;
        is = current_i;
        vT1 = 0;
      } else {
        vo = E;
        activePair = 'OFF';
        is = 0;
        vT1 = vs;
      }
    } else if (theta >= pi + effectiveAlpha && theta < 2 * pi) {
      vo = -vs;
      activePair = sw2;
      is = -current_i;
      vT1 = 2 * vs;
    } else {
      if (hasFreewheelingDiode && current_i > 0.001) {
        vo = 0;
        activePair = 'D_FW';
        isFreewheeling = true;
        is = 0;
        vT1 = -vs;
      } else if (!hasFreewheelingDiode && current_i > 0.001) {
        vo = -vs;
        activePair = sw2;
        is = -current_i;
        vT1 = -vs;
      } else {
        vo = E;
        activePair = 'OFF';
        is = 0;
        vT1 = vs;
      }
    }
  } else if (isSemi) {
    if (theta >= effectiveAlpha && theta < pi) {
      vo = Math.max(0, vs);
      activePair = 'T1 + D2';
      is = current_i;
      vT1 = 0;
    } else if (theta >= pi && theta < pi + effectiveAlpha) {
      vo = 0;
      activePair = current_i > 0.001 ? 'D2 + D4 (FW)' : 'OFF';
      isFreewheeling = current_i > 0.001;
      is = 0;
      vT1 = vs;
    } else if (theta >= pi + effectiveAlpha && theta < 2 * pi) {
      vo = -vs;
      activePair = 'T3 + D4';
      is = -current_i;
      vT1 = vs;
    } else {
      vo = 0;
      activePair = current_i > 0.001 ? 'D2 + D4 (FW)' : 'OFF';
      isFreewheeling = current_i > 0.001;
      is = 0;
      vT1 = -vs;
    }
  } else if (isHalfWave) {
    const sw = isDiodeMode ? 'D1' : 'T1';
    if (theta >= effectiveAlpha && theta < pi) {
      vo = vs;
      activePair = sw;
      is = current_i;
      vT1 = 0;
    } else if (theta >= pi && current_i > 0.001) {
      if (hasFreewheelingDiode) {
        vo = 0;
        activePair = 'D_FW';
        isFreewheeling = true;
        is = 0;
        vT1 = vs;
      } else {
        vo = vs;
        activePair = sw;
        is = current_i;
        vT1 = 0;
      }
    } else {
      vo = E;
      activePair = 'OFF';
      is = 0;
      vT1 = vs;
    }
  } else if (topology === 'three_phase_semi') {
    // 3-Phase Semi-Converter (3T + 3D)
    const norm = ((theta % (2 * pi)) + 2 * pi) % (2 * pi);
    const va = Vm * Math.sin(norm);
    const vb = Vm * Math.sin(norm - (2 * pi) / 3);
    const vc = Vm * Math.sin(norm + (2 * pi) / 3);

    const inRange = (angle: number, start: number, span: number) => {
      const diff = (angle - start + 4 * pi) % (2 * pi);
      return diff < span;
    };

    const t1_fire = (pi / 6 + effectiveAlpha) % (2 * pi);
    const t3_fire = (5 * pi / 6 + effectiveAlpha) % (2 * pi);
    const t5_fire = (9 * pi / 6 + effectiveAlpha) % (2 * pi);

    const pulseW = (10 * Math.PI) / 180;
    if (
      inRange(norm, t1_fire, pulseW) ||
      inRange(norm, t3_fire, pulseW) ||
      inRange(norm, t5_fire, pulseW)
    ) {
      gatePulse = 1;
    }

    let topSw = 'T1';
    let topPh = 'A';
    let topV = va;
    if (inRange(norm, t1_fire, (2 * pi) / 3)) {
      topSw = 'T1';
      topPh = 'A';
      topV = va;
    } else if (inRange(norm, t3_fire, (2 * pi) / 3)) {
      topSw = 'T3';
      topPh = 'B';
      topV = vb;
    } else {
      topSw = 'T5';
      topPh = 'C';
      topV = vc;
    }

    // Bottom diode conducts most negative phase: D4 (Ph A), D6 (Ph B), D2 (Ph C)
    let botSw = 'D2';
    let botPh = 'C';
    let botV = vc;
    if (va <= vb && va <= vc) {
      botSw = 'D4';
      botPh = 'A';
      botV = va;
    } else if (vb <= va && vb <= vc) {
      botSw = 'D6';
      botPh = 'B';
      botV = vb;
    } else {
      botSw = 'D2';
      botPh = 'C';
      botV = vc;
    }

    const rawVo = topV - botV;
    if (rawVo <= 0) {
      vo = 0;
      activePair = 'D_FW';
      isFreewheeling = true;
      is = 0;
    } else {
      vo = rawVo;
      activePair = `${topSw}+${botSw}`;
      isFreewheeling = false;
      if (topPh === 'A') is = current_i;
      else if (botPh === 'A') is = -current_i;
      else is = 0;
    }
    vT1 = topSw === 'T1' ? 0 : va - topV;
  } else {
    // 3-Phase Full Bridge
    const linePeak = Math.sqrt(3) * Vm;
    const pulse = Math.floor((((theta - effectiveAlpha) % (2 * pi) + 2 * pi) % (2 * pi)) / (pi / 3));
    const phaseOffset = effectiveAlpha + pulse * (pi / 3) + pi / 6;
    vo = Math.max(0, linePeak * Math.cos(theta - phaseOffset));
    const prefix = isDiodeMode ? 'D' : 'T';
    const pairs = [
      `${prefix}1+${prefix}2`,
      `${prefix}2+${prefix}3`,
      `${prefix}3+${prefix}4`,
      `${prefix}4+${prefix}5`,
      `${prefix}5+${prefix}6`,
      `${prefix}6+${prefix}1`
    ];
    activePair = pairs[pulse % 6];
    is = (pulse === 0 || pulse === 5) ? current_i : ((pulse === 2 || pulse === 3) ? -current_i : 0);
    vT1 = (pulse === 0 || pulse === 5) ? 0 : -Vm;
  }

  return { vo, activePair, isFreewheeling, gatePulse, vT1, is };
}

function calculateHarmonics(
  cyclePoints: WaveformPoint[],
  baseFreq: number,
  Vdc: number
): HarmonicComponent[] {
  const N = cyclePoints.length;
  const harmonics: HarmonicComponent[] = [];

  harmonics.push({
    order: 0,
    freqHz: 0,
    magnitude: Math.abs(Vdc),
    phaseDeg: 0,
    percentageOfDc: 100
  });

  const maxOrder = 10;
  for (let n = 1; n <= maxOrder; n++) {
    let an = 0;
    let bn = 0;
    for (let k = 0; k < N; k++) {
      const angle = n * cyclePoints[k].rad;
      an += cyclePoints[k].vo * Math.cos(angle);
      bn += cyclePoints[k].vo * Math.sin(angle);
    }
    an = (2 * an) / N;
    bn = (2 * bn) / N;
    const mag = Math.sqrt(an * an + bn * bn);
    const phase = (Math.atan2(bn, an) * 180) / Math.PI;

    harmonics.push({
      order: n,
      freqHz: n * baseFreq,
      magnitude: mag,
      phaseDeg: phase,
      percentageOfDc: Vdc > 0.01 ? (mag / Vdc) * 100 : 0
    });
  }

  return harmonics;
}

export function getInstantaneousState(
  deg: number,
  points: WaveformPoint[],
  _params: CircuitParameters
): InstantaneousState {
  if (!points || points.length === 0) {
    return {
      omegaT: 0,
      angleDeg: deg,
      vs: 0,
      vo: 0,
      io: 0,
      is: 0,
      vT1: 0,
      gateT1: false,
      gateT3: false,
      activeSwitches: [],
      activeLoopDescription: 'Ready',
      isFreewheeling: false,
      conductionMode: 'DCM'
    };
  }

  const normDeg = ((deg % 360) + 360) % 360;
  const omegaT = (normDeg * Math.PI) / 180;
  
  const index = Math.min(
    points.length - 1,
    Math.max(0, Math.round((normDeg / 360) * (points.length - 1)))
  );
  const pt = points[index] || points[0];

  let activeSwitches: string[] = [];
  let desc = 'No Conduction (OFF)';

  if (pt.activePair === 'D_FW' || pt.activePair.includes('FW')) {
    activeSwitches = ['D_FW'];
    desc = 'Freewheeling Loop Active via D_FW (Clamped to 0V)';
  } else if (pt.activePair.includes('T1+D2') || pt.activePair.includes('T1 + D2')) {
    activeSwitches = ['T1', 'D2'];
    desc = 'Active Pair: T1 (Ph A SCR) + D2 (Ph C Diode)';
  } else if (pt.activePair.includes('T1+D6') || pt.activePair.includes('T1 + D6')) {
    activeSwitches = ['T1', 'D6'];
    desc = 'Active Pair: T1 (Ph A SCR) + D6 (Ph B Diode)';
  } else if (pt.activePair.includes('T3+D6') || pt.activePair.includes('T3 + D6')) {
    activeSwitches = ['T3', 'D6'];
    desc = 'Active Pair: T3 (Ph B SCR) + D6 (Ph B Diode)';
  } else if (pt.activePair.includes('T3+D4') || pt.activePair.includes('T3 + D4')) {
    activeSwitches = ['T3', 'D4'];
    desc = 'Active Pair: T3 (Ph B SCR) + D4 (Ph A Diode)';
  } else if (pt.activePair.includes('T5+D4') || pt.activePair.includes('T5 + D4')) {
    activeSwitches = ['T5', 'D4'];
    desc = 'Active Pair: T5 (Ph C SCR) + D4 (Ph A Diode)';
  } else if (pt.activePair.includes('T5+D2') || pt.activePair.includes('T5 + D2')) {
    activeSwitches = ['T5', 'D2'];
    desc = 'Active Pair: T5 (Ph C SCR) + D2 (Ph C Diode)';
  } else if (pt.activePair.includes('T1 + T2') || pt.activePair.includes('D1 + D2')) {
    activeSwitches = ['T1', 'T2', 'D1', 'D2'];
    desc = `Bridge Pair ${pt.activePair} (Positive Half)`;
  } else if (pt.activePair.includes('T3 + T4') || pt.activePair.includes('D3 + D4')) {
    activeSwitches = ['T3', 'T4', 'D3', 'D4'];
    desc = `Bridge Pair ${pt.activePair} (Negative Half)`;
  } else if (pt.activePair.includes('T1 + D2')) {
    activeSwitches = ['T1', 'D2'];
    desc = 'Forward Conduction: T1 (SCR) + D2 (Diode)';
  } else if (pt.activePair.includes('T3 + D4')) {
    activeSwitches = ['T3', 'D4'];
    desc = 'Forward Conduction: T3 (SCR) + D4 (Diode)';
  } else if (pt.activePair === 'T1' || pt.activePair === 'D1') {
    activeSwitches = ['T1', 'D1'];
    desc = `Active Switch ${pt.activePair}`;
  } else if (pt.activePair === 'T2' || pt.activePair === 'D2') {
    activeSwitches = ['T2', 'D2'];
    desc = `Active Switch ${pt.activePair}`;
  } else if (pt.activePair !== 'OFF') {
    activeSwitches = pt.activePair.split('+').map(s => s.trim());
    desc = `Active Pair: ${pt.activePair}`;
  }

  const isPos = Math.sin(omegaT) >= 0;
  const Vm = _params.Vs_rms * Math.SQRT2;

  return {
    omegaT,
    angleDeg: normDeg,
    vs: pt.vs,
    vo: pt.vo,
    io: pt.io,
    is: pt.is,
    vT1: pt.vT1,
    gateT1: pt.gatePulse > 0.5 && isPos,
    gateT3: pt.gatePulse > 0.5 && !isPos,
    activeSwitches,
    activeLoopDescription: desc,
    isFreewheeling: pt.activePair.includes('FW') || pt.activePair.includes('D_FW'),
    conductionMode: pt.io > 0.05 ? 'CCM' : 'DCM',
    vsa: Vm * Math.sin(omegaT),
    vsb: Vm * Math.sin(omegaT - (2 * Math.PI) / 3),
    vsc: Vm * Math.sin(omegaT + (2 * Math.PI) / 3)
  };
}
