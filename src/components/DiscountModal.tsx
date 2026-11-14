import React, { useState } from 'react';
import { TranslationDictionary } from '../data/translations';
import { soundFX } from '../utils/audio';

interface DiscountModalProps {
  onClose: () => void;
  onApplyDiscount: (percent: number) => void;
  currentDiscount: number;
  t: TranslationDictionary;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  onClose,
  onApplyDiscount,
  currentDiscount,
  t,
}) => {
  const [customDiscountInput, setCustomDiscountInput] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#10121a] border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(245,183,0,0.3)]">
        <h3 className="font-orbitron font-bold text-amber-200 text-base mb-1">
          {t.applyPromoTitle}
        </h3>
        <p className="text-xs text-amber-500/70 font-mono mb-4">
          {t.applyPromoDesc}
        </p>

        {/* Preset Percentage Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[5, 10, 15, 20].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                soundFX.playClick();
                onApplyDiscount(pct);
                onClose();
              }}
              className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                currentDiscount === pct
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-neutral-900 border-amber-500/30 text-amber-300 hover:border-amber-400'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Custom Discount Input */}
        <div className="flex items-center gap-2 mb-5">
          <input
            type="number"
            placeholder={t.customPercentPlaceholder}
            min="0"
            max="50"
            value={customDiscountInput}
            onChange={(e) => setCustomDiscountInput(e.target.value)}
            className="w-full bg-[#181b26] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
          />
          <button
            onClick={() => {
              const val = parseFloat(customDiscountInput);
              if (!isNaN(val) && val >= 0 && val <= 50) {
                soundFX.playClick();
                onApplyDiscount(val);
                onClose();
              }
            }}
            className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 whitespace-nowrap cursor-pointer"
          >
            {t.apply}
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {currentDiscount > 0 && (
            <button
              onClick={() => {
                soundFX.playClick();
                onApplyDiscount(0);
                onClose();
              }}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              {t.removeDiscount}
            </button>
          )}
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="px-3 py-1.5 text-xs bg-neutral-800 text-amber-200 rounded-lg hover:bg-neutral-700 cursor-pointer"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
