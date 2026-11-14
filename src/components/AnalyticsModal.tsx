import React, { useState } from 'react';
import { DailyStats, CompletedSale } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface AnalyticsModalProps {
  stats: DailyStats;
  recentSales: CompletedSale[];
  onClose: () => void;
  currency?: CurrencyMode;
  t: TranslationDictionary;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  stats,
  recentSales,
  onClose,
  currency = 'MMK',
  t,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Maximum hourly value for scaling the bar chart
  const maxHourly = Math.max(...stats.hourlySales.map(h => h.sales), 1000);

  const handleExportCSV = () => {
    soundFX.playGoldChime();
    const rows = [
      ['Transaction ID', 'Timestamp', 'Cashier', 'Method', 'Items Count', 'Total ($)'],
      ...recentSales.map(s => [
        s.id,
        s.timestamp,
        s.cashierName,
        s.paymentMethod,
        s.items.reduce((acc, i) => acc + i.quantity, 0).toString(),
        s.total.toFixed(2),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kks_cashier_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('CSV ledger report successfully generated and downloaded.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportPDF = () => {
    soundFX.playGoldChime();
    setExportNotice('Manager Z-Report compiled for daily store reconciliation.');
    setTimeout(() => setExportNotice(null), 4000);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0c0e15] border-2 border-amber-500/40 rounded-2xl max-w-4xl w-full shadow-[0_0_60px_rgba(245,183,0,0.3)] overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-500/25 bg-gradient-to-r from-[#141624] via-[#10121c] to-[#0c0e15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,183,0,0.3)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
                {t.storeIntelligence}
              </span>
              <h2 className="font-orbitron font-extrabold text-lg text-amber-200 tracking-wide">
                {t.salesReports}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex bg-neutral-900 border border-amber-500/30 rounded-lg p-0.5">
              {(['today', 'week', 'month'] as const).map(tab => {
                const label = tab === 'today' ? t.today : tab === 'week' ? t.week : t.month;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedTimeframe(tab);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all uppercase ${
                      selectedTimeframe === tab
                        ? 'bg-amber-400 text-black shadow'
                        : 'text-amber-400/70 hover:text-amber-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notice feedback */}
        {exportNotice && (
          <div className="px-6 py-2 bg-amber-500/20 border-b border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Modal Scroll Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Metric Strips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141624] to-[#090b10] border border-amber-500/30">
              <span className="text-[10px] font-mono text-amber-500/80 uppercase">{t.grossVolume}</span>
              <div className="text-xl font-mono tabular-nums font-extrabold text-amber-200 mt-1">
                {formatPrice(stats.totalSales, currency)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141624] to-[#090b10] border border-amber-500/30">
              <span className="text-[10px] font-mono text-amber-500/80 uppercase">{t.avgBasket}</span>
              <div className="text-xl font-mono tabular-nums font-extrabold text-amber-200 mt-1">
                {formatPrice(stats.totalSales / Math.max(1, stats.transactionsCount), currency)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141624] to-[#090b10] border border-amber-500/30">
              <span className="text-[10px] font-mono text-amber-500/80 uppercase">{t.itemsSold}</span>
              <div className="text-xl font-mono tabular-nums font-extrabold text-amber-200 mt-1">
                {stats.itemsSold}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141624] to-[#090b10] border border-amber-500/30">
              <span className="text-[10px] font-mono text-amber-500/80 uppercase">{t.settlementRatio}</span>
              <div className="text-xl font-mono tabular-nums font-extrabold text-amber-200 mt-1">
                99.8%
              </div>
            </div>
          </div>

          {/* Main Hourly Revenue Chart */}
          <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-orbitron text-xs font-bold text-amber-200 uppercase tracking-wider">
                  {t.hourlyRevenueCurve}
                </h3>
                <span className="text-[11px] text-amber-500/70 font-mono">
                  {t.hourlyRevenueSub}
                </span>
              </div>
              <span className="text-xs font-mono text-amber-300 font-bold">{t.peakHour}</span>
            </div>

            {/* Custom Glowing SVG / Bar Visualizer */}
            <div className="h-44 flex items-end gap-3 pt-4 pb-2 px-2 border-b border-amber-500/20">
              {stats.hourlySales.map((item, idx) => {
                const heightPercent = Math.max(10, Math.round((item.sales / maxHourly) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-amber-200 bg-black/90 px-2 py-0.5 rounded border border-amber-500/40 mb-1 whitespace-nowrap shadow-[0_0_10px_rgba(245,183,0,0.3)]">
                      {formatPrice(item.sales, currency)}
                    </div>
                    {/* The Bar */}
                    <div
                      className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300 transition-all duration-300 group-hover:brightness-125 relative shadow-[0_0_12px_rgba(245,183,0,0.35)]"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-amber-100 rounded-t-lg" />
                    </div>
                    {/* Hour label */}
                    <span className="text-[10px] font-mono text-amber-500/80 mt-2 whitespace-nowrap">
                      {item.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown & Performance Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Distribution */}
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 space-y-3">
              <h4 className="font-orbitron text-xs font-semibold text-amber-200 uppercase">
                {t.departmentRevenue}
              </h4>
              <div className="space-y-3">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-amber-100">{cat.category}</span>
                      <span className="text-amber-300 font-bold">
                        {formatPrice(cat.amount, currency)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-amber-500/20">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manager Export & Quick Actions */}
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <h4 className="font-orbitron text-xs font-semibold text-amber-200 uppercase mb-2">
                  {t.managerExportControls}
                </h4>
                <p className="text-xs text-amber-500/70 font-mono mb-4">
                  {t.managerExportDesc}
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleExportCSV}
                  className="btn-gold-ripple w-full py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{t.exportCsv}</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-amber-300 bg-neutral-900/90 border border-amber-500/30 hover:border-amber-400 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>{t.printDailyZReport}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-r from-[#141624] to-[#0c0e15] border-t border-amber-500/25 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs bg-neutral-800 text-amber-200 hover:bg-neutral-700 transition-colors"
          >
            {t.closeReports}
          </button>
        </div>
      </div>
    </div>
  );
};
