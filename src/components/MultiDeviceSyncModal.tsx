import React, { useState, useEffect, useRef } from 'react';
import { Product, CompletedSale } from '../types';
import {
  DeviceInfo,
  MultiCloudHealth,
  updateProductStockInCloud,
  fetchMultiCloudHealth,
  buildStoreBackupJson,
  restoreStoreBackup,
  normalizeStoreId,
} from '../services/posSyncService';
import { soundFX } from '../utils/audio';
import { TranslationDictionary } from '../data/translations';

interface MultiDeviceSyncModalProps {
  onClose: () => void;
  devices: DeviceInfo[];
  currentDeviceId: string;
  currentStoreId: string;
  onChangeStoreId: (newStoreId: string) => void;
  isStorePrivate: boolean;
  onToggleStorePrivacy: (isPrivate: boolean) => Promise<void>;
  isUserSignedIn: boolean;
  currentRegisterId: string;
  currentCashierName: string;
  onUpdateDeviceSettings: (registerId: string, cashierName: string) => void;
  products: Product[];
  sales: CompletedSale[];
  onOpenManualEntry: () => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  onFlushPendingSales?: () => Promise<void>;
  ownerUid?: string;
  t: TranslationDictionary;
}

const CASHIER_PRESETS = [
  'မသီတာ (Cashier 1)',
  'ကိုကျော် (Cashier 2)',
  'မဆုမွန် (Cashier 3)',
  'ဒေါ်ခင် (Store Manager)',
  'ကိုဇော် (Admin)',
];

const REGISTER_PRESETS = [
  'Counter 01 (ဆိုင်ရှေ့ကောင်တာ)',
  'Counter 02 (ကောင်တာ ၂)',
  'Mobile-01 (မိုဘိုင်းဖုန်းစက်)',
  'Tablet-POS (တက်ဘလက်စက်)',
];

