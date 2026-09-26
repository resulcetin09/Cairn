'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Timer,
  Sun,
  Moon,
  Menu,
  X,
  Undo2,
  Layers3,
  Wallet,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useWallet } from './wallet-context';
import { CinematicBackdrop } from './cinematic';
import {
  formatTNight,
  getUserContribution,
  CAMPAIGN_CATEGORIES,
  type CampaignItem,
  type CampaignCategory,
} from './campaigns';
import { useCampaignStore } from './campaign-store';



const faqs = [
  [
    'Katkı miktarımı kim görebilir?',
    'Önerilen protokolde yalnızca sen. Katkı tutarı Midnight ağında bir ZK commitment ile temsil edilir; herkese açık görünümde bireysel tutarlar veya katkı sahibi listesi bulunmaz. Lace cüzdanın ile oluşturulan proof zincirde doğrulanır.',
  ],
  [
    'Hedefe ulaşılamazsa ne olur?',
    'Süre dolduğunda hedef tamamlanmamışsa kampanya başarısız olur ve akıllı sözleşme her katılımcının kendi gizli katkısını otomatik geri almasını (refund) sağlar.',
  ],
  [
    'Hedef aşılabilir mi?',
    'Bu tasarımda hayır. Toplam katkının hedefi aşmasına yol açan işlem kabul edilmez. Hedef erken tamamlanırsa yeni katkılar kapanır; sonuç belirlenen sürenin sonunda açıklanır.',
  ],
  [
    'Lace cüzdanı ve Midnight entegrasyonu nasıl çalışır?',
    'Lace, Midnight blockchain (Preview ağı) için gizlilik özellikli cüzdandır. Cüzdanınızı bağladığınızda shielded adresiniz kullanılarak zero-knowledge kanıtları üretilir ve DUST token ile işlem ücretleri gizli kalır.',
  ],
  [
    'Yüzde gösterimi tam gizlilik sağlar mı?',
    'Tek başına sağlamaz. Yüzdedeki anlık değişimler çıkarım yapılmasına izin vermesin diye gerçek protokolde toplu (batched) veya yuvarlanmış ilerleme güncellemeleri kullanılır.',
  ],
];

function Brand() {
  return (
    <a className="brand" href="#" aria-label="Cairn ana sayfa">
      <Layers3 aria-hidden="true" />
      <span>
        cairn<span className="brand-period">.</span>
      </span>
    </a>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const sync = () =>
      setDark(
        document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : query.matches
      );
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="theme-toggle"
      aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.dataset.theme = next ? 'dark' : 'light';
        try {
          localStorage.setItem('crowdfunding-theme', next ? 'dark' : 'light');
        } catch {}
      }}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

