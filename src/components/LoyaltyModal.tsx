import React from 'react';
import { LoyaltyMember } from '../types';
import { TranslationDictionary } from '../data/translations';
import { soundFX } from '../utils/audio';

interface LoyaltyModalProps {
  onClose: () => void;
  onSelectLoyalty: (member: LoyaltyMember | null) => void;
  activeLoyalty: LoyaltyMember | null;
  availableLoyaltyMembers: LoyaltyMember[];
  t: TranslationDictionary;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  onClose,
  onSelectLoyalty,
  activeLoyalty,
  availableLoyaltyMembers,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#10121a] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(245,183,0,0.3)]">
        <h3 className="font-orbitron font-bold text-amber-200 text-base mb-1">
          {t.loyaltyRegistryTitle}
        </h3>
        <p className="text-xs text-amber-500/70 font-mono mb-4">
          {t.loyaltySelectSubtitle}
        </p>

        <div className="space-y-2 mb-5 max-h-72 overflow-y-auto pr-1">
          {availableLoyaltyMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => {
                soundFX.playScanBeep();
                onSelectLoyalty(member);
                onClose();
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                activeLoyalty?.id === member.id
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,183,0,0.25)]'
                  : 'bg-neutral-900/70 border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-500/5'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-100 text-sm">{member.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/30">
                    {member.tier}
                  </span>
                </div>
                <div className="text-xs text-amber-500/70 font-mono mt-0.5">
                  Card ID: {member.id} · Points: {member.points.toLocaleString()} pts
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-300">
                  -{(member.discountRate * 100).toFixed(0)}% VIP
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          {activeLoyalty && (
            <button
              onClick={() => {
                soundFX.playClick();
                onSelectLoyalty(null);
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              {t.detachMember}
            </button>
          )}
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="ml-auto px-4 py-2 text-xs bg-neutral-800 text-amber-200 rounded-lg hover:bg-neutral-700 cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
