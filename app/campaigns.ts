export type CampaignCategory = 'AÇIK KAYNAK' | 'ZK GİZLİLİK' | 'TOPLULUK FONU' | 'EKOSİSTEM';

export interface ContributionRecord {
  address: string;       // Katkı yapan cüzdan adresi
  amount: number;        // tNIGHT cinsinden
  txHash: string;        // İşlem hash'i
  timestamp: number;     // Katkı zamanı
}

export interface CampaignItem {
  id: string;
  title: string;
  category: CampaignCategory;
  description: string;
  creatorAddress: string;       // Kampanyayı oluşturan cüzdan adresi
  targetAmount: number;         // Hedef tNIGHT
  raisedAmount: number;         // Toplanan tNIGHT
  deadlineDays: number;         // Kalan gün (oluşturulurken belirlenen)
  createdAt: number;            // Oluşturulma timestamp'i
  contributions: ContributionRecord[];  // Gerçek katkı kayıtları
  status: 'active' | 'success' | 'failed';
}

export const CAMPAIGN_CATEGORIES: CampaignCategory[] = [
  'AÇIK KAYNAK',
  'ZK GİZLİLİK',
  'TOPLULUK FONU',
  'EKOSİSTEM',
];

export function formatTNight(amount: number): string {
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount)} tNIGHT`;
}

/** Kullanıcının belirli bir kampanyaya yaptığı toplam katkıyı hesapla */
export function getUserContribution(campaign: CampaignItem, walletAddress: string | null): number {
  if (!walletAddress) return 0;
  return campaign.contributions
    .filter((c) => c.address === walletAddress)
    .reduce((sum, c) => sum + c.amount, 0);
}
