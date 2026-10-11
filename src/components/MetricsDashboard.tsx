import React from 'react';
import { RectifierMetrics } from '../types/rectifier';
import { BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MetricsDashboardProps {
  metrics: RectifierMetrics;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const isCcm = metrics.conductionMode.includes('Continuous') || metrics.conductionMode.includes('CCM');

  return (
    <div className="space-y-3">
      {/* 6 Performance Metrics Cards matching Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Avg DC Voltage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Avg DC Voltage
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              V_dc
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {metrics.Vdc.toFixed(1)} <span className="text-xs font-normal text-slate-500">V</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            V_rms = {metrics.Vrms.toFixed(1)} V
          </div>
        </div>

        {/* 2. Avg DC Current */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Avg DC Current
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              I_dc
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.Idc.toFixed(2)} <span className="text-xs font-normal text-slate-500">A</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            I_rms = {metrics.Irms.toFixed(2)} A
          </div>
        </div>

        {/* 3. Output Power */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Output Power
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              P_load
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {metrics.Pload.toFixed(1)} <span className="text-xs font-normal text-slate-500">W</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            S_in = {metrics.Sin.toFixed(0)} VA
          </div>
        </div>

        {/* 4. Power Factor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Power Factor
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              PF
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {metrics.powerFactor.toFixed(3)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            cos(φ1) = {metrics.cosPhi1.toFixed(3)}
          </div>
        </div>

        {/* 5. Ripple Factor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Ripple Factor
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              RF
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {metrics.rippleFactor.toFixed(3)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            Form Factor FF = {metrics.formFactor.toFixed(2)}
          </div>
        </div>

        {/* 6. Source THD_i */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Source THD_i
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              THD
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
            {metrics.thdPercent.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <div className="text-[10px] font-mono flex items-center gap-1 mt-1 font-semibold">
            {isCcm ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 inline" /> CCM Mode
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3 inline" /> DCM Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analytical DC Voltage Equation Bar matching Image 1 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mt-0.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {metrics.theoreticalName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {metrics.theoreticalDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 self-start md:self-auto bg-slate-50/80 dark:bg-slate-950/60 p-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
              Theoretical Formula
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-sky-600 dark:text-sky-400">
              {metrics.theoreticalFormula}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

          <div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
              Ideal Theoretical V_dc
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.idealVdc.toFixed(1)} V
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
