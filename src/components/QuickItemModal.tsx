import React, { useState } from 'react';
import { Product } from '../types';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';
import { CurrencyMode, formatPrice } from '../utils/formatters';

interface QuickItemModalProps {
  onAddQuickProduct: (product: Product) => void;
  onClose: () => void;
  currency: CurrencyMode;
  t: TranslationDictionary;
}

export const QuickItemModal: React.FC<QuickItemModalProps> = ({
  onAddQuickProduct,
  onClose,
  currency,
  t,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('အထွေထွေ (General)');

  const quickPresets = [
    { label: '500 Ks', val: 500 },
    { label: '1,000 Ks', val: 1000 },
    { label: '2,000 Ks', val: 2000 },
    { label: '5,000 Ks', val: 5000 },
    { label: '10,000 Ks', val: 10000 },
    { label: '20,000 Ks', val: 20000 },
    { label: '35,000 Ks', val: 35000 },
    { label: '50,000 Ks', val: 50000 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      soundFX.playWarning();
      return;
    }

    const quickProduct: Product = {
      id: `quick-${Date.now()}`,
      sku: `QCK-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim() || 'အမြန်ရောင်း ပစ္စည်း (Quick Item)',
      category,
      price: numPrice,
      stock: 999,
      barcode: `QCK${Date.now().toString().slice(-8)}`,
      badge: 'Quick Sale',
      purity: 'Standard',
      description: 'Quick custom sale item added at register.',
    };

    soundFX.playScanBeep();
    onAddQuickProduct(quickProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#10121a] border-2 border-amber-500/40 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(245,183,0,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/25 bg-gradient-to-r from-[#181a26] to-[#0c0e15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm sm:text-base text-amber-200 uppercase">
                အမြန်ရောင်း / စိတ်ကြိုက်ပစ္စည်း
              </h3>
              <p className="text-[11px] text-amber-400/70 font-mono">
                Quick Custom Item Sale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-amber-300/90 mb-1.5">
              ပစ္စည်းအမည် (Item Name)
            </label>
            <input
              type="text"
              placeholder="ဥပမာ - ပါတိတ် အပိုစ၊ အထည်ချုပ်ခ၊ အအေး..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-amber-300/90">
                ရောင်းဈေး (Sale Price)
              </label>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {price ? formatPrice(parseFloat(price) || 0, currency) : ''}
              </span>
            </div>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="5000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#181a24] border border-amber-500/40 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick Price Buttons */}
          <div>
            <span className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider block mb-1.5">
              အမြန်ရွေးချယ်ရန် ဈေးနှုန်းများ (Quick Presets):
            </span>
            <div className="grid grid-cols-4 gap-2">
              {quickPresets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setPrice(p.val.toString());
                  }}
                  className="px-2 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 text-xs font-mono font-medium transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-amber-300/90 mb-1.5">
              အမျိုးအစား (Category)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#181a24] border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
            >
              <option value="ပါတိတ် / အထည် (Batik & Apparel)">ပါတိတ် / အထည် (Batik & Apparel)</option>
              <option value="လူသုံးကုန် (General Goods)">လူသုံးကုန် (General Goods)</option>
              <option value="စားသောက်ကုန် (Food & Beverage)">စားသောက်ကုန် (Food & Beverage)</option>
              <option value="အအေး / သောက်ရေ (Beverages)">အအေး / သောက်ရေ (Beverages)</option>
              <option value="အထွေထွေ (General)">အထွေထွေ (General)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn-gold-ripple px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-orbitron font-bold text-xs uppercase shadow-[0_0_15px_rgba(245,183,0,0.3)] hover:brightness-110 cursor-pointer"
            >
              + ဘောင်ချာထဲသို့ ထည့်ရန် (Add to Bill)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
