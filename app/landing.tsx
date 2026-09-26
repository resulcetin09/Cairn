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
  RotateCcw,
  Sun,
  Moon,
  Menu,
  X,
  CircleCheck,
  Undo2,
  Layers3,
  Wallet,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { initialCampaign, contributionError, contribute, target } from './campaign';
import { useWallet } from './wallet-context';
import { CinematicBackdrop } from './cinematic';
import {
  INITIAL_CAMPAIGNS,
  formatTNight,
  type CampaignItem,
  type CampaignCategory,
} from './campaigns';
import {
  runAutomatedSuccessScenario,
  runLaceWalletRefundScenario,
  type TestStepLog,
} from '../contract/contract-test';

const money = (cents: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(cents / 100);

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

function CampaignsSection() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [selectedId, setSelectedId] = useState<string>('cairn-02');
  const [categoryFilter, setCategoryFilter] = useState<'TÜMÜ' | CampaignCategory>('TÜMÜ');
  const [amount, setAmount] = useState('100');
  const [view, setView] = useState('personal');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);

  const {
    isConnected,
    connecting,
    shieldedAddress,
    unshieldedAddress,
    formatAddress,
    connect,
  } = useWallet();

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const selectedCampaign = campaigns.find((c) => c.id === selectedId) || campaigns[0];
  const percent = Math.min(100, (selectedCampaign.raisedAmount / selectedCampaign.targetAmount) * 100);
  const success = selectedCampaign.raisedAmount >= selectedCampaign.targetAmount;

  const filteredCampaigns = categoryFilter === 'TÜMÜ'
    ? campaigns
    : campaigns.filter((c) => c.category === categoryFilter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
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
    setBusy(true);
    pending.current = true;

    const delay = isConnected ? 1200 : 700;
    if (isConnected) {
      setNotice('Midnight ZK taahhüdü oluşturuluyor ve Lace ile onaylanıyor...');
    }

    timer.current = setTimeout(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === selectedCampaign.id) {
            const newRaised = c.raisedAmount + num;
            return {
              ...c,
              raisedAmount: newRaised,
              userContribution: c.userContribution + num,
              status: newRaised >= c.targetAmount ? 'success' : 'active',
            };
          }
          return c;
        })
      );
      setNotice(
        isConnected
          ? `${formatTNight(num)} gizli katkın Midnight ağına ZK taahhüdü olarak eklendi.`
          : `${formatTNight(num)} katkın kampanyaya eklendi.`
      );
      setBusy(false);
      pending.current = false;
    }, delay);
  }

  return (
    <section id="campaigns" className="demo-section section-wrap">
      <div className="section-heading">
        <h2>
          Fikirler ortak.<br />
          <span>Katkın sana özel.</span>
        </h2>
        <p>
          Midnight Network üzerinde gizlilik korumalı aktif kampanyaları keşfet.<br />
          ZK taahhüdü ile destek ol; hedef gerçekleşsin ya da katkın sana geri dönsün.
        </p>
      </div>

      {/* Kategori Filtreleme Barı */}
      <div className="campaign-categories-bar">
        {(['TÜMÜ', 'AÇIK KAYNAK', 'ZK GİZLİLİK', 'EKOSİSTEM'] as const).map((cat) => (
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

      {/* Kampanya Kartları Grid'i */}
      <div className="campaigns-explore-grid">
        {filteredCampaigns.map((camp) => {
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
              }}
            >
              <div className="campaign-card-top">
                <span className="campaign-card-tag">{camp.category}</span>
                <span className="campaign-card-time">
                  <Timer className="w-3.5 h-3.5" />
                  {camp.deadlineDays > 0 ? `${camp.deadlineDays} gün kaldı` : 'Tamamlandı'}
                </span>
              </div>

              <h4 className="campaign-card-title">{camp.title}</h4>
              <p className="campaign-card-desc">{camp.description}</p>

              {/* Mini Segmented Bar */}
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
        })}
      </div>

      {/* Seçili Kampanyanın İnteraktif Detay & Katkı Paneli */}
      <div className="demo-shell">
        <div className="demo-top">
          <span className="demo-label">
            <span className="status-dot" />
            Seçili Kampanya: <strong>{selectedCampaign.title}</strong>
          </span>
          {isConnected ? (
            <span className="sample-note connected-note">
              <span className="wallet-live-dot" />
              Lace Aktif: <strong>{formatAddress(shieldedAddress || unshieldedAddress)}</strong> (Midnight Preview)
            </span>
          ) : (
            <span className="sample-note">Lace Cüzdanını Bağlayarak Doğrudan Katılabilirsin</span>
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
                        <div className="wallet-active-badge">
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span>Lace Cüzdanın Bağlı:</span>
                          <strong>{formatAddress(shieldedAddress || unshieldedAddress)}</strong>
                        </div>
                      ) : (
                        <div className="wallet-inactive-prompt">
                          <span>Doğrudan Lace cüzdanınla katkı yapabilirsin:</span>
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
                        : 'Katkı tutarın Midnight ZK taahhüdüyle korunur; zincirde yalnızca sen bilirsin.'}
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
                        disabled={busy || success}
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
                          disabled={busy || success}
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
                      disabled={busy || success}
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
                            : 'Gizli Katkı Yap'}
                          <ArrowRight />
                        </>
                      )}
                    </Button>

                    <div className="own-total">
                      <span>Bu kampanyadaki toplam katkın</span>
                      <strong>{formatTNight(selectedCampaign.userContribution)}</strong>
                    </div>
                    <p className="private-note">
                      <ShieldCheck />
                      Bu miktar ziyaretçi görünümünde ve zincir explorer'ında görünmez.
                    </p>
                  </form>
                ) : (
                  <div className="personal-result">
                    <ShieldCheck />
                    <h4>
                      {selectedCampaign.userContribution > 0
                        ? 'Katkın sana geri döndü.'
                        : 'Hedefe ulaşılamadı.'}
                    </h4>
                    <p>
                      {selectedCampaign.userContribution > 0
                        ? 'Gizli iaden Midnight ZK devresi tarafından cüzdanına tanımlandı.'
                        : 'Bu kampanyaya katkı yapmamış görünüyorsun.'}
                    </p>
                    <div className="receipt">
                      <span>İade edilen tutar</span>
                      <strong>{formatTNight(selectedCampaign.userContribution)}</strong>
                      <span>
                        <Check />
                        Midnight iade doğrulaması tamamlandı
                      </span>
                    </div>
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
              setCampaigns((prev) =>
                prev.map((c) =>
                  c.id === selectedCampaign.id
                    ? { ...c, status: c.raisedAmount >= c.targetAmount ? 'success' : 'failed' }
                    : c
                )
              );
              setNotice('');
              setError('');
            }}
            disabled={selectedCampaign.status !== 'active' || busy}
          >
            Süreyi tamamla & Kontrol Et
            <ArrowUpRight />
          </Button>
        </div>
      </div>

      <p className="demo-disclaimer">
        <LockKeyhole />
        Midnight Network (Preview) & Lace Wallet entegrasyonu. Zero-Knowledge Compact devreleri ile gizli mutabakat protokolü.
      </p>
    </section>
  );
}

