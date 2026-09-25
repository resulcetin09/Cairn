export type Campaign = { total: number; own: number; ended: boolean };
export const initialCampaign: Campaign = { total: 6500, own: 0, ended: false };
export const target = 10000;
export function contributionError(input: string, campaign: Campaign): string | null {
  if (campaign.ended) return 'Bu kampanya sona erdi. Yeni bir deneme başlatabilirsin.';
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(input.trim())) return 'Geçerli bir tutar gir. En fazla iki ondalık basamak kullan.';
  const cents = Math.round(Number(input.replace(',', '.')) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) return 'Katkı tutarı sıfırdan büyük olmalı.';
  if (campaign.total + cents > target) return 'Bu katkı hedefi aşıyor. Daha küçük bir tutar gir.';
  return null;
}
export function contribute(campaign: Campaign, input: string): Campaign {
  if (contributionError(input, campaign)) return campaign;
  const cents = Math.round(Number(input.replace(',', '.')) * 100);
  return { ...campaign, total: campaign.total + cents, own: campaign.own + cents };
}
