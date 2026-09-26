# Cairn — Confidential All-or-Nothing Crowdfunding

> **Midnight Network · RiseIn "New Moon to Full" Hackathon (Level 3)**  
> Zero-Knowledge Compact Smart Contract & Lace Wallet Integration

---

## 🌙 Proje Özeti (Overview)

**Cairn**, Midnight blockchain üzerinde geliştirilmiş, sıfır bilgi kanıtları (Zero-Knowledge Proofs) ile korunan ilk **"Ya Hep Ya Hiç" (All-or-Nothing)** gizli kitle fonlama protokolüdür.

Geleneksel Web3 bağış ve fonlama platformlarında tüm cüzdan adresleri ve bağış tutarları blok zinciri üzerinde herkes tarafından şeffaf bir şekilde izlenebilir. Bu durum bağışçıları hedefli dolandırıcılıklara, sosyal baskıya ve finansal gözetime açık hale getirir.

**Cairn bu sorunu Midnight'ın gizlilik öncelikli mimarisi ile çözer:**
- **Gizli Katkılar:** Katılımcıların kimlikleri ve bireysel katkı tutarları ZK Taahhütleri (*Commitment*) ile zincirde şifrelenir.
- **Doğrulanabilir Toplam İlerleme:** Herkese açık görünümde yalnızca hedefin yüzde kaçına ulaşıldığı matematiksel olarak doğrulanabilir.
- **All-or-Nothing Güvencesi:** Süre dolduğunda hedef tamamlanmışsa fonlar proje sahibine açılır; hedef tamamlanmamışsa katılımcılar *ZK Nullifier* devresiyle katkılarını cüzdanlarına geri çeker (*refund*).

---

## 🛠️ Teknik Mimari (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                       CAIRN DAPP UI                         │
│  (Next.js · React 19 · TypeScript · Tailwind · Geist Font) │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐  ┌────────────────────────────┐
│      LACE WALLET API        │  │     COMPACT ZK DEVRESİ     │
│   (Midnight Preview Ağ)     │  │   (contract/cairn.compact) │
│ - Shielded / Unshielded Addr│  │ - contribute(amount, salt) │
│ - Canlı tNIGHT & DUST Bakiye│  │ - finalize()               │
│ - On-Chain İşlem Onayı (Tx) │  │ - claim_refund(nullifier)  │
│ - Preview Explorer Bağlantı │  │ - payout(organizer_pk)     │
└─────────────────────────────┘  └────────────────────────────┘
```

### 1. Akıllı Sözleşme (Midnight Compact)
Sözleşme [contract/cairn.compact](file:///Users/resulcetin/Desktop/Cairn/contract/cairn.compact) dosyasında Midnight Compact diliyle yazılmıştır:

- `ledger organizer`: Kampanya sahibinin açık kimliği
- `ledger target`: Hedef fon miktarı (tNIGHT)
- `ledger deadline`: Kampanya bitiş zamanı
- `ledger total_raised`: Süre boyunca toplanan toplam miktar (ZK ile korunur)
- `ledger commitments`: Kayıtlı ZK taahhütleri (`hash(amount, salt, pk)`)
- `ledger nullifiers`: Çift iadeyi engelleyen gizli mühürler (`hash(salt, sk)`)

**Devreler (Circuits):**
1. `contribute`: Katkı miktarını ifşa etmeden taahhüt üretir ve zincire işler.
2. `finalize`: Kampanya süresi dolduğunda sonucu ikili (başarı/başarısızlık) olarak kilitler.
3. `claim_refund`: Başarısızlık durumunda katılımcının parasını nullifier ile geri çekmesini sağlar.
4. `payout`: Başarı durumunda toplanan fonları yalnızca kampanya sahibine aktarır.

### 2. Lace Cüzdan Entegrasyonu
- **Ağ:** Midnight Preview (`TARGET_NETWORK = 'preview'`)
- **Varlıklar:** `tNIGHT` (test token) ve `DUST` (gizli gas ücretleri)
- **API Metotları:** `getUnshieldedBalances()`, `getShieldedAddresses()`, `balanceUnsealedTransaction()`, `submitTransaction()`
- Gerçek cüzdan onay popup'ı ve cüzdan bakiyesinden harcama / iade düşümü senkronizasyonu.

---

## 🚀 Başlangıç ve Çalıştırma (Getting Started)

### Gereksinimler
- **Node.js** `>=22.13.0`
- **Lace Wallet** (Midnight Preview ağı seçili)
- Testnet bakiyesi almak için: [Midnight Preview Faucet](https://faucet.preview.midnight.network)

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Akıllı Sözleşme Testlerini Çalıştırın
Tüm Compact ZK devre mantığı (Hedef tamamlama, Lace cüzdan simülasyonu, ZK Refund ve Nullifier çift harcama koruması) CLI üzerinde test edilebilir:
```bash
npm run test:contract
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda `http://localhost:5173` adresini açın.