function ContractTestLab() {
  const { isConnected, shieldedAddress, unshieldedAddress, formatAddress, connect } = useWallet();
  const [scenario, setScenario] = useState<'wallet' | 'automated'>('wallet');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<TestStepLog[]>([]);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');

  const activeWallet = shieldedAddress || unshieldedAddress;

  async function handleRunTest() {
    setRunning(true);
    setLogs([]);
    setTestResult('idle');

    // Gerçekçi animasyon için adımları tek tek gecikmeli basalım
    if (scenario === 'wallet') {
      const walletToUse = activeWallet || 'midnight1_lace_shielded_test_wallet_777';
      const result = await runLaceWalletRefundScenario(walletToUse);
      
      for (let i = 0; i < result.logs.length; i++) {
        await new Promise((r) => setTimeout(r, 450));
        setLogs((prev) => [...prev, result.logs[i]]);
      }
      setTestResult(result.success ? 'success' : 'failed');
    } else {
      const result = await runAutomatedSuccessScenario();
      for (let i = 0; i < result.logs.length; i++) {
        await new Promise((r) => setTimeout(r, 380));
        setLogs((prev) => [...prev, result.logs[i]]);
      }
      setTestResult(result.success ? 'success' : 'failed');
    }

    setRunning(false);
  }

  return (
    <section id="test-lab" className="test-lab-section section-wrap">
      <div className="test-lab-header">
        <div className="test-lab-title">
          <Terminal className="w-5 h-5 text-primary" />
          <h3>Midnight Compact ZK Sözleşme Test Laboratuvarı</h3>
        </div>
        <span className="test-lab-badge">Compact Smart Contract v0.14</span>
      </div>

      <div className="test-lab-box">
        <div className="test-controls-bar">
          <div className="test-scenario-selector">
            <button
              type="button"
              className={`test-tab-btn ${scenario === 'wallet' ? 'active' : ''}`}
              onClick={() => {
                setScenario('wallet');
                setLogs([]);
                setTestResult('idle');
              }}
            >
              <Wallet className="w-4 h-4" />
              Senaryo 2: Kendi Lace Cüzdanınla ZK İade Testi
            </button>
            <button
              type="button"
              className={`test-tab-btn ${scenario === 'automated' ? 'active' : ''}`}
              onClick={() => {
                setScenario('automated');
                setLogs([]);
                setTestResult('idle');
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Senaryo 1: Otomatik Hedef Tamamlama & Payout
            </button>
          </div>

          <div className="test-action-group">
            {scenario === 'wallet' && !isConnected && (
              <button type="button" className="test-connect-hint-btn" onClick={connect}>
                <Wallet className="w-3.5 h-3.5" />
                Lace Cüzdanını Bağla
              </button>
            )}
            <Button
              className="run-test-btn"
              disabled={running}
              onClick={handleRunTest}
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                  Devreler Doğrulanıyor...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5" />
                  Testi Başlat
                </>
              )}
            </Button>
          </div>
        </div>

        {scenario === 'wallet' && (
          <div className="test-wallet-info-bar">
            <span>
              Testte Kullanılacak Kimlik:{' '}
              {isConnected ? (
                <strong className="text-primary font-mono">
                  {formatAddress(activeWallet)} (Bağlı Lace Cüzdanın)
                </strong>
              ) : (
                <em className="text-muted-foreground font-mono">
                  Lace bağlı değilse test adres simülatörü kullanılır
                </em>
              )}
            </span>
          </div>
        )}

        {/* Konsol Çıktı Ekranı */}
        <div className="test-terminal-window">
          <div className="test-terminal-top">
            <div className="terminal-dots">
              <span className="dot-red" />
              <span className="dot-yellow" />
              <span className="dot-green" />
            </div>
            <span className="terminal-title">cairn.compact · Execution Console</span>
            <span className="terminal-network">Midnight Preview</span>
          </div>

          <div className="test-terminal-body">
            {logs.length === 0 && !running && (
              <div className="terminal-placeholder">
                <Terminal className="w-8 h-8 opacity-40 mb-2" />
                <p>Testi başlatmak için yukarıdaki <strong>"Testi Başlat"</strong> butonuna basın.</p>
                <small className="opacity-60">
                  {scenario === 'wallet'
                    ? 'Kendi Lace cüzdanın ile ZK commitment üretilecek, All-or-Nothing süre dolumu simüle edilecek ve kimliğin gizli kalarak Nullifier ile paran iade alınacaktır.'
                    : 'Otomatik olarak 3 katılımcı ile fonlama yapılacak, hedef %100 tamamlanacak ve organizatör payout devresi çalıştırılacaktır.'}
                </small>
              </div>
            )}

            {logs.map((log) => (
              <div key={log.step} className={`terminal-log-entry status-${log.status}`}>
                <div className="log-line-header">
                  <span className="log-step-tag">[ADIM {log.step}]</span>
                  <span className="log-title">{log.title}</span>
                  <span className="log-status-badge">
                    {log.status === 'success' ? 'BAŞARILI' : 'HATA'}
                  </span>
                </div>
                <div className="log-detail-text">└─ {log.detail}</div>
                {log.data && (
                  <div className="log-data-box">
                    {Boolean(log.data.commitment) && (
                      <div>
                        <span className="data-key">ZK Commitment:</span>{' '}
                        <span className="data-val font-mono">{log.data.commitment}</span>
                      </div>
                    )}
                    {Boolean(log.data.salt) && (
                      <div>
                        <span className="data-key">Private Salt (Secret):</span>{' '}
                        <span className="data-val font-mono">{log.data.salt}</span>
                      </div>
                    )}
                    {Boolean(log.data.nullifier) && (
                      <div>
                        <span className="data-key">Nullifier Hash:</span>{' '}
                        <span className="data-val font-mono">{log.data.nullifier}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {running && (
              <div className="terminal-running-indicator">
                <span className="cursor-blink">▋</span> Zero-Knowledge Compact kanıtı oluşturuluyor...
              </div>
            )}

            {testResult === 'success' && (
              <div className="terminal-summary success">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>TEBRİKLER: Tüm ZK devreleri ve akıllı sözleşme kuralları başarıyla doğrulandı!</span>
              </div>
            )}
            {testResult === 'failed' && (
              <div className="terminal-summary failed">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Test adımlarından biri başarısız oldu. Logları inceleyin.</span>
              </div>
            )}
          </div>
        </div>
      </div>
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
          <a href="#test-lab" onClick={() => setMenu(false)}>
            Sözleşme Testi
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
        <ContractTestLab />

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
