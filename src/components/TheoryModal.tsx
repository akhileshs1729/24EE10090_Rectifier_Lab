import React from 'react';
import { X, BookOpen, CheckCircle, HelpCircle, FileText, Zap } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Rectifier Virtual Laboratory Theory & Derivations
              </h2>
              <p className="text-xs text-slate-500">
                Power Electronics principles, circuit topology analysis & governing equations
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

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300">
          {/* Section 1 */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              1. Single-Phase Full-Bridge Rectifier Operation
            </h3>
            <p className="leading-relaxed">
              A single-phase full-bridge rectifier consists of four switching devices arranged in an H-bridge configuration:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
              <li>
                <strong>Positive Half-Cycle (0 &lt; ωt &lt; π):</strong> Phase A is positive relative to Neutral.
                Switches <strong>T1</strong> (top leg 1) and <strong>T2</strong> (bottom leg 2) are forward-biased.
                When triggered at firing angle <strong>α</strong>, current flows: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Phase A → T1 → (+) Load Rail → Load → (-) Rail → T2 → Neutral</code>.
              </li>
              <li>
                <strong>Negative Half-Cycle (π &lt; ωt &lt; 2π):</strong> Neutral is positive relative to Phase A.
                Switches <strong>T4</strong> and <strong>T3</strong> become forward-biased and conduct when fired at <strong>π + α</strong>.
                Output voltage polarity across the load remains positive, producing full-wave rectified DC.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              2. Effect of Inductive Load (R-L) & Freewheeling Diode (D_FW)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Without Freewheeling Diode:
                </span>
                <p>
                  Because inductors resist instantaneous current changes (<code className="font-mono">v_L = L · di/dt</code>), current continues to flow after <code className="font-mono">ωt = π</code>.
                  The switches T1 and T2 stay ON into the negative half cycle, pulling the load voltage <code className="font-mono">v_o</code> negative until the stored magnetic energy is dissipated or until the opposite pair is fired. This reduces the average DC voltage:
                </p>
                <div className="mt-2 font-mono text-rose-600 dark:text-rose-400 font-bold bg-white dark:bg-slate-900 p-2 rounded">
                  V_dc = (2 · V_m / π) · cos(α)
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  With Freewheeling Diode (D_FW):
                </span>
                <p>
                  As soon as <code className="font-mono">v_s</code> crosses zero at <code className="font-mono">π</code>, <code className="font-mono">D_FW</code> becomes forward-biased and begins conducting the load current.
                  This immediately commutates off T1 & T2 and clamps <code className="font-mono">v_o = 0</code> during <code className="font-mono">π &lt; ωt &lt; π + α</code>, preventing negative output spikes and boosting DC output:
                </p>
                <div className="mt-2 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 p-2 rounded">
                  V_dc = (V_m / π) · (1 + cos α)
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              3. Key Analytical Equations Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-2">Rectifier Topology</th>
                    <th className="p-2">Average DC Voltage (V_dc)</th>
                    <th className="p-2">Ripple Frequency</th>
                    <th className="p-2">Key Feature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2 font-semibold">1Φ Diode Bridge</td>
                    <td className="p-2">2 · V_m / π ≈ 0.636 V_m</td>
                    <td className="p-2">2 · f (100 Hz)</td>
                    <td className="p-2">4 Diodes, PIV = V_m, full-wave</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold">1Φ Thyristor Bridge</td>
                    <td className="p-2">(2 · V_m / π) · cos α</td>
                    <td className="p-2">2 · f (100 Hz)</td>
                    <td className="p-2">Fully controlled, supports inversion</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold">Center-Tapped Full-Wave</td>
                    <td className="p-2">2 · V_m / π ≈ 0.636 V_m</td>
                    <td className="p-2">2 · f (100 Hz)</td>
                    <td className="p-2">2 switches, PIV = 2 · V_m</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold">1Φ Half-Wave</td>
                    <td className="p-2">V_m / π ≈ 0.318 V_m</td>
                    <td className="p-2">1 · f (50 Hz)</td>
                    <td className="p-2">Single switch, discontinuous DC</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold">Single-Phase Semi-Converter</td>
                    <td className="p-2">(V_m / π) · (1 + cos α)</td>
                    <td className="p-2">2 · f (100 Hz)</td>
                    <td className="p-2">2 SCRs + 2 Diodes, inherent freewheeling</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold">3-Phase 6-Pulse Converter</td>
                    <td className="p-2">(3√3 · V_m / π) · cos α ≈ 1.65 V_m cos α</td>
                    <td className="p-2">6 · f (300 Hz)</td>
                    <td className="p-2">6 switches, ultra-low ripple & high efficiency</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Virtual Experiments Guide */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              4. Recommended Virtual Lab Experiments
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Exp 1: Pure Resistive Load vs Diode Bridge:</strong> Set L = 0 mH, select Diode mode. Observe that current waveform i_o exactly mirrors voltage waveform v_o with zero phase shift.
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Exp 2: Thyristor Firing Angle Control:</strong> Switch to Thyristor mode. Slide α from 0° up to 90°. Notice how average voltage V_dc decreases linearly with cos(α).
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Exp 3: Inductive Smoothing & Freewheeling:</strong> Increase L to 45 mH. Toggle the Freewheeling Diode (D_FW) ON and OFF and watch the negative voltage spike disappear on the oscilloscope!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