### 4. Üretim Derlemesi
```bash
npm run build
```

---

## 💡 Kullanım Akışı (User Journey)

1. **Cüzdanı Bağla:** Sağ üstteki *"Cüzdanı Bağla"* butonuna tıklayarak Lace cüzdanınızı bağlayın.
2. **Kampanya Başlat:** *"Kampanya Oluştur"* butonuna basarak başlık, açıklama, kategori, hedef tNIGHT ve süre belirleyin.
3. **Kampanyayı Yayınla:** Kampanya anında ana sayfadaki listeye düşer ve yerel olarak kalıcı hale gelir.
4. **Gizli Katkı Yap:** Kampanyayı seçip preset (50, 100, 250, 500) veya özel tutar girerek *"Lace ile Gizli Katkı Yap"* butonuna tıklayın.
5. **Cüzdandan Onayla:** Lace onay penceresi açılır, işlem Midnight Preview ağına iletilir ve cüzdan bakiyeniz güncellenir.
6. **İşlem Makbuzu:** Midnight Explorer linki ile işleminizi doğrulayın.
7. **Sonuç Kontrolü:** Kampanya süresi bittiğinde hedef tamamlandıysa fonlar kampanya sahibine geçer; tamamlanmadıysa *"Lace Cüzdanına İade Al (ZK Claim)"* butonu ile katkınızı cüzdanınıza geri çekin!

---

## 📂 Dosya Yapısı

```
├── app/
│   ├── campaigns.ts         # Kampanya & Katkı veri tipleri
│   ├── campaign-store.ts    # localStorage destekli reaktif kampanya store'u
│   ├── landing.tsx          # Ana sayfa, Keşfet, Katkı Paneli, Modal UI
│   ├── wallet-context.tsx   # Lace Wallet API & Midnight Preview entegrasyonu
│   ├── globals.css          # Modern grafit/zümrüt tema ve segmentli barlar
│   └── midnight.d.ts        # Midnight / Lace TypeScript tip tanımları
├── contract/
│   ├── cairn.compact        # Midnight Compact ZK Akıllı Sözleşmesi
│   ├── cairn-contract.ts    # Compact sözleşme mantığı simülasyon motoru
│   └── contract-test.ts     # CLI & Otomatik sözleşme birim testleri
├── scripts/
│   └── run-contract-test.mjs# Test çalıştırma scripti
└── package.json
```

---

## 🛡️ Gizlilik ve Güvenlik Taahhüdü

- **Sıfır İtibar İfşası:** Katılımcıların cüzdan adresleri ve katkı miktarları açık blok gezginlerinde görüntülenemez.
- **Matematiksel İade Garantisi:** İadeler bir merkezi otoriteye değil, Compact ZK Nullifier mantığına bağlıdır.
- **All-or-Nothing Kuralı:** Hedefi aşan veya eksik kalan fonların kötüye kullanımı engellenir.
