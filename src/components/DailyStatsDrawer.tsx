import React, { useState, useEffect } from 'react';
import { DailyStats } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface DailyStatsDrawerProps {
  stats: DailyStats;
  onOpenAnalytics: () => void;
  onOpenInventory?: () => void;
  currency?: CurrencyMode;
  t: TranslationDictionary;
}

export const DailyStatsDrawer: React.FC<DailyStatsDrawerProps> = ({
  stats,
  onOpenAnalytics,
  onOpenInventory,
  currency = 'MMK',
  t,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0c0e14]/95 rounded-2xl border border-amber-500/25 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col space-y-4">
      {/* Title & Live Timestamp */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <h2 className="font-orbitron font-bold text-xs tracking-wider text-amber-300 uppercase">
            {t.registerOverview}
          </h2>
        </div>
        <div className="font-mono text-xs text-amber-400 font-bold tracking-widest tabular-nums flex items-center gap-1.5">
          <span className="text-amber-500/60">{t.sysTime}</span>
          <span>{currentTime || '12:00:00'}</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Daily Sales */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141724] to-[#090b10] border border-amber-500/30">
          <span className="text-[11px] font-mono text-amber-500/80 uppercase">{t.totalSalesToday}</span>
          <div className="text-lg font-mono tabular-nums font-extrabold text-amber-200 mt-0.5 gold-outline-text">
            {formatPrice(stats.totalSales, currency)}
          </div>
          <span className="text-[10px] text-amber-500/60 font-mono mt-1 block">
            {stats.transactionsCount} {t.receiptsCount}
          </span>
        </div>

        {/* Items Sold */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141724] to-[#090b10] border border-amber-500/30">
          <span className="text-[11px] font-mono text-amber-500/80 uppercase">{t.itemsSold}</span>
          <div className="text-lg font-mono tabular-nums font-bold text-amber-100 mt-0.5">
            {stats.itemsSold} <span className="text-xs text-amber-400/80 font-normal">{t.unitsLabel}</span>
          </div>
          <span className="text-[10px] text-amber-500/60 font-mono mt-1 block">
            {t.avgPerItem} {stats.itemsSold > 0 ? formatPrice(stats.totalSales / stats.itemsSold, currency) : formatPrice(0, currency)}/item
          </span>
        </div>

        {/* Top Product */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141724] to-[#090b10] border border-amber-500/30">
          <span className="text-[11px] font-mono text-amber-500/80 uppercase">{t.topSellingAsset}</span>
          <div className="text-xs font-bold text-amber-300 mt-1 truncate" title={stats.topProduct.name}>
            {stats.topProduct.units > 0 ? stats.topProduct.name : 'မှတ်တမ်းမရှိသေးပါ'}
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono mt-0.5 block">
            {stats.topProduct.units > 0
              ? `${stats.topProduct.units} ${t.unitsLabel} (${formatPrice(stats.topProduct.revenue, currency)})`
              : '၀ ရောင်းချပြီး'}
          </span>
        </div>
      </div>

      {/* Quick Action Footer Strip */}
      <div className="pt-1 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="text-amber-500/60 text-[11px] hidden sm:block">
          ● REAL-TIME STORE OVERVIEW
        </div>

        <div className="flex items-center gap-2">
          {onOpenInventory && (
            <button
              onClick={() => {
                soundFX.playClick();
                onOpenInventory();
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/30 text-amber-300 hover:border-amber-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📦</span>
              <span>{t.catalogVault}</span>
            </button>
          )}

          <button
            onClick={() => {
              soundFX.playClick();
              onOpenAnalytics();
            }}
            className="btn-gold-ripple px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/20 border border-amber-400/50 text-amber-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>📊</span>
            <span>{t.viewAnalytics}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