function HeaderWalletButton() {
  const {
    isAvailable,
    isConnected,
    connecting,
    walletName,
    shieldedAddress,
    unshieldedAddress,
    tNightBalance,
    connect,
    disconnect,
    formatAddress,
    error,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);

  const displayAddr = formatAddress(shieldedAddress || unshieldedAddress);

  if (isConnected) {
    return (
      <div className="wallet-header-wrap">
        <button
          type="button"
          className="wallet-connected-pill"
          onClick={() => setShowDropdown(!showDropdown)}
          title="Cüzdan Detayları"
        >
          <span className="wallet-live-dot" />
          <span className="wallet-addr-text">{displayAddr}</span>
          <span className="wallet-network-tag">Preview</span>
        </button>

        {showDropdown && (
          <div className="wallet-dropdown-menu">
            <div className="wallet-dropdown-header">
              <span className="text-xs text-muted">Bağlı Cüzdan</span>
              <strong className="text-sm">{walletName || 'Lace'}</strong>
            </div>
            <div className="wallet-dropdown-info">
              <div>
                <span className="text-xs text-muted">Ağ:</span>
                <span className="text-xs font-mono font-medium">Midnight Preview</span>
              </div>
              <div>
                <span className="text-xs text-muted">Bakiye:</span>
                <span className="text-xs font-mono font-medium text-primary">
                  {tNightBalance !== null ? formatTNight(tNightBalance) : '5.000 tNIGHT'}
                </span>
              </div>
              {shieldedAddress && (
                <div>
                  <span className="text-xs text-muted">Shielded:</span>
                  <span className="text-xs font-mono">{formatAddress(shieldedAddress)}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="wallet-disconnect-btn"
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Bağlantıyı Kes</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connect-wrapper">
      <Button
        variant="outline"
        className="wallet-cta-btn"
        disabled={connecting}
        onClick={connect}
      >
        <Wallet className="w-4 h-4 mr-1.5 text-primary" />
        {connecting ? 'Bağlanıyor...' : 'Cüzdanı Bağla'}
      </Button>
      {error && (
        <div className="wallet-error-tooltip">
          <span>{error}</span>
          {!isAvailable && (
            <a
              href="https://www.lace.io"
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-download-link"
            >
              Lace İndir <ExternalLink className="w-3 h-3 inline" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CreateCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    category: CampaignCategory;
    targetAmount: number;
    deadlineDays: number;
    creatorAddress: string;
  }) => void;
}) {
  const { isConnected, shieldedAddress, unshieldedAddress, connect, connecting, formatAddress } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('AÇIK KAYNAK');
  const [target, setTarget] = useState('');
  const [days, setDays] = useState('');
  const [formError, setFormError] = useState('');

  if (!open) return null;

  const walletAddr = shieldedAddress || unshieldedAddress;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !walletAddr) {
      setFormError('Kampanya oluşturmak için önce Lace cüzdanınızı bağlayın.');
      return;
    }
    if (!title.trim()) { setFormError('Kampanya başlığı zorunludur.'); return; }
    if (!description.trim()) { setFormError('Açıklama zorunludur.'); return; }
    const targetNum = Number(target);
    if (isNaN(targetNum) || targetNum <= 0) { setFormError('Geçerli bir hedef tutarı girin.'); return; }
    const daysNum = Number(days);
    if (isNaN(daysNum) || daysNum <= 0 || daysNum > 365) { setFormError('Geçerli bir süre girin (1-365 gün).'); return; }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      category,
      targetAmount: targetNum,
      deadlineDays: daysNum,
      creatorAddress: walletAddr,
    });

    // Formu sıfırla ve kapat
    setTitle('');
    setDescription('');
    setCategory('AÇIK KAYNAK');
    setTarget('');
    setDays('');
    setFormError('');
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-campaign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Yeni Kampanya Oluştur</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Kapat">
            <X />
          </button>
        </div>

        {!isConnected ? (
          <div className="modal-wallet-prompt">
            <Wallet className="w-8 h-8 opacity-50" />
            <p>Kampanya oluşturmak için önce Lace cüzdanınızı bağlayın.</p>
            <Button onClick={connect} disabled={connecting}>
              <Wallet className="w-4 h-4" />
              {connecting ? 'Bağlanıyor...' : 'Lace Cüzdanı Bağla'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="create-campaign-form" noValidate>
            <div className="form-creator-info">
              <Check className="w-3.5 h-3.5 text-primary" />
              <span>Oluşturucu: <strong>{formatAddress(walletAddr)}</strong></span>
            </div>

            <div className="form-field">
              <label htmlFor="c-title">Kampanya Başlığı</label>
              <Input
                id="c-title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setFormError(''); }}
                placeholder="Örn: Midnight ZK Explorer Geliştirme"
                autoComplete="off"
              />
            </div>

            <div className="form-field">
              <label htmlFor="c-desc">Açıklama</label>
              <textarea
                id="c-desc"
                className="form-textarea"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFormError(''); }}
                placeholder="Kampanyanızın amacını ve hedefini açıklayın..."
                rows={3}
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label htmlFor="c-category">Kategori</label>
                <select
                  id="c-category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CampaignCategory)}
                >
                  {CAMPAIGN_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="c-days">Süre (gün)</label>
                <Input
                  id="c-days"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => { setDays(e.target.value); setFormError(''); }}
                  placeholder="Örn: 14"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="c-target">Hedef Tutar (tNIGHT)</label>
              <Input
                id="c-target"
                inputMode="numeric"
                value={target}
                onChange={(e) => { setTarget(e.target.value); setFormError(''); }}
                placeholder="Örn: 5000"
                autoComplete="off"
              />
            </div>

            {formError && (
              <p className="form-error" role="alert">{formError}</p>
            )}

            <Button type="submit" className="contribute-button">
              <Plus className="w-4 h-4" />
              Kampanyayı Başlat
              <ArrowRight />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function CampaignsSection() {
  const { campaigns, loaded, createCampaign, addContribution, updateCampaignStatus } = useCampaignStore();
  const [selectedId, setSelectedId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'TÜMÜ' | CampaignCategory>('TÜMÜ');
  const [amount, setAmount] = useState('100');
  const [view, setView] = useState('personal');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastTx, setLastTx] = useState<{ txHash: string; explorerUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refundClaimed, setRefundClaimed] = useState<Record<string, boolean>>({});
  const pending = useRef(false);

  const {
    isConnected,
    connecting,
    shieldedAddress,
    unshieldedAddress,
    tNightBalance,
    sendContributionTransaction,
    claimRefundTransaction,
    formatAddress,
    connect,
  } = useWallet();

  const walletAddr = shieldedAddress || unshieldedAddress;

  // İlk kampanya yüklendiğinde ilkini seç
  useEffect(() => {
    if (loaded && campaigns.length > 0 && !selectedId) {
      setSelectedId(campaigns[0].id);
    }
  }, [loaded, campaigns, selectedId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedId) || campaigns[0] || null;
  const percent = selectedCampaign
    ? Math.min(100, (selectedCampaign.raisedAmount / selectedCampaign.targetAmount) * 100)
    : 0;
  const success = selectedCampaign
    ? selectedCampaign.raisedAmount >= selectedCampaign.targetAmount
    : false;
  const myContribution = selectedCampaign ? getUserContribution(selectedCampaign, walletAddr) : 0;

  const filteredCampaigns = categoryFilter === 'TÜMÜ'
    ? campaigns
    : campaigns.filter((c) => c.category === categoryFilter);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current || !selectedCampaign) return;

    // Cüzdan bağlı olmalı
    if (!isConnected) {
      setError('Katkı yapmak için önce Lace cüzdanınızı bağlayın.');
      return;
    }

    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setError('Geçerli bir tNIGHT tutarı girin.');
      return;
    }
    if (selectedCampaign.raisedAmount + num > selectedCampaign.targetAmount) {
      setError('Bu katkı hedef tutarı aşıyor.');
      return;
    }

    setError('');
    setNotice('');
    setLastTx(null);
    setBusy(true);
    pending.current = true;

    try {
      setNotice('Lace cüzdanından işlem onayı bekleniyor (Popup kontrol edin)...');

      const commitmentHex = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;

      const txRes = await sendContributionTransaction(
        num,
        selectedCampaign.creatorAddress,
        commitmentHex
      );

      // Katkıyı localStorage'a kaydet
      addContribution(selectedCampaign.id, {
        address: walletAddr || '',
        amount: num,
        txHash: txRes.txHash,
        timestamp: Date.now(),
      });

      setLastTx(txRes);
      setNotice(
        `${formatTNight(num)} katkın Midnight Preview ağına başarıyla iletildi!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.';
      setError(msg);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }

  // Henüz yüklenmedi
  if (!loaded) return null;

  return (
    <section id="campaigns" className="demo-section section-wrap">
      <div className="section-heading">
        <h2>
          Fikirler ortak.<br />
          <span>Katkın sana özel.</span>
        </h2>
        <p>
          Midnight Network üzerinde gizlilik korumalı kampanyaları keşfet veya kendi kampanyanı başlat.<br />
          ZK taahhüdü ile destek ol; hedef gerçekleşsin ya da katkın sana geri dönsün.
        </p>
      </div>

      {/* Üst Bar: Kategori Filtreleme + Kampanya Oluştur */}
      <div className="campaigns-top-bar">
        <div className="campaign-categories-bar">
          {(['TÜMÜ', 'AÇIK KAYNAK', 'ZK GİZLİLİK', 'EKOSİSTEM', 'TOPLULUK FONU'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button
          className="create-campaign-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Kampanya Oluştur
        </Button>
      </div>

      {/* Kampanya Oluşturma Modal'ı */}
      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(data) => {
          const newCampaign = createCampaign(data);
          setSelectedId(newCampaign.id);
          setCategoryFilter('TÜMÜ');
        }}
      />

      {/* Kampanya Kartları veya Boş Durum */}
      {campaigns.length === 0 ? (
        <div className="campaigns-empty-state">
          <div className="empty-icon">
            <Layers3 className="w-12 h-12" />
          </div>
          <h3>Henüz kampanya yok.</h3>
          <p>İlk gizli kampanyayı sen başlat! Lace cüzdanını bağla ve hedefini belirle.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            İlk Kampanyayı Oluştur
          </Button>
        </div>
      ) : (
        <>
          <div className="campaigns-explore-grid">
            {filteredCampaigns.length === 0 ? (
              <div className="category-empty-notice">
                <p>&ldquo;{categoryFilter}&rdquo; kategorisinde henüz kampanya bulunmuyor.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryFilter('TÜMÜ')}
                >
                  Tüm Kampanyaları Göster
                </Button>
              </div>
            ) : (
              filteredCampaigns.map((camp) => {
              const campPercent = Math.min(100, (camp.raisedAmount / camp.targetAmount) * 100);
              const isCampSelected = camp.id === selectedId;

              return (
                <div
                  key={camp.id}
                  className={`campaign-card ${isCampSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedId(camp.id);
                    setError('');
                    setNotice('');
                    setLastTx(null);
                  }}
                >
                  <div className="campaign-card-top">
                    <span className="campaign-card-tag">{camp.category}</span>
                    {walletAddr && camp.creatorAddress === walletAddr && (
                      <span className="campaign-card-tag creator-pill">Senin</span>
                    )}
                    <span className="campaign-card-time">
                      <Timer className="w-3.5 h-3.5" />
                      {camp.deadlineDays > 0 ? `${camp.deadlineDays} gün kaldı` : 'Tamamlandı'}
                    </span>
                  </div>

                  <h4 className="campaign-card-title">{camp.title}</h4>
                  <p className="campaign-card-desc">{camp.description}</p>

                  <div className="campaign-card-progress-wrap">
                    <div className="campaign-card-progress-header">
                      <span className="card-progress-percent">
                        %{new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(campPercent)}
                      </span>
                      <span className="card-target-text">Hedef: {formatTNight(camp.targetAmount)}</span>
                    </div>
                    <div className="segmented-progress-mini">
                      {Array.from({ length: 24 }, (_, i) => (
                        <span
                          key={i}
                          className={i < Math.floor(campPercent / 4.16) ? 'filled' : ''}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="campaign-card-footer">
                    <span className="card-raised-info">
                      Toplanan: <strong>{formatTNight(camp.raisedAmount)}</strong>
                    </span>
                    <button
                      type="button"
                      className={`card-select-btn ${isCampSelected ? 'selected' : ''}`}
                    >
                      {isCampSelected ? 'İnceleniyor' : 'Katkı Yap'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Seçili Kampanyanın İnteraktif Detay & Katkı Paneli */}
          {selectedCampaign && (
            <div className="demo-shell">
              <div className="demo-top">
                <span className="demo-label">
                  <span className="status-dot" />
                  Seçili Kampanya: <strong>{selectedCampaign.title}</strong>
                  {walletAddr && selectedCampaign.creatorAddress === walletAddr && (
                    <span className="creator-pill">🎯 Senin Kampanyan</span>
                  )}
                </span>
                {isConnected ? (
                  <span className="sample-note connected-note">
                    <span className="wallet-live-dot" />
                    Lace Aktif: <strong>{formatAddress(walletAddr)}</strong> (Midnight Preview)
                  </span>
                ) : (
                  <span className="sample-note">Lace Cüzdanını Bağlayarak Katılabilirsin</span>
                )}
              </div>

              <div className="demo-grid">
                {/* Sol: Herkese Açık Kampanya Görünümü */}
                <div className="public-campaign">
                  <div className="campaign-topline">
                    <span className="campaign-category">{selectedCampaign.category} · MIDNIGHT</span>
                    <span className="public-label">
                      <Eye />
                      Herkese açık
                    </span>
                  </div>
                  <h3>{selectedCampaign.title}</h3>
                  {selectedCampaign.status !== 'failed' ? (
                    <>
                      <div className="campaign-meta">
                        <span>
                          <Timer />
                          {selectedCampaign.deadlineDays > 0
                            ? `${selectedCampaign.deadlineDays} günlük süre`
                            : 'Süre doldu'}
                        </span>
                        <span>Hedef {formatTNight(selectedCampaign.targetAmount)}</span>
                      </div>
                      <div className="progress-number">
                        <span>
                          {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(percent)}
                          <small>%</small>
                        </span>
                        <span>
                          ortak hedefe<br />
                          ZK gizliliği ile
                        </span>
                      </div>
                      <div
                        className="segmented-progress"
                        role="progressbar"
                        aria-label="Kampanya ilerlemesi"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        {Array.from({ length: 40 }, (_, i) => (
                          <span key={i} className={i < Math.floor(percent / 2.5) ? 'filled' : ''} />
                        ))}
                      </div>
                      <div className="progress-scale">
                        <span>Başlangıç</span>
                        <span>Ortak hedef ({formatTNight(selectedCampaign.targetAmount)})</span>
                      </div>
                      <div className="campaign-privacy">
                        <LockKeyhole />
                        <p>
                          {success
                            ? 'Hedef tamamlandı! Fonlar akıllı sözleşme tarafından kampanya sahibine aktarılmaya hazır.'
                            : 'Bireysel katkılar zincirde görünmez. Yalnızca toplam ilerleme yüzdesi doğrulanır.'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="public-result" role="status">
                      <div className="result-icon">
                        <Undo2 />
                      </div>
                      <p>Kampanya sonucu</p>
                      <strong>Başarısız</strong>
                      <p>
                        Hedefe ulaşılamadığı için katılımcılar ZK Nullifier ile<br />
                        tNIGHT katkılarını cüzdanlarına geri çeker.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sağ: Katılımcı Alanı */}
                <div className="participant-area">
                  <Tabs value={view} onValueChange={setView}>
                    <TabsList className="view-tabs" aria-label="Görünüm modu">
                      <TabsTrigger value="personal">
                        <LockKeyhole />
                        Senin görünümün
                      </TabsTrigger>
                      <TabsTrigger value="public">
                        <Eye />
                        Ziyaretçi görünümü
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                      {selectedCampaign.status !== 'failed' ? (
                        <form onSubmit={submit} noValidate>
                          {/* Cüzdan durumu kartı */}
                          <div className="wallet-mini-status">
                            {isConnected ? (
                              <div className="wallet-active-badge-col">
                                <div className="wallet-active-badge">
                                  <Check className="w-3.5 h-3.5 text-primary" />
                                  <span>Lace Cüzdanın Bağlı:</span>
                                  <strong>{formatAddress(walletAddr)}</strong>
                                </div>
                                {tNightBalance !== null && (
                                  <div className="wallet-live-balance-row">
                                    <span className="balance-label">Testnet Bakiyesi:</span>
                                    <span className="balance-value">{formatTNight(tNightBalance)}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="wallet-inactive-prompt">
                                <span>Katkı yapmak için Lace cüzdanını bağla:</span>
                                <button
                                  type="button"
                                  className="wallet-quick-connect"
                                  disabled={connecting}
                                  onClick={connect}
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  {connecting ? 'Bağlanıyor...' : 'Lace Cüzdanı Bağla'}
                                </button>
                              </div>
                            )}
                          </div>

                          <h4>{success ? 'Hedef tamamlandı.' : 'Gizli katkı yap. Projeyi büyüt.'}</h4>
                          <p className="form-description">
                            {success
                              ? 'Bu kampanya hedefine ulaştı. Yeni katkılar kapandı.'
                              : isConnected
                              ? 'Katkı tutarın Midnight ZK taahhüdüyle korunur; zincirde yalnızca sen bilirsin.'
                              : 'Katkı yapabilmek için önce Lace cüzdanını bağlaman gerekiyor.'}
                          </p>

                          <label htmlFor="amount">
                            Katkı tutarın <span>tNIGHT</span>
                          </label>
                          <div className="amount-field">
                            <span className="text-sm font-mono opacity-60">₥</span>
                            <Input
                              id="amount"
                              inputMode="numeric"
                              value={amount}
                              onChange={(e) => {
                                setAmount(e.target.value);
                                setError('');
                              }}
                              disabled={busy || success || !isConnected}
                              aria-invalid={!!error}
                              aria-describedby={error ? 'amount-error' : 'amount-help'}
                              autoComplete="off"
                            />
                          </div>

                          <div className="amount-presets">
                            {['50', '100', '250', '500'].map((value) => (
                              <Button
                                key={value}
                                type="button"
                                variant="outline"
                                className={amount === value ? 'selected' : ''}
                                disabled={busy || success || !isConnected}
                                onClick={() => {
                                  setAmount(value);
                                  setError('');
                                }}
                              >
                                {value} tNIGHT
                              </Button>
                            ))}
                          </div>

                          <p id="amount-help" className="input-help">
                            Hedefi aşan katkılar kabul edilmez.
                          </p>
                          {error && (
                            <p id="amount-error" className="form-error" role="alert">
                              {error}
                            </p>
                          )}

                          <Button
                            type="submit"
                            className="contribute-button"
                            disabled={busy || success || !isConnected}
                            aria-busy={busy}
                          >
                            {busy ? (
                              <span className="loading-text">Midnight ZK İşlemi Gönderiliyor...</span>
                            ) : (
                              <>
                                <LockKeyhole />
                                {success
                                  ? 'Hedef Tamamlandı'
                                  : isConnected
                                  ? 'Lace ile Gizli Katkı Yap'
                                  : 'Önce Cüzdanı Bağla'}
                                <ArrowRight />
                              </>
                            )}
                          </Button>

                          {lastTx && (
                            <div className="tx-success-card">
                              <div className="tx-success-header">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Midnight Preview Ağına İletildi</span>
                              </div>
                              <div className="tx-hash-row">
                                <span className="tx-hash-label">Tx Hash:</span>
                                <code className="tx-hash-code">
                                  {lastTx.txHash.slice(0, 14)}...{lastTx.txHash.slice(-8)}
                                </code>
                              </div>
                              <a
                                href={lastTx.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tx-explorer-link"
                              >
                                Explorer&apos;da Doğrula <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          <div className="own-total">
                            <span>Bu kampanyadaki toplam katkın</span>
                            <strong>{formatTNight(myContribution)}</strong>
                          </div>
                          <p className="private-note">
                            <ShieldCheck />
                            Bu miktar ziyaretçi görünümünde ve zincir explorer&apos;ında görünmez.
                          </p>
                        </form>
                      ) : (
                        <div className="personal-result">
                          <ShieldCheck />
                          <h4>
                            {myContribution > 0
                              ? 'Hedefe ulaşılamadı. Katkın güvende.'
                              : 'Hedefe ulaşılamadı.'}
                          </h4>
                          <p>
                            {myContribution > 0
                              ? 'All-or-Nothing kuralı gereğince ZK Nullifier devresiyle tNIGHT katkını Lace cüzdanına geri çekebilirsin.'
                              : 'Bu kampanyaya katkı yapmamış görünüyorsun.'}
                          </p>
                          <div className="receipt">
                            <span>İade tutarı</span>
                            <strong>{formatTNight(myContribution)}</strong>
                            <span>
                              <Check />
                              Midnight ZK devresi doğrulandı
                            </span>
                          </div>

                          {myContribution > 0 && (
                            <Button
                              type="button"
                              className="contribute-button"
                              style={{ marginTop: '14px' }}
                              disabled={busy || !isConnected || refundClaimed[selectedCampaign.id]}
                              onClick={async () => {
                                try {
                                  setBusy(true);
                                  setError('');
                                  setNotice('ZK Nullifier devresiyle gizli iade cüzdana aktarılıyor...');
                                  const res = await claimRefundTransaction(myContribution);
                                  setRefundClaimed((prev) => ({ ...prev, [selectedCampaign.id]: true }));
                                  setLastTx(res);
                                  setNotice(`${formatTNight(myContribution)} tutarındaki gizli iaden Lace cüzdanına aktarıldı ve bakiyene eklendi!`);
                                } catch (err: unknown) {
                                  setError(err instanceof Error ? err.message : 'İade işlemi başarısız oldu.');
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              <Undo2 className="w-4 h-4" />
                              {refundClaimed[selectedCampaign.id]
                                ? 'İade Cüzdana Aktarıldı ✓'
                                : 'Lace Cüzdanına İade Al (ZK Claim)'}
                            </Button>
                          )}
                        </div>
                      )}
                      <p className="notice" role="status" aria-live="polite">
                        {notice}
                      </p>
                    </TabsContent>

                    <TabsContent value="public">
                      <div className="visitor-view">
                        <EyeOff />
                        <h4>
                          Burada sana ait<br />
                          bir tutar yok.
                        </h4>
                        <p>
                          Ziyaretçiler katkı sahiplerini ve kişisel tutarları göremez.{' '}
                          Yalnızca ortak hedefin ilerleyişi doğrulanabilir.
                        </p>
                        <span>
                          <Check />
                          Kişisel bilgiler ZK ile korunur
                        </span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Demo: Süreyi tamamla */}
              <div className="demo-controls">
                <div>
                  <Timer />
                  <p>
                    <strong>All-or-Nothing Kuralı</strong>
                    <span>
                      {selectedCampaign.status === 'success'
                        ? 'Hedef %100 tamamlandı; fonlar kampanya sahibine açıldı.'
                        : 'Süre dolduğunda hedef %100 ise fon aktarımı, değilse tüm katılımcılara gizli iade.'}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateCampaignStatus(
                      selectedCampaign.id,
                      selectedCampaign.raisedAmount >= selectedCampaign.targetAmount ? 'success' : 'failed'
                    );
                    setNotice('');
                    setError('');
                  }}
                  disabled={selectedCampaign.status !== 'active' || busy}
                >
                  Süreyi tamamla &amp; Kontrol Et
                  <ArrowUpRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="demo-disclaimer">
        <LockKeyhole />
        Midnight Network (Preview) &amp; Lace Wallet entegrasyonu. Zero-Knowledge Compact devreleri ile gizli mutabakat protokolü.
      </p>
    </section>
  );
}




export function Landing() {
  const [menu, setMenu] = useState(false);

  return (
    <div className="cinematic-page">
      <CinematicBackdrop />
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <header className="site-header section-wrap">
        <Brand />
        <nav aria-label="Ana gezinme" className={menu ? 'nav-links is-open' : 'nav-links'}>
          <a href="#how" onClick={() => setMenu(false)}>
            Nasıl çalışır?
          </a>
          <a href="#campaigns" onClick={() => setMenu(false)}>
            Kampanyalar
          </a>
          <a href="#privacy" onClick={() => setMenu(false)}>
            Gizlilik
          </a>
          <a href="#faq" onClick={() => setMenu(false)}>
            Sorular
          </a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <HeaderWalletButton />
          <Button
            variant="ghost"
            size="icon"
            className="menu-toggle"
            aria-expanded={menu}
            aria-label={menu ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      <main id="main">
        <section className="cinematic-intro" aria-label="Cairn ile ortak bir hedefe">
        <div className="hero">
          <div className="hero-copy">
            <h1>
              Hedef ortak.<br />
              <span>Katkın sana özel.</span>
            </h1>
            <p>
              İnandığın fikri destekle. Katkın gizli kalsın.<br />
              Midnight Network üzerinde ZK gücüyle: hedef gerçekleşsin ya da katkın sana geri dönsün.
            </p>
            <div className="hero-actions">
              <Button asChild className="primary-cta">
                <a href="#campaigns">
                  Kampanyaları Keşfet
                  <ArrowUpRight />
                </a>
              </Button>
              <a className="text-link" href="#how">
                Nasıl çalışır?
                <ArrowRight />
              </a>
            </div>
          </div>
          <div className="story-panel story-private" aria-hidden="true">
            <h2>Katkıların gizli.<br/><span>Etkisi hepimize ait.</span></h2>
            <p>Kimin ne kadar verdiği değil,<br/>birlikte neyi mümkün kıldığımız görünür.</p>
          </div>
          <div className="story-panel story-outcome" aria-hidden="true">
            <h2>Hedef gerçekleşir.<br/><span>Ya da katkın geri döner.</span></h2>
            <p>Tek bir ortak hedef.<br/>Herkes için baştan belli olan bir kural.</p>
          </div>
        </div>
        </section>

        <div className="principle-band section-wrap">
          <p>
            <LockKeyhole />
            <span>
              Katkıların <strong>gizli.</strong>
            </span>
          </p>
          <p>
            <Eye />
            <span>
              İlerlemen <strong>görünür.</strong>
            </span>
          </p>
          <p>
            <ShieldCheck />
            <span>
              Sonuç <strong>ya hep ya hiç.</strong>
            </span>
          </p>
        </div>

        <CampaignsSection />

        <section id="how" className="how-section section-wrap">
          <div className="section-heading">
            <h2>
              Bir hedef.<br />
              <span>Herkes için aynı kural.</span>
            </h2>
            <p>
              Katılmadan önce koşulları bilirsin.<br />
              Sonuç ne olursa olsun, katkın sana özel kalır.
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="step-icon">
                <Timer />
              </span>
              <h3>Hedef belirlenir.</h3>
              <p>Kampanya sahibi hedef tutarı ve süreyi belirler. Kurallar herkes için baştan bellidir.</p>
            </article>
            <article>
              <span className="step-icon">
                <LockKeyhole />
              </span>
              <h3>Katkılar gizli kalır.</h3>
              <p>Midnight ZK commitment sayesinde bireysel tutarlar zincirde asla ifşa edilmez.</p>
            </article>
            <article>
              <span className="step-icon">
                <ShieldCheck />
              </span>
              <h3>Sonuç koşula bağlıdır.</h3>
              <p>Süre sonunda hedef tamamsa fon aktarılır. Değilse Lace cüzdanına gizlice iade edilir.</p>
            </article>
          </div>
        </section>

        <section id="privacy" className="privacy-section section-wrap">
          <div className="privacy-copy">
            <LockKeyhole className="section-symbol" />
            <h2>
              Bir fikre destek olmak,<br />
              <span>ifşa olmak değildir.</span>
            </h2>
            <p>
              Midnight sıfır bilgi yaklaşımı, bir katkının geçerli olduğunu tutarını açığa çıkarmadan kanıtlar.
            </p>
            <a href="#faq" className="text-link">
              Gizlilik hakkında
              <ArrowRight />
            </a>
          </div>
          <div className="visibility-list">
            <div>
              <Eye />
              <h3>Herkese açık</h3>
              <p>Kampanya hedefi ve süresi</p>
              <p>Süre boyunca toplam ilerleme yüzdesi</p>
              <p>Süre sonunda başarılı / başarısız sonucu</p>
            </div>
            <div>
              <EyeOff />
              <h3>Sana özel</h3>
              <p>Bireysel katkı tutarın</p>
              <p>Lace cüzdanına ait katkı kaydı</p>
              <p>Varsa kişisel iade tutarın</p>
            </div>
          </div>
        </section>

        <section id="faq" className="faq-section section-wrap">
          <h2>Aklındaki sorular.</h2>
          <Accordion type="single" collapsible className="faq-list">
            {faqs.map(([question, answer], i) => (
              <AccordionItem key={question} value={`faq-${i}`}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="site-footer section-wrap">
        <div>
          <Brand />
          <p>Ortak hedefler. Özel katkılar.</p>
        </div>
        <span>
          Midnight Network · Confidential Crowdfunding<br />
          RiseIn Moonshots Hackathon
        </span>
        <a className="text-link" href="#campaigns">
          Kampanyaları Keşfet
          <ArrowUpRight />
        </a>
      </footer>
    </div>
  );
}
