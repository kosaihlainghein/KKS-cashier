import React, { useState, useEffect } from 'react';
import { Product, CartItem, LoyaltyMember, CompletedSale, DailyStats } from './types';
import { INITIAL_PRODUCTS, MOCK_LOYALTY_MEMBERS, INITIAL_DAILY_STATS } from './data/mockData';
import { soundFX } from './utils/audio';
import { Language, translations } from './data/translations';

import { TopBar } from './components/TopBar';
import { HoloScanner } from './components/HoloScanner';
import { ItemListPanel } from './components/ItemListPanel';
import { OrderSummary } from './components/OrderSummary';
import { SimplifiedPOSView } from './components/SimplifiedPOSView';
import { UsageGuideModal } from './components/UsageGuideModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { DiscountModal } from './components/DiscountModal';
import { LoyaltyModal } from './components/LoyaltyModal';
import { DailyStatsDrawer } from './components/DailyStatsDrawer';
import { AnalyticsModal } from './components/AnalyticsModal';
import { InventoryModal } from './components/InventoryModal';
import { LiveCameraScannerModal } from './components/LiveCameraScannerModal';
import { MultiDeviceSyncModal } from './components/MultiDeviceSyncModal';
import { MarketSearchModal } from './components/MarketSearchModal';
import { auth, googleAuthProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

import { QuickItemModal } from './components/QuickItemModal';
import { CurrencyMode } from './utils/formatters';

import {
  getOrCreateDeviceId,
  getOrCreateStoreId,
  setActiveStoreId,
  getStorePrivateFlag,
  updateStoreWorkspaceSettings,
  fetchStoreWorkspaceSettings,
  clearAllProductsFromCloud,
  loadSampleProductsToCloud,
  subscribeToProducts,
  subscribeToRecentSales,
  recordCloudSale,
  saveProductToCloud,
  deleteProductFromCloud,
  updateProductStockInCloud,
  pingDevicePresence,
  subscribeToActiveDevices,
  subscribeToNetworkStatus,
  flushPendingSales,
  isDeviceOnline,
  DeviceInfo,
} from './services/posSyncService';

export default function App() {
  // Bilingual Language State ('my' by default or toggleable)
  const [language, setLanguage] = useState<Language>('my');
  const t = translations[language];

  // Currency State ('MMK' by default, or 'USD')
  const [currency, setCurrency] = useState<CurrencyMode>('MMK');

  // UI Mode: Expert 'pro' mode vs Beginner 'simplified' mode
  const [uiMode, setUiMode] = useState<'pro' | 'simplified'>('pro');

  // Multi-Device & Shop Workspace Settings (persisted per device)
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [storeId, setStoreId] = useState<string>(() => getOrCreateStoreId());
  const [isStorePrivate, setIsStorePrivate] = useState<boolean>(() =>
    getStorePrivateFlag(getOrCreateStoreId())
  );
  const [registerId, setRegisterId] = useState<string>(
    () => localStorage.getItem('kks_register_id') || 'REG-01 · Main Store'
  );
  const [cashierName, setCashierName] = useState<string>(
    () => localStorage.getItem('kks_cashier_name') || 'Cashier Staff'
  );
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(() => isDeviceOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Usage Guide Panel State
  const [showUsageGuide, setShowUsageGuide] = useState<boolean>(false);
  const [guideActiveStep, setGuideActiveStep] = useState<number>(1);

  // Navigation / View State
  const [currentView, setCurrentView] = useState<'pos' | 'analytics' | 'inventory'>('pos');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Products & Shared Stock State (Connected to real-time Cloud Firestore)
  // Starts with clean empty state: only displays products the user inputs
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [activeLoyalty, setActiveLoyalty] = useState<LoyaltyMember | null>(null);
  const [taxRate] = useState<number>(0.05); // Standard 5% commercial tax

  // Modals
  const [showLiveCameraScanner, setShowLiveCameraScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState<string | undefined>(undefined);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showMultiDeviceModal, setShowMultiDeviceModal] = useState(false);
  const [showQuickItemModal, setShowQuickItemModal] = useState(false);
  const [showMarketSearchModal, setShowMarketSearchModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync Firebase Auth with PostgreSQL / Multi-Base User records
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              displayName: user.displayName || user.email,
              storeId,
            }),
          });
        } catch (e) {
          console.warn('Failed to sync user with SQL Multi-Base:', e);
        }
      }
    });
    return () => unsubAuth();
  }, [storeId]);

  // Stats & Sales Log (Initialized clean at 0, computed from live Firestore records)
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalSales: 0,
    itemsSold: 0,
    transactionsCount: 0,
    topProduct: { name: 'မှတ်တမ်းမရှိသေးပါ', units: 0, revenue: 0 },
    hourlySales: [],
    categoryBreakdown: [],
  });
  const [recentSales, setRecentSales] = useState<CompletedSale[]>([]);

  // Keep HTML document lang attribute in sync
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Global Keyboard shortcuts ([F1] opens usage guide)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        soundFX.playClick();
        setShowUsageGuide(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-Device Real-Time Cloud Firestore + SQL Sync Setup (Store-Scoped)
  useEffect(() => {
    const activeOwnerUid = isStorePrivate && currentUser ? currentUser.uid : '';

    fetchStoreWorkspaceSettings(storeId).then((meta) => {
      if (meta) {
        setIsStorePrivate(Boolean(meta.isPrivate));
      }
    });

    // 1. Real-time shared stock subscription across all devices in this store
    const unsubProducts = subscribeToProducts((cloudProds) => {
      setProducts(cloudProds);
      setIsCloudSynced(true);
    }, storeId);

    // 2. Real-time shared sales ledger across all devices in this store
    const unsubSales = subscribeToRecentSales((cloudSales) => {
      setRecentSales(cloudSales);
      const totalRev = cloudSales.reduce((acc, s) => acc + s.total, 0);
      const itemsCount = cloudSales.reduce(
        (acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0),
        0
      );

      const productCounts: Record<string, { name: string; units: number; revenue: number }> = {};
      cloudSales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (!productCounts[item.product.id]) {
            productCounts[item.product.id] = { name: item.product.name, units: 0, revenue: 0 };
          }
          productCounts[item.product.id].units += item.quantity;
          productCounts[item.product.id].revenue += item.quantity * item.product.price;
        });
      });
      const topProd = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue)[0] || {
        name: 'မှတ်တမ်းမရှိသေးပါ',
        units: 0,
        revenue: 0,
      };

      setDailyStats({
        totalSales: totalRev,
        itemsSold: itemsCount,
        transactionsCount: cloudSales.length,
        topProduct: topProd,
        hourlySales: [],
        categoryBreakdown: [],
      });
    }, storeId);

    // 3. Multi-device presence ping & subscription
    const currentDevice: DeviceInfo = {
      deviceId,
      storeId,
      deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Terminal' : 'Desktop Station',
      registerId,
      cashierName,
      platform: navigator.platform || 'Web',
      lastActive: new Date().toISOString(),
    };
    pingDevicePresence(currentDevice, storeId);
    const pingInterval = setInterval(() => {
      pingDevicePresence(currentDevice, storeId);
    }, 60000);

    const unsubDevices = subscribeToActiveDevices((devices) => {
      setActiveDevices(devices);
    }, storeId);

    const unsubNet = subscribeToNetworkStatus(({ isOnline: online, pendingCount }) => {
      setIsOnline(online);
      setPendingSyncCount(pendingCount);
      if (online && pendingCount > 0) {
        flushPendingSales(storeId, activeOwnerUid);
      }
    }, storeId);

    return () => {
      unsubProducts();
      unsubSales();
      unsubDevices();
      unsubNet();
      clearInterval(pingInterval);
    };
  }, [deviceId, storeId, registerId, cashierName, isStorePrivate, currentUser]);

  // Update Station Settings
  const handleUpdateDeviceSettings = (newRegId: string, newCashier: string) => {
    setRegisterId(newRegId);
    setCashierName(newCashier);
    localStorage.setItem('kks_register_id', newRegId);
    localStorage.setItem('kks_cashier_name', newCashier);

    pingDevicePresence(
      {
        deviceId,
        storeId,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Terminal' : 'Desktop Station',
        registerId: newRegId,
        cashierName: newCashier,
        platform: navigator.platform || 'Web',
        lastActive: new Date().toISOString(),
      },
      storeId
    );
  };

  // Switch active Shop Sync Code (Workspace Tenancy)
  const handleChangeStoreId = (newStoreId: string) => {
    const normalized = setActiveStoreId(newStoreId);
    setCart([]);
    setStoreId(normalized);
  };

  // Toggle Private Owner Lock for Shop Workspace
  const handleToggleStorePrivacy = async (makePrivate: boolean) => {
    if (makePrivate && !currentUser) return;
    setIsStorePrivate(makePrivate);
    await updateStoreWorkspaceSettings(
      storeId,
      registerId,
      makePrivate,
      makePrivate && currentUser ? currentUser.uid : ''
    );
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    soundFX.enabled = !nextState;
    if (!nextState) {
      soundFX.playGoldChime();
    }
  };

  // Language Toggle Handler (one-click toggle between English and Myanmar)
  const handleToggleLanguage = () => {
    soundFX.playClick();
    setLanguage((prev) => (prev === 'en' ? 'my' : 'en'));
  };

  // UI Mode Toggle (Expert Pro <-> Beginner Simplified)
  const handleToggleMode = () => {
    soundFX.playClick();
    setUiMode((prev) => (prev === 'pro' ? 'simplified' : 'pro'));
  };

  // Currency Toggle Handler (MMK Kyats <-> USD $)
  const handleToggleCurrency = () => {
    soundFX.playClick();
    setCurrency((prev) => (prev === 'MMK' ? 'USD' : 'MMK'));
  };

  // Google Auth Sign-in / Sign-out
  const handleGoogleAuth = async () => {
    soundFX.playClick();
    if (currentUser) {
      if (window.confirm(`အကောင့်မှ ထွက်မည်လား? (${currentUser.email})`)) {
        await signOut(auth);
      }
    } else {
      try {
        await signInWithPopup(auth, googleAuthProvider);
        soundFX.playGoldChime();
      } catch (err: any) {
        console.error('Google Sign-in failed:', err);
      }
    }
  };

  const activeOwnerUid = isStorePrivate && currentUser ? currentUser.uid : '';

  // Delete product from cloud inventory & SQL Multi-Base
  const handleDeleteProduct = async (productId: string) => {
    await deleteProductFromCloud(productId, storeId);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Update product stock in cloud inventory & SQL Multi-Base
  const handleUpdateStock = async (productId: string, newStock: number) => {
    await updateProductStockInCloud(productId, newStock, storeId);
  };

  // Clear all products from cloud catalog
  const handleClearAllProducts = async () => {
    await clearAllProductsFromCloud(storeId);
    setProducts([]);
    setCart([]);
  };

  // Load sample products into cloud catalog if requested
  const handleLoadSampleProducts = async () => {
    await loadSampleProductsToCloud(storeId, activeOwnerUid);
  };

  // Open Usage Guide at specific step
  const handleOpenGuide = (stepNumber: number = 1) => {
    soundFX.playClick();
    setGuideActiveStep(stepNumber);
    setShowUsageGuide(true);
  };

  // Cart operations
  const handleAddProduct = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleSetQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  // Manual Product addition (Saved to Firestore & PostgreSQL Multi-Base)
  const handleAddManualProduct = async (product: Product) => {
    await saveProductToCloud(product, storeId, activeOwnerUid);
    handleAddProduct(product);
  };

  // Payment Calculation
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const loyaltyRate = activeLoyalty ? activeLoyalty.discountRate : 0;
  const effectiveDiscountRate = Math.min(0.6, discountPercent / 100 + loyaltyRate);
  const discountAmount = subtotal * effectiveDiscountRate;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;

  // Payment Success Handler (Atomically updates shared stock across Firestore & SQL)
  const handlePaymentSuccess = async (sale: CompletedSale) => {
    const saleWithDevice: CompletedSale = {
      ...sale,
      cashierName,
      registerId,
    };

    setShowPaymentModal(false);
    setCompletedSale(saleWithDevice);

    // Sync full sale to Firestore + PostgreSQL Multi-Base + decrement stock atomically
    await recordCloudSale(saleWithDevice, storeId, activeOwnerUid);

    // Update local stats
    setDailyStats((prev) => {
      const itemsCount = saleWithDevice.items.reduce((acc, i) => acc + i.quantity, 0);
      return {
        ...prev,
        totalSales: prev.totalSales + saleWithDevice.total,
        itemsSold: prev.itemsSold + itemsCount,
        transactionsCount: prev.transactionsCount + 1,
      };
    });
  };

  const handleNewTransaction = () => {
    setCompletedSale(null);
    handleClearCart();
    soundFX.playClick();
  };

  // Guide Step Action Practice Trigger
  const handleExecuteGuideStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        setShowLiveCameraScanner(true);
        break;
      case 2:
        setShowLoyaltyModal(true);
        break;
      case 3:
        if (cart.length === 0) handleAddProduct(products[0]);
        setShowPaymentModal(true);
        break;
      case 4:
        setShowPaymentModal(true);
        break;
      case 5:
        if (recentSales.length > 0) {
          setCompletedSale(recentSales[0]);
        }
        break;
      case 6:
        setShowAnalyticsModal(true);
        break;
      default:
        break;
    }
  };

  // View routing handler from TopBar
  const handleViewChange = (view: 'pos' | 'analytics' | 'inventory') => {
    setCurrentView(view);
    if (view === 'analytics') setShowAnalyticsModal(true);
    if (view === 'inventory') setShowInventoryModal(true);
  };

  return (
    <div
      className={`min-h-screen bg-[#07080b] text-amber-100/90 flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200 ${
        language === 'my' ? 'font-myanmar' : 'font-exo'
      }`}
    >
      {/* Top Bar with Camera Scanner, Cloud Sync, Mode Switcher, and Bilingual Toggle */}
      <TopBar
        currentView={currentView}
        onViewChange={handleViewChange}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        activeItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        uiMode={uiMode}
        onToggleMode={handleToggleMode}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onOpenGuide={() => handleOpenGuide(1)}
        onOpenLiveCameraScanner={() => setShowLiveCameraScanner(true)}
        onOpenMultiDeviceSync={() => setShowMultiDeviceModal(true)}
        onOpenAddNewProduct={() => {
          setPrefillBarcode(undefined);
          setShowManualEntry(true);
        }}
        onOpenMarketSearch={() => setShowMarketSearchModal(true)}
        currentUser={currentUser}
        onGoogleAuth={handleGoogleAuth}
        connectedDevicesCount={Math.max(1, activeDevices.length)}
        isCloudSynced={isCloudSynced}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        registerId={registerId}
        cashierName={cashierName}
        t={t}
      />

      {/* Main Cashier Workspace Canvas */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Sleek Golden Station Status & Backend Connectivity Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#0a0c12]/90 border border-amber-500/20 text-xs font-mono shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse'
                  : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
              }`}
            />
            <button
              onClick={() => setShowMultiDeviceModal(true)}
              className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/35 text-amber-300 font-bold hover:border-amber-300 cursor-pointer"
              title="Click to pair devices or switch Shop Workspace"
            >
              {isStorePrivate ? '🔒 ' : ''}{storeId}
            </button>
            <span className="text-amber-200 font-semibold">{registerId}</span>
            <span className="text-amber-500/50">·</span>
            <span className="text-amber-300">{cashierName}</span>
            <span className="text-amber-500/50">·</span>
            <span className={isOnline ? 'text-emerald-300 font-medium' : 'text-amber-400'}>
              {isOnline ? 'Multi-Cloud Sync Live' : 'Offline Cache Active'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-amber-500/80 flex-wrap">
            <span>{products.length} Products in Catalog</span>
            <span>·</span>
            <button
              onClick={() => setShowMultiDeviceModal(true)}
              className="text-amber-300 hover:text-amber-100 hover:underline cursor-pointer"
            >
              {activeDevices.length} Terminals
            </button>
            <span>·</span>
            <button
              onClick={() => handleOpenGuide(1)}
              className="text-amber-400 hover:text-amber-200 cursor-pointer font-bold"
            >
              လမ်းညွှန် (F1)
            </button>
          </div>
        </div>

        {uiMode === 'simplified' ? (
          /* ================= BEGINNER SIMPLIFIED MODE ================= */
          <SimplifiedPOSView
            cart={cart}
            products={products}
            activeLoyalty={activeLoyalty}
            discountPercent={discountPercent}
            taxRate={taxRate}
            currency={currency}
            onAddProduct={handleAddProduct}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenQuickItem={() => setShowQuickItemModal(true)}
            onOpenManualEntry={() => {
              setPrefillBarcode(undefined);
              setShowManualEntry(true);
            }}
            onOpenCatalog={() => setShowInventoryModal(true)}
            onOpenLoyaltyModal={() => setShowLoyaltyModal(true)}
            onOpenDiscountModal={() => setShowDiscountModal(true)}
            onInitiateCheckout={() => setShowPaymentModal(true)}
            onOpenGuide={handleOpenGuide}
            onSwitchToPro={() => setUiMode('pro')}
            onOpenLiveCameraScanner={() => setShowLiveCameraScanner(true)}
            t={t}
            language={language}
          />
        ) : (
          /* ================= EXPERT PRO CYBERPUNK MODE ================= */
          <>
            {/* Holographic Barcode Scanner Centerpiece with Gold Beam */}
            <section aria-label="Holographic Barcode Scanner Centerpiece">
              <HoloScanner
                onProductScanned={handleAddProduct}
                availableProducts={products}
                currency={currency}
                onOpenManualEntry={() => {
                  setPrefillBarcode(undefined);
                  setShowManualEntry(true);
                }}
                onOpenLiveCameraScanner={() => setShowLiveCameraScanner(true)}
                t={t}
              />
            </section>

            {/* 2-Column Split POS Dashboard Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Scanned Item List Panel (8 cols on desktop) */}
              <div className="lg:col-span-8 flex flex-col h-full">
                <ItemListPanel
                  cart={cart}
                  currency={currency}
                  onUpdateQuantity={handleUpdateQuantity}
                  onSetQuantity={handleSetQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  onOpenQuickItem={() => setShowQuickItemModal(true)}
                  onOpenManualEntry={() => {
                    setPrefillBarcode(undefined);
                    setShowManualEntry(true);
                  }}
                  availableProducts={products}
                  onAddProduct={handleAddProduct}
                  t={t}
                />
              </div>

              {/* Right Column: Order Summary & Checkout (4 cols on desktop) */}
              <div className="lg:col-span-4 flex flex-col h-full">
                <OrderSummary
                  cart={cart}
                  currency={currency}
                  discountPercent={discountPercent}
                  onApplyDiscount={setDiscountPercent}
                  activeLoyalty={activeLoyalty}
                  onSelectLoyalty={setActiveLoyalty}
                  availableLoyaltyMembers={MOCK_LOYALTY_MEMBERS}
                  taxRate={taxRate}
                  onClearOrder={handleClearCart}
                  onInitiateCheckout={() => setShowPaymentModal(true)}
                  t={t}
                />
              </div>
            </section>
          </>
        )}

        {/* Full-Width Register Overview Strip */}
        <section aria-label="Daily Register Overview">
          <DailyStatsDrawer
            stats={dailyStats}
            currency={currency}
            onOpenInventory={() => setShowInventoryModal(true)}
            onOpenAnalytics={() => setShowAnalyticsModal(true)}
            t={t}
          />
        </section>
      </main>

      {/* Live Mobile/Webcam Camera Barcode Scanner Modal */}
      {showLiveCameraScanner && (
        <LiveCameraScannerModal
          availableProducts={products}
          onProductScanned={(prod) => {
            handleAddProduct(prod);
          }}
          onRegisterNewBarcode={(code) => {
            setPrefillBarcode(code);
            setShowManualEntry(true);
          }}
          onClose={() => setShowLiveCameraScanner(false)}
          t={t}
        />
      )}

      {/* Multi-Device Station, Shared Stock & Multi-Cloud Sync Hub Modal */}
      {showMultiDeviceModal && (
        <MultiDeviceSyncModal
          devices={activeDevices}
          currentDeviceId={deviceId}
          currentStoreId={storeId}
          onChangeStoreId={handleChangeStoreId}
          isStorePrivate={isStorePrivate}
          onToggleStorePrivacy={handleToggleStorePrivacy}
          isUserSignedIn={Boolean(currentUser)}
          currentRegisterId={registerId}
          currentCashierName={cashierName}
          onUpdateDeviceSettings={handleUpdateDeviceSettings}
          products={products}
          sales={recentSales}
          onOpenManualEntry={() => {
            setShowMultiDeviceModal(false);
            setPrefillBarcode(undefined);
            setShowManualEntry(true);
          }}
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onFlushPendingSales={async () => {
            await flushPendingSales(storeId, activeOwnerUid);
          }}
          ownerUid={activeOwnerUid}
          onClose={() => setShowMultiDeviceModal(false)}
          t={t}
        />
      )}

      {/* 6-Step Usage Guide Panel Modal */}
      {showUsageGuide && (
        <UsageGuideModal
          onClose={() => setShowUsageGuide(false)}
          t={t}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          initialStep={guideActiveStep}
          onExecuteStepAction={handleExecuteGuideStep}
        />
      )}

      {/* Payment Settlement Modal */}
      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          total={grandTotal}
          loyaltyMember={activeLoyalty}
          currency={currency}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          t={t}
        />
      )}

      {/* Printed Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          currency={currency}
          onClose={() => setCompletedSale(null)}
          onNewTransaction={handleNewTransaction}
          t={t}
        />
      )}

      {/* Manual Item Entry Modal */}
      {showManualEntry && (
        <ManualEntryModal
          onAddManualProduct={handleAddManualProduct}
          initialBarcode={prefillBarcode}
          currency={currency}
          onClose={() => {
            setShowManualEntry(false);
            setPrefillBarcode(undefined);
          }}
          t={t}
        />
      )}

      {/* Quick Custom Item / Walk-in Sale Modal */}
      {showQuickItemModal && (
        <QuickItemModal
          currency={currency}
          onAddQuickProduct={(prod: Product) => {
            handleAddProduct(prod);
            setShowQuickItemModal(false);
          }}
          onClose={() => setShowQuickItemModal(false)}
          t={t}
        />
      )}

      {/* Standalone Reusable Discount Modal */}
      {showDiscountModal && (
        <DiscountModal
          currentDiscount={discountPercent}
          onApplyDiscount={setDiscountPercent}
          onClose={() => setShowDiscountModal(false)}
          t={t}
        />
      )}

      {/* Standalone Reusable Loyalty Modal */}
      {showLoyaltyModal && (
        <LoyaltyModal
          activeLoyalty={activeLoyalty}
          onSelectLoyalty={setActiveLoyalty}
          availableLoyaltyMembers={MOCK_LOYALTY_MEMBERS}
          onClose={() => setShowLoyaltyModal(false)}
          t={t}
        />
      )}

      {/* Manager Reports & Analytics Modal */}
      {showAnalyticsModal && (
        <AnalyticsModal
          stats={dailyStats}
          recentSales={recentSales}
          currency={currency}
          onClose={() => {
            setShowAnalyticsModal(false);
            if (currentView === 'analytics') setCurrentView('pos');
          }}
          t={t}
        />
      )}

      {/* Vault Inventory Catalog Modal */}
      {showInventoryModal && (
        <InventoryModal
          products={products}
          onAddProduct={handleAddProduct}
          onOpenAddNew={() => {
            setShowInventoryModal(false);
            setShowManualEntry(true);
          }}
          onDeleteProduct={handleDeleteProduct}
          onUpdateStock={handleUpdateStock}
          onClearAllProducts={handleClearAllProducts}
          onLoadSampleProducts={handleLoadSampleProducts}
          currency={currency}
          onClose={() => {
            setShowInventoryModal(false);
            if (currentView === 'inventory') setCurrentView('pos');
          }}
          t={t}
        />
      )}

      {/* Real-time Market Search Modal powered by Gemini 3.8 Flash & Google Search */}
      {showMarketSearchModal && (
        <MarketSearchModal
          onClose={() => setShowMarketSearchModal(false)}
          onQuickAddItem={(name, price) => {
            const newProd: Product = {
              id: 'item-' + Date.now(),
              sku: 'SKU-' + Date.now().toString().slice(-6),
              barcode: '885' + Math.floor(100000000 + Math.random() * 900000000),
              name,
              category: 'အထွေထွေ',
              price,
              stock: 20,
              description: 'စျေးကွက်ပေါက်စျေးဖြင့် ထည့်သွင်းထားသော ပစ္စည်း',
            };
            handleAddManualProduct(newProd);
            setShowMarketSearchModal(false);
          }}
        />
      )}

      {/* Footer bar with Compact & Refined Burma Batik Official Sponsor Showcase */}
      <footer className="mt-auto border-t border-amber-500/20 py-2 sm:py-2.5 px-3 bg-[#07090f]/95 backdrop-blur-md flex items-center justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Ambient subtle glow line behind sponsor text */}
        <div className="absolute inset-x-1/3 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        <div className="absolute w-80 h-8 -top-4 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Compact Centerpiece Burma Batik Sponsor Banner */}
        <div className="relative z-10 flex items-center justify-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-950/30 via-neutral-900/60 to-amber-950/30 border border-amber-400/40 shadow-[0_0_15px_rgba(245,183,0,0.15)] hover:border-amber-300/70 transition-all duration-200 group">
          <span className="text-amber-400/90 text-[11px] sm:text-xs">✨</span>
          <span className="font-myanmar text-xs sm:text-[13px] tracking-normal select-all flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-amber-200 font-medium">
              ဘားမားပါတိတ်မှ ပံ့ပိုးကူညီသည်
            </span>
            <span className="text-amber-500/50 text-[10px] hidden sm:inline">·</span>
            <span className="text-yellow-300 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.45)]">
              ဘားမားပါတိတ်ဝတ်ဖူးလား?
            </span>
          </span>
          <span className="text-amber-400/90 text-[11px] sm:text-xs">✨</span>
        </div>
      </footer>
    </div>
  );
}
