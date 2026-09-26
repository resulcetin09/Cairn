export type CampaignCategory = 'AÇIK KAYNAK' | 'ZK GİZLİLİK' | 'TOPLULUK FONU' | 'EKOSİSTEM';

export interface CampaignItem {
  id: string;
  title: string;
  category: CampaignCategory;
  organizer: string;
  targetAmount: number; // tNIGHT cinsinden
  raisedAmount: number; // Toplanan tNIGHT
  userContribution: number; // Kullanıcının kişisel katkısı
  deadlineDays: number;
  description: string;
  status: 'active' | 'success' | 'failed';
}

export const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'cairn-01',
    title: 'Midnight ZK Explorer & İndeksleyici',
    category: 'AÇIK KAYNAK',
    organizer: 'midnight1_dev_community_01',
    targetAmount: 5000,
    raisedAmount: 3600,
    userContribution: 0,
    deadlineDays: 4,
    description: 'Midnight Network üzerinde gizlilik korumalı blok ve sözleşme durumlarını doğrulayan açık kaynaklı topluluk gezgini.',
    status: 'active',
  },
  {
    id: 'cairn-02',
    title: 'Cairn Confidential Crowdfunding Protocol',
    category: 'ZK GİZLİLİK',
    organizer: 'midnight1_cairn_core_team',
    targetAmount: 10000,
    raisedAmount: 6500,
    userContribution: 0,
    deadlineDays: 5,
    description: 'Tüm katkıların ZK taahhüdüyle saklandığı, hedefe ulaşılamazsa otomatik ve gizli iade sağlayan ilk all-or-nothing fonlama protokolü.',
    status: 'active',
  },
  {
    id: 'cairn-03',
    title: 'Cardano-Midnight Çapraz Köprü Araçları',
    category: 'EKOSİSTEM',
    organizer: 'midnight1_bridge_lab',
    targetAmount: 3000,
    raisedAmount: 3000,
    userContribution: 0,
    deadlineDays: 0,
    description: 'Cardano native varlıkları ile Midnight shielded tokenları arasında güvenli ve merkeziyetsiz transfer SDK ve CLI paketi.',
    status: 'success',
  },
  {
    id: 'cairn-04',
    title: 'Zero-Knowledge Anonim Oylama Devresi',
    category: 'ZK GİZLİLİK',
    organizer: 'midnight1_zk_researchers',
    targetAmount: 8000,
    raisedAmount: 1800,
    userContribution: 0,
    deadlineDays: 11,
    description: 'Topluluk DAO kararları için seçmen kimliklerini gizli tutan ve matematiksel geçerlilik kanıtı sunan Compact devre kütüphanesi.',
    status: 'active',
  },
];

export function formatTNight(amount: number): string {
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount)} tNIGHT`;
}
