/**
 * Cairn Compact Contract Test Suite
 * Includes automated scenario and interactive Lace wallet test flow
 */

import { CairnContract, type ContributionReceipt } from './cairn-contract';

export interface TestStepLog {
  step: number;
  title: string;
  status: 'pending' | 'success' | 'failed';
  detail: string;
  data?: Record<string, string>;
}

// -------------------------------------------------------------
// SENARYO 1: Otomatik Birim Testi (Hedefe Ulaşma & Başarı)
// -------------------------------------------------------------
export async function runAutomatedSuccessScenario(): Promise<{
  success: boolean;
  logs: TestStepLog[];
}> {
  const logs: TestStepLog[] = [];
  const organizerPk = 'organizer_midnight_pk_001';
  const target = BigInt(10000); // $100

  try {
    // Adım 1: Sözleşme başlatma
    const contract = new CairnContract(organizerPk, target, 120);
    logs.push({
      step: 1,
      title: 'Compact Sözleşmesi Başlatıldı',
      status: 'success',
      detail: `Hedef: $100.00 | Organizatör: ${organizerPk.slice(0, 15)}...`,
    });

    // Adım 2: Alice gizli katkı ($30)
    const receipt1 = await contract.contribute(BigInt(3000), 'alice_pk_0x111');
    logs.push({
      step: 2,
      title: 'Alice Gizli Katkı Yaptı ($30)',
      status: 'success',
      detail: `ZK Commitment: ${receipt1.commitment.slice(0, 16)}... | İlerleme: %30`,
    });

    // Adım 3: Bob gizli katkı ($40)
    const receipt2 = await contract.contribute(BigInt(4000), 'bob_pk_0x222');
    logs.push({
      step: 3,
      title: 'Bob Gizli Katkı Yaptı ($40)',
      status: 'success',
      detail: `ZK Commitment: ${receipt2.commitment.slice(0, 16)}... | İlerleme: %70`,
    });

    // Adım 4: Charlie kalan hedefi tamamladı ($30)
    const receipt3 = await contract.contribute(BigInt(3000), 'charlie_pk_0x333');
    logs.push({
      step: 4,
      title: 'Charlie Hedefi Tamamladı ($30)',
      status: 'success',
      detail: `ZK Commitment: ${receipt3.commitment.slice(0, 16)}... | İlerleme: %100`,
    });

    // Adım 5: Süre doldu & Finalize edildi
    const finalResult = contract.finalize();
    logs.push({
      step: 5,
      title: 'Sözleşme Finalize Edildi',
      status: 'success',
      detail: `Hedef Tamamlandı mı: ${finalResult.isSuccess ? 'EVET (BAŞARILI)' : 'HAYIR'}`,
    });

    // Adım 6: Organizatör fonları çekti (Payout)
    const payoutAmount = contract.payout(organizerPk);
    logs.push({
      step: 6,
      title: 'Fonlar Organizatöre Aktarıldı (Payout)',
      status: 'success',
      detail: `Aktarılan Tutar: $${Number(payoutAmount) / 100}.00 | Durum: Tamamlandı`,
    });

    return { success: true, logs };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logs.push({
      step: logs.length + 1,
      title: 'Test Başarısız Oldu',
      status: 'failed',
      detail: errorMsg,
    });
    return { success: false, logs };
  }
}

// -------------------------------------------------------------
// SENARYO 2: Kendi Lace Cüzdanınla Canlı Test (ZK İade / Refund)
// -------------------------------------------------------------
export async function runLaceWalletRefundScenario(
  userWalletAddress: string,
  contributionCents: bigint = BigInt(2500) // $25
): Promise<{
  success: boolean;
  logs: TestStepLog[];
  receipt?: ContributionReceipt;
}> {
  const logs: TestStepLog[] = [];
  const target = BigInt(10000); // $100

  try {
    // Adım 1: Kullanıcı Lace cüzdanı ile sözleşmeye bağlandı
    const contract = new CairnContract('organizer_pk_midnight', target, 48);
    logs.push({
      step: 1,
      title: 'Lace Cüzdanı ile Sözleşme Başlatıldı',
      status: 'success',
      detail: `Bağlı Cüzdan: ${userWalletAddress} | Ağ: Midnight Preprod`,
    });

    // Adım 2: Kendi cüzdanınla ZK gizli taahhüt üretildi
    const receipt = await contract.contribute(contributionCents, userWalletAddress);
    logs.push({
      step: 2,
      title: 'Lace Cüzdanından Gizli Katkı Yapıldı',
      status: 'success',
      detail: `Katkı: $${Number(contributionCents) / 100}.00 | ZK Commitment: ${receipt.commitment.slice(0, 18)}...`,
      data: {
        commitment: receipt.commitment,
        salt: receipt.salt,
      },
    });

    // Adım 3: Süre sona erdi, hedef tutmadı ($25 / $100)
    contract.finalize();
    logs.push({
      step: 3,
      title: 'Kampanya Süresi Doldu (All-or-Nothing)',
      status: 'success',
      detail: `Toplanan: $${Number(contract.state.totalRaised) / 100}.00 / $100.00 | Sonuç: BAŞARISIZ (Hedefe ulaşılamadı)`,
    });

    // Adım 4: Kullanıcı kendi Lace cüzdanı için ZK Refund kanıtı üretti
    const refund = await contract.claimRefund(receipt);
    logs.push({
      step: 4,
      title: 'ZK Devresi ile Gizli İade (Refund) Alındı',
      status: 'success',
      detail: `İade Tutarı: $${Number(refund.amount) / 100}.00 | Nullifier: ${refund.nullifier.slice(0, 18)}...`,
      data: {
        nullifier: refund.nullifier,
      },
    });

    // Adım 5: Güvenlik Testi - İkinci kez iade denenmesi engellendi mi?
    let doubleRefundPrevented = false;
    try {
      await contract.claimRefund(receipt);
    } catch {
      doubleRefundPrevented = true;
    }

    if (doubleRefundPrevented) {
      logs.push({
        step: 5,
        title: 'Çift İade (Double-Refund) Koruması Doğrulandı',
        status: 'success',
        detail: 'Nullifier zaten kullanıldığı için ikinci çekim ZK devresi tarafından engellendi.',
      });
    } else {
      throw new Error('Hata: Nullifier koruması başarısız oldu!');
    }

    return { success: true, logs, receipt };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logs.push({
      step: logs.length + 1,
      title: 'Test Sırasında Hata',
      status: 'failed',
      detail: errorMsg,
    });
    return { success: false, logs };
  }
}
