import React, { useState } from 'react';
import { soundFX } from '../utils/audio';

interface SearchSource {
  title: string;
  url: string;
}

interface MarketSearchResult {
  query: string;
  answer: string;
  sources: SearchSource[];
  suggestedPrice?: number;
  isFallback?: boolean;
  quotaExceeded?: boolean;
}

interface MarketSearchModalProps {
  onClose: () => void;
  onQuickAddItem?: (name: string, price: number) => void;
}

const SAMPLE_QUERIES = [
  'မြန်မာပါတိတ် လက်လီလက်ကား ပေါက်စျေး',
  'ကုန်စုံဆိုင် လူသုံးကုန်ပစ္စည်းများ လက်ရှိပေါက်စျေး',
  'ပရီမီယံ ရိုးရာအထည် စျေးနှုန်းများ',
  'သောက်ရေသန့်နှင့် အအေး လက်လီစျေးနှုန်းများ ရန်ကုန်',
];

export const MarketSearchModal: React.FC<MarketSearchModalProps> = ({ onClose, onQuickAddItem }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    soundFX.playClick();

    try {
      const res = await fetch('/api/ai/market-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'စျေးကွက်အချက်အလက် ရှာဖွေရာတွင် ခေတ္တမအားလပ်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။');
      }

      const data = await res.json();
      setResult(data);
      soundFX.playGoldChime();
    } catch (err: any) {
      console.warn('Market search handled notice:', err);
      setError(err?.message || 'စျေးကွက်အချက်အလက် ရယူရန် ခေတ္တစောင့်ဆိုင်းပါ');
      soundFX.playWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0c12] border-2 border-amber-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(245,183,0,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/25 bg-gradient-to-r from-amber-950/40 via-black to-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(245,183,0,0.4)] border border-amber-300/40 shrink-0 text-lg">
              🔍
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-orbitron font-bold text-base sm:text-lg text-amber-200">
                  AI Real-Time Market Search
                </h2>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  GOOGLE SEARCH GROUNDED
                </span>
              </div>
              <p className="text-xs text-amber-500/80 font-mono mt-0.5">
                Gemini 3.8 Flash ဖြင့် မြန်မာ့လက်လီစျေးကွက်ပေါက်စျေးနှင့် သတင်းများကို ရှာဖွေခြင်း
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ဥပမာ - ပါတိတ်အင်္ကျီ လက်လီပေါက်စျေး၊ ရေသန့်စျေးနှုန်း၊ ကော်ဖီပေါက်စျေး..."
                className="flex-1 bg-black/60 border border-amber-500/30 rounded-xl px-4 py-3 text-xs sm:text-sm font-myanmar text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn-gold-ripple px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,183,0,0.3)] hover:brightness-110 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {loading ? 'ရှာဖွေနေပါသည်...' : 'ရှာဖွေမည် ⚡'}
              </button>
            </div>

            {/* Quick Sample Questions */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-neutral-400">နမူနာရှာရန်:</span>
              {SAMPLE_QUERIES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setQuery(sample);
                    handleSearch(sample);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-amber-500/20 text-amber-400/80 hover:text-amber-200 hover:border-amber-400/50 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </form>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <div className="font-mono text-xs text-amber-300">
                Google Search မှ နောက်ဆုံးရ စျေးကွက်အချက်အလက်များကို ရှာဖွေတွက်ချက်နေပါသည်...
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          {/* Search Result */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Quota Exceeded / Fallback Notice Banner */}
              {result.quotaExceeded && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">💡</span>
                    <span>
                      Gemini API Rate Limit Quota အချိန်ကာလအရ ဆိုင်တွင်း စျေးကွက်ဒေတာဘေ့စ်မှ စျေးနှုန်းများကို တိုက်ရိုက်ဖော်ပြပေးထားပါသည်။
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold shrink-0">
                    Offline Database
                  </span>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-[#12141c] border border-amber-500/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
                    <span>💡</span>
                    <span>AI စျေးကွက်သုံးသပ်ချက် (Market Insights)</span>
                  </span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/30">
                    {result.isFallback ? 'Retail Market Guide' : 'Live Web Grounded'}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-myanmar whitespace-pre-wrap">
                  {result.answer}
                </div>

                {/* Quick Add Button if suggestedPrice exists */}
                {onQuickAddItem && result.suggestedPrice && (
                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400/80">
                      အကြံပြုစျေးနှုန်း: {result.suggestedPrice.toLocaleString()} ကျပ်
                    </span>
                    <button
                      onClick={() => onQuickAddItem(result.query, result.suggestedPrice || 25000)}
                      className="btn-gold-ripple px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs cursor-pointer shadow-sm"
                    >
                      + ပစ္စည်းစာရင်းသို့ ချက်ချင်းထည့်မည်
                    </button>
                  </div>
                )}
              </div>

              {/* Web Sources & Citations */}
              {result.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-amber-400/80 uppercase font-semibold flex items-center gap-1">
                    <span>🌐</span>
                    <span>ကိုးကားထားသော သတင်းအရင်းအမြစ်များ:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-lg bg-[#141624] border border-amber-500/20 hover:border-amber-400 hover:text-amber-200 text-xs text-amber-300/80 truncate block transition-colors font-mono"
                      >
                        🔗 {src.title || src.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-black/80 flex items-center justify-between text-xs font-mono text-amber-500/70">
          <span>MODEL: GEMINI-3.8-FLASH · GOOGLE SEARCH GROUNDING</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-200 rounded-lg cursor-pointer"
          >
            ပိတ်မည် (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