export const MultiDeviceSyncModal: React.FC<MultiDeviceSyncModalProps> = ({
  onClose,
  devices,
  currentDeviceId,
  currentStoreId,
  onChangeStoreId,
  isStorePrivate,
  onToggleStorePrivacy,
  isUserSignedIn,
  currentRegisterId,
  currentCashierName,
  onUpdateDeviceSettings,
  products,
  sales,
  onOpenManualEntry,
  isOnline = true,
  pendingSyncCount = 0,
  onFlushPendingSales,
  ownerUid = '',
  t: _t,
}) => {
  const [activeTab, setActiveTab] = useState<'network' | 'multicloud' | 'stock'>('network');
  const [regIdInput, setRegIdInput] = useState(currentRegisterId);
  const [cashierInput, setCashierInput] = useState(currentCashierName);
  const [storeIdInput, setStoreIdInput] = useState(currentStoreId);
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockValueInput, setStockValueInput] = useState<number>(0);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [health, setHealth] = useState<MultiCloudHealth | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchMultiCloudHealth().then((h) => {
      if (h) setHealth(h);
    });
  }, []);

  const showToast = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSaveDeviceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playGoldChime();
    onUpdateDeviceSettings(regIdInput.trim() || 'REG-01', cashierInput.trim() || 'Cashier');
    showToast('✓ ငွေကိုင်နှင့် စက်အချက်အလက်ကို ပြင်ဆင်ပြီးပါပြီ။');
  };

  const handleSwitchStore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeStoreId(storeIdInput);
    setStoreIdInput(cleaned);
    soundFX.playGoldChime();
    onChangeStoreId(cleaned);
    showToast(`✓ Shop Sync Code "${cleaned}" သို့ ချိတ်ဆက်ပြောင်းလဲပြီးပါပြီ။`);
  };

  const handleCopyStoreCode = async () => {
    try {
      await navigator.clipboard.writeText(currentStoreId);
      soundFX.playClick();
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore clipboard restriction
    }
  };

  const handleExportBackup = () => {
    soundFX.playGoldChime();
    const json = buildStoreBackupJson(currentStoreId, products, sales);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kks-pos-${currentStoreId}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Multi-Cloud Backup ဖိုင် ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ။');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await restoreStoreBackup(text, currentStoreId, ownerUid);
      soundFX.playGoldChime();
      setImportStatus(`✓ ပစ္စည်း ${res.productsImported} မျိုးကို Cloud Bases အားလုံးသို့ ပြန်သွင်းပြီးပါပြီ။`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(`✕ ဖိုင်ဖတ်မရပါ: ${err?.message || 'Invalid backup JSON'}`);
    }
    e.target.value = '';
  };

  const handleSelectCashierPreset = (preset: string) => {
    soundFX.playClick();
    setCashierInput(preset);
    onUpdateDeviceSettings(regIdInput.trim() || 'REG-01', preset);
    showToast('✓ ငွေကိုင်အမည် ပြောင်းလဲပြီးပါပြီ။');
  };

  const handleSelectRegisterPreset = (preset: string) => {
    soundFX.playClick();
    setRegIdInput(preset);
    onUpdateDeviceSettings(preset, cashierInput.trim() || 'Cashier');
    showToast('✓ ကောင်တာအမည် ပြောင်းလဲပြီးပါပြီ။');
  };

  const handleSaveStockUpdate = async (productId: string) => {
    soundFX.playClick();
    await updateProductStockInCloud(productId, stockValueInput, currentStoreId);
    setStockEditId(null);
  };

  const handleSyncNow = async () => {
    if (!onFlushPendingSales) return;
    setIsSyncing(true);
    soundFX.playClick();
    try {
      await onFlushPendingSales();
      soundFX.playGoldChime();
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlDriverLabel =
    health?.databases.sql.driver === 'cloud-sql'
      ? 'Google Cloud SQL (PostgreSQL)'
      : health?.databases.sql.driver === 'postgres-url'
      ? 'External PostgreSQL (Neon / Supabase / RDS)'
      : 'Portable Local JSON Base (Zero-Config)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0c12] border-2 border-amber-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(245,183,0,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/25 bg-gradient-to-r from-amber-950/40 via-black to-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(245,183,0,0.4)] border border-amber-300/40 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-orbitron font-bold text-base sm:text-lg text-amber-200">
                  Multi-User & Multi-Cloud POS Hub
                </h2>
                {isOnline ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE SYNC
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    OFFLINE MODE
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-500/80 font-mono mt-0.5">
                Shop Sync Code: <strong className="text-amber-300">{currentStoreId}</strong> · ဖုန်း/ကွန်ပျူတာများကို တစ်ပြိုင်နက် ချိတ်ဆက်သုံးစွဲနိုင်သည်
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pending Offline Sales Sync Banner */}
        {pendingSyncCount > 0 && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-200 font-mono">
              <span className="text-amber-400 text-sm">⚠️</span>
              <span>
                အော့ဖ်လိုင်း အရောင်းမှတ်တမ်း <strong className="text-amber-300">{pendingSyncCount} ခု</strong> သိမ်းဆည်းထားပါသည်။
              </span>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="btn-gold-ripple px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-bold font-mono cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? 'Sync လုပ်နေပါသည်...' : 'Cloud သို့ Sync လုပ်မည်'}
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-amber-500/20 bg-[#10121a] px-5 pt-3 gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('network')}
            className={`pb-3 text-xs font-orbitron font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'network'
                ? 'border-amber-400 text-amber-300 shadow-[0_2px_10px_rgba(245,183,0,0.3)]'
                : 'border-transparent text-amber-500/60 hover:text-amber-400'
            }`}
          >
            ငွေကိုင်နှင့် စက်များ ({Math.max(1, devices.length)})
          </button>
          <button
            onClick={() => setActiveTab('multicloud')}
            className={`pb-3 text-xs font-orbitron font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'multicloud'
                ? 'border-amber-400 text-amber-300 shadow-[0_2px_10px_rgba(245,183,0,0.3)]'
                : 'border-transparent text-amber-500/60 hover:text-amber-400'
            }`}
          >
            Multi-Cloud & Backup
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-3 text-xs font-orbitron font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stock'
                ? 'border-amber-400 text-amber-300 shadow-[0_2px_10px_rgba(245,183,0,0.3)]'
                : 'border-transparent text-amber-500/60 hover:text-amber-400'
            }`}
          >
            ဘုံသုံး ပစ္စည်းလက်ကျန် ({products.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {savedNotice && (
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono text-center">
              {savedNotice}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6">
              {/* Shop Workspace Pairing Card */}
              <div className="bg-gradient-to-r from-[#131522] to-[#0f1119] border border-amber-500/35 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/15 mb-4">
                  <div>
                    <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-200">
                      ဆိုင်ခွဲ / Multi-Device ချိတ်ဆက်ကုဒ် (Shop Sync Workspace)
                    </h3>
                    <p className="text-[11px] font-mono text-amber-500/75 mt-0.5">
                      ဆိုင်တစ်ဆိုင်တည်းရှိ ဖုန်း/ကွန်ပျူတာ အားလုံးတွင် ဤကုဒ်တူညီပါက စာရင်းအားလုံး သီးသန့်လုံခြုံစွာ တပြိုင်နက် sync ဖြစ်ပါမည်။
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyStoreCode}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 hover:bg-amber-500/25 text-[11px] font-mono font-bold cursor-pointer self-start"
                  >
                    {copiedCode ? '✓ ကူးယူပြီး' : `Copy: ${currentStoreId}`}
                  </button>
                </div>

                <form onSubmit={handleSwitchStore} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={storeIdInput}
                    onChange={(e) => setStoreIdInput(e.target.value)}
                    placeholder="ဥပမာ - SHOP-YGN01"
                    className="flex-1 bg-black/60 border border-amber-500/35 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="btn-gold-ripple px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    ဆိုင်ကုဒ်ဖြင့် ချိတ်ဆက်မည်
                  </button>
                  {isUserSignedIn && (
                    <button
                      type="button"
                      onClick={() => onToggleStorePrivacy(!isStorePrivate)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer whitespace-nowrap transition-colors ${
                        isStorePrivate
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-neutral-900 border-amber-500/25 text-amber-300/80 hover:border-amber-400'
                      }`}
                      title="Only your Google Account can read/write when locked"
                    >
                      {isStorePrivate ? '🔒 Private Lock ON' : '🔓 Shared Shop Mode'}
                    </button>
                  )}
                </form>
              </div>

              {/* Current Device Configuration Card */}
              <div className="bg-[#12141f] border border-amber-500/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/15 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                    <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-200">
                      လက်ရှိ စက်နှင့် ငွေကိုင် အချက်အလက် (Current Terminal Profile)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500/70 bg-black/50 px-2 py-0.5 rounded border border-amber-500/20">
                    DEVICE ID: {currentDeviceId}
                  </span>
                </div>

                <form onSubmit={handleSaveDeviceSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-amber-400 mb-1 font-semibold">
                        ကောင်တာ / စက် အမည် (Register / Terminal ID)
                      </label>
                      <input
                        type="text"
                        value={regIdInput}
                        onChange={(e) => setRegIdInput(e.target.value)}
                        placeholder="ဥပမာ - Counter 01 (ဆိုင်ရှေ့)"
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className="text-[10px] text-neutral-400 font-mono">အမြန်ရွေးရန်:</span>
                        {REGISTER_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleSelectRegisterPreset(p)}
                            className={`px-2 py-0.5 text-[10px] rounded border font-mono transition-colors cursor-pointer ${
                              regIdInput === p
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                : 'bg-neutral-900 border-amber-500/20 text-neutral-400 hover:text-amber-200'
                            }`}
                          >
                            {p.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-amber-400 mb-1 font-semibold">
                        ငွေကိုင် / အသုံးပြုသူ အမည် (Cashier Staff Name)
                      </label>
                      <input
                        type="text"
                        value={cashierInput}
                        onChange={(e) => setCashierInput(e.target.value)}
                        placeholder="ဥပမာ - မသီတာ၊ ကိုကျော်..."
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className="text-[10px] text-neutral-400 font-mono">ငွေကိုင်များ:</span>
                        {CASHIER_PRESETS.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleSelectCashierPreset(name)}
                            className={`px-2 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                              cashierInput === name
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                : 'bg-neutral-900 border-amber-500/20 text-neutral-400 hover:text-amber-200'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
                    <span className="text-xs text-amber-500/70 font-mono">
                      ငွေကိုင်အမည် ပြောင်းလဲမှုသည် ထုတ်ဝေမည့် ဘောက်ချာနှင့် စာရင်းများတွင် ချက်ချင်း အတည်ဖြစ်ပါမည်။
                    </span>
                    <button
                      type="submit"
                      className="btn-gold-ripple px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs shadow-[0_0_15px_rgba(245,183,0,0.3)] hover:brightness-110 cursor-pointer"
                    >
                      အတည်ပြု သိမ်းဆည်းမည်
                    </button>
                  </div>
                </form>
              </div>

              {/* Connected Registers List */}
              <div className="space-y-3">
                <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>လက်ရှိ ချိတ်ဆက်ထားသော စက်များ ({currentStoreId})</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ● {Math.max(1, devices.length)} စက် အသုံးပြုနေသည်
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {devices.length === 0 ? (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-[#12141c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300">
                          💻
                        </div>
                        <div>
                          <div className="font-orbitron font-bold text-xs text-amber-200">
                            {currentRegisterId}
                          </div>
                          <div className="text-xs text-amber-400/80 font-mono mt-0.5">
                            ငွေကိုင်: {currentCashierName}
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-mono text-[9px] font-bold">
                        THIS DEVICE
                      </span>
                    </div>
                  ) : (
                    devices.map((dev) => {
                      const isSelf = dev.deviceId === currentDeviceId;
                      return (
                        <div
                          key={dev.deviceId}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            isSelf
                              ? 'bg-amber-950/25 border-amber-400 shadow-[0_0_15px_rgba(245,183,0,0.2)]'
                              : 'bg-[#12141c] border-amber-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-orbitron font-bold text-xs text-amber-200">
                                  {dev.registerId}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black font-mono text-[9px] font-bold">
                                    THIS DEVICE
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-amber-400/80 font-mono mt-0.5">
                                ငွေကိုင်: {dev.cashierName} · {dev.deviceName}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#10b981]" />
                            <div className="text-[10px] font-mono text-neutral-500 mt-1">အသုံးပြုနေဆဲ</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'multicloud' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Base 1: Cloud Firestore */}
                <div className="p-4 rounded-2xl bg-[#12141f] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-orbitron font-bold text-amber-300 uppercase">
                      Cloud Base 1
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      health?.databases.firestore.configured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {health?.databases.firestore.configured ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-amber-100">Firebase Firestore Real-Time</div>
                  <p className="text-[11px] font-mono text-amber-500/75">
                    Real-time WebSocket sync across phones, tablets, and desktops inside workspace {currentStoreId}.
                  </p>
                </div>

                {/* Base 2: PostgreSQL / Cloud SQL / Neon / Supabase */}
                <div className="p-4 rounded-2xl bg-[#12141f] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-orbitron font-bold text-amber-300 uppercase">
                      Cloud Base 2
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      health?.databases.sql.connected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {health?.databases.sql.connected
                        ? `READY${health.databases.sql.latencyMs !== undefined ? ` (${health.databases.sql.latencyMs}ms)` : ''}`
                        : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-amber-100">{sqlDriverLabel}</div>
                  <p className="text-[11px] font-mono text-amber-500/75">
                    ACID relational ledger supporting Google Cloud SQL, Neon, Supabase, AWS RDS, or local fallback.
                  </p>
                </div>

                {/* Base 3: Local Edge Cache & PWA */}
                <div className="p-4 rounded-2xl bg-[#12141f] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-orbitron font-bold text-amber-300 uppercase">
                      Edge Base 3
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ALWAYS ON
                    </span>
                  </div>
                  <div className="text-sm font-bold text-amber-100">Offline Local & PWA Engine</div>
                  <p className="text-[11px] font-mono text-amber-500/75">
                    Zero-downtime offline checkout queue ({pendingSyncCount} pending) that auto-syncs on reconnect.
                  </p>
                </div>
              </div>

              {/* Portable Cross-Cloud Backup & Restore */}
              <div className="p-5 rounded-2xl bg-[#12141f] border border-amber-500/35 space-y-4">
                <div>
                  <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-200">
                    Portable Multi-Cloud Backup & Migration (Data Portability)
                  </h3>
                  <p className="text-xs text-amber-500/80 font-mono mt-1">
                    သင့်ဆိုင်၏ ပစ္စည်းစာရင်းနှင့် အရောင်းမှတ်တမ်းများကို JSON ဖိုင်အဖြစ် အခမဲ့ Backup သိမ်းဆည်းနိုင်ပြီး အခြား Cloud/Server သို့ လွယ်ကူစွာ ပြောင်းရွှေ့တင်သွင်းနိုင်ပါသည်။
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="btn-gold-ripple px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs cursor-pointer"
                  >
                    ⬇ Store Backup ဒေါင်းလုဒ်ဆွဲမည် (.JSON)
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-neutral-900 border border-amber-500/35 text-amber-200 hover:border-amber-400 text-xs font-mono font-bold cursor-pointer"
                  >
                    ⬆ Backup ဖိုင်မှ ပြန်သွင်းမည် (Restore to All Bases)
                  </button>
                </div>

                {importStatus && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs font-mono text-amber-200">
                    {importStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            /* Shared Stock Management Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-200">
                    ဘုံသုံး ပစ္စည်းလက်ကျန် စာရင်း (Shared Real-Time Inventory)
                  </h3>
                  <p className="text-xs text-amber-500/70 font-mono">
                    ဤနေရာတွင် ပြင်ဆင်ချက်များသည် စက်အားလုံးတွင် ချက်ချင်း တပြိုင်နက် သက်ရောက်ပါမည်။
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenManualEntry();
                  }}
                  className="btn-gold-ripple px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,183,0,0.3)] hover:brightness-110 cursor-pointer"
                >
                  + ပစ္စည်းအသစ် ထည့်မည်
                </button>
              </div>

              <div className="border border-amber-500/25 rounded-2xl overflow-x-auto bg-[#10121a]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-amber-400/80 font-mono border-b border-amber-500/20">
                    <tr>
                      <th className="py-2.5 px-3">ပစ္စည်းအမည်နှင့် အမျိုးအစား</th>
                      <th className="py-2.5 px-3">ဘားကုဒ် / Barcode</th>
                      <th className="py-2.5 px-3">စျေးနှုန်း</th>
                      <th className="py-2.5 px-3">လက်ကျန် အရေအတွက်</th>
                      <th className="py-2.5 px-3 text-right">အမြန် တိုးရန်</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10 font-mono">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg object-cover border border-amber-500/40 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs shrink-0">
                                📦
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-amber-200">{p.name}</div>
                              <div className="text-[10px] text-amber-500/60">{p.category} · {p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-amber-300/80 text-[11px]">
                          {p.barcode}
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-300">
                          {p.price.toLocaleString()} Ks
                        </td>
                        <td className="py-3 px-3">
                          {stockEditId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={stockValueInput}
                                onChange={(e) => setStockValueInput(parseInt(e.target.value) || 0)}
                                className="w-16 bg-black border border-amber-400 rounded px-2 py-1 text-xs text-amber-200"
                              />
                              <button
                                onClick={() => handleSaveStockUpdate(p.id)}
                                className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[10px] cursor-pointer"
                              >
                                သိမ်းမည်
                              </button>
                              <button
                                onClick={() => setStockEditId(null)}
                                className="px-2 py-1 rounded bg-neutral-800 text-neutral-400 text-[10px] cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => {
                                setStockEditId(p.id);
                                setStockValueInput(p.stock);
                              }}
                              className={`px-2 py-0.5 rounded cursor-pointer border ${
                                p.stock <= 2
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:border-amber-400'
                              }`}
                              title="Click to edit stock level"
                            >
                              {p.stock} ခု ✎
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex gap-1">
                            {[+5, +10, +25].map((delta) => (
                              <button
                                key={delta}
                                onClick={async () => {
                                  soundFX.playClick();
                                  await updateProductStockInCloud(
                                    p.id,
                                    Math.max(0, p.stock + delta),
                                    currentStoreId
                                  );
                                }}
                                className="px-2 py-0.5 bg-neutral-900 hover:bg-amber-500/20 text-amber-400/80 hover:text-amber-200 border border-amber-500/20 rounded text-[10px] cursor-pointer"
                              >
                                +{delta}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-black/80 flex items-center justify-between text-xs font-mono text-amber-500/70">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>
              {isOnline
                ? `MULTI-CLOUD READY · FIRESTORE + ${health?.databases.sql.driver?.toUpperCase() || 'SQL'} · ${currentStoreId}`
                : 'OFFLINE MODE: LOCAL STORAGE ACTIVE · AUTO SYNC ON RECONNECT'}
            </span>
          </div>
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
