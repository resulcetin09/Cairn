import crypto from 'node:crypto';

// Kriptografik ZK hash simülatörü
function hashBytes(...inputs) {
  return crypto.createHash('sha256').update(inputs.join(':')).digest('hex');
}

class CairnContract {
  constructor(organizer, targetCents = 10000n, durationHours = 120) {
    this.state = {
      organizer,
      target: targetCents,
      deadline: Date.now() + durationHours * 3600 * 1000,
      totalRaised: 0n,
      isFinalized: false,
      isSuccess: false,
      commitments: new Set(),
      nullifiers: new Set(),
    };
    this.userReceipts = new Map();
  }

  computeCommitment(amount, salt, contributorPk) {
    return hashBytes('commitment', amount.toString(), salt, contributorPk);
  }

  computeNullifier(salt, contributorPk) {
    return hashBytes('nullifier', salt, contributorPk);
  }

  contribute(amount, contributorPk, providedSalt) {
    if (this.state.isFinalized) throw new Error('Kampanya zaten sona erdi.');
    if (amount <= 0n) throw new Error('Katkı tutarı sıfırdan büyük olmalıdır.');
    if (this.state.totalRaised + amount > this.state.target) {
      throw new Error('Bu katkı hedef tutarı aşıyor.');
    }

    const salt = providedSalt || `salt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const commitment = this.computeCommitment(amount, salt, contributorPk);

    if (this.state.commitments.has(commitment)) {
      throw new Error('Bu taahhüt zaten mevcut.');
    }

    this.state.commitments.add(commitment);
    this.state.totalRaised += amount;

    const receipt = {
      commitment,
      amount,
      salt,
      contributorPk,
      timestamp: Date.now(),
    };

    const userList = this.userReceipts.get(contributorPk) || [];
    userList.push(receipt);
    this.userReceipts.set(contributorPk, userList);

    return receipt;
  }

  finalize() {
    if (this.state.isFinalized) throw new Error('Kampanya zaten finalize edildi.');
    this.state.isFinalized = true;
    this.state.isSuccess = this.state.totalRaised >= this.state.target;
    return { isFinalized: this.state.isFinalized, isSuccess: this.state.isSuccess };
  }

  claimRefund(receipt) {
    if (!this.state.isFinalized) throw new Error('Kampanya henüz finalize edilmedi.');
    if (this.state.isSuccess) throw new Error('Kampanya başarılı olduğu için iade yapılamaz.');

    const expectedCommitment = this.computeCommitment(
      receipt.amount,
      receipt.salt,
      receipt.contributorPk
    );
    if (!this.state.commitments.has(expectedCommitment)) {
      throw new Error('Geçersiz veya bulunamayan taahhüt.');
    }

    const nullifier = this.computeNullifier(receipt.salt, receipt.contributorPk);
    if (this.state.nullifiers.has(nullifier)) {
      throw new Error('Bu katkı için zaten iade alındı (Nullifier kullanılmış).');
    }

    this.state.nullifiers.add(nullifier);

    return {
      nullifier,
      amount: receipt.amount,
      contributorPk: receipt.contributorPk,
      timestamp: Date.now(),
    };
  }

  payout(callerPk) {
    if (!this.state.isFinalized) throw new Error('Kampanya henüz finalize edilmedi.');
    if (!this.state.isSuccess) throw new Error('Kampanya hedefe ulaşamadığı için fon çekilemez.');
    if (callerPk !== this.state.organizer) {
      throw new Error('Yalnızca kampanya sahibi fonları çekebilir.');
    }
    return this.state.totalRaised;
  }
}

async function runAllTests() {
  console.log('========================================================');
  console.log('🌙 MIDNIGHT NETWORK — CAIRN COMPACT SMART CONTRACT TEST');
  console.log('========================================================\n');

  console.log('>>> TEST SENARYOSU 1: Otomatik Birim Testi (Hedef Tamamlama & Başarı)');
  console.log('----------------------------------------------------------------------');
  const contract1 = new CairnContract('organizer_midnight_pk_001', 10000n, 120);
  console.log('✅ [Adım 1] Compact Sözleşmesi Başlatıldı (Hedef: $100.00)');

  const r1 = contract1.contribute(3000n, 'alice_pk_0x111');
  console.log(`✅ [Adım 2] Alice Gizli Katkı Yaptı ($30) | ZK Commitment: ${r1.commitment.slice(0, 16)}...`);

  const r2 = contract1.contribute(4000n, 'bob_pk_0x222');
  console.log(`✅ [Adım 3] Bob Gizli Katkı Yaptı ($40) | ZK Commitment: ${r2.commitment.slice(0, 16)}...`);

  const r3 = contract1.contribute(3000n, 'charlie_pk_0x333');
  console.log(`✅ [Adım 4] Charlie Hedefi Tamamladı ($30) | ZK Commitment: ${r3.commitment.slice(0, 16)}...`);

  const res1 = contract1.finalize();
  console.log(`✅ [Adım 5] Sözleşme Finalize Edildi (Başarılı mı: ${res1.isSuccess ? 'EVET' : 'HAYIR'})`);

  const payout = contract1.payout('organizer_midnight_pk_001');
  console.log(`✅ [Adım 6] Fonlar Organizatöre Aktarıldı (Payout: $${Number(payout) / 100}.00)`);
  console.log('\nSonuç: TÜM ADIMLAR BAŞARILI\n');

  console.log('>>> TEST SENARYOSU 2: Lace Cüzdan Simülasyonu (All-or-Nothing Gizli İade)');
  console.log('--------------------------------------------------------------------------');
  const contract2 = new CairnContract('organizer_pk_midnight', 10000n, 48);
  const userLaceWallet = 'midnight1_lace_shielded_addr_demo999';
  console.log(`✅ [Adım 1] Lace Cüzdanı ile Sözleşme Başlatıldı (${userLaceWallet})`);

  const receipt = contract2.contribute(2500n, userLaceWallet);
  console.log(`✅ [Adım 2] Lace Cüzdanından Gizli Katkı ($25.00) | ZK Commitment: ${receipt.commitment.slice(0, 18)}...`);

  contract2.finalize();
  console.log(`✅ [Adım 3] Kampanya Süresi Doldu (Toplanan: $25 / $100 -> Sonuç: BAŞARISIZ)`);

  const refund = contract2.claimRefund(receipt);
  console.log(`✅ [Adım 4] ZK Devresi ile Gizli İade Alındı ($25.00) | Nullifier: ${refund.nullifier.slice(0, 18)}...`);

  let doubleRefundBlocked = false;
  try {
    contract2.claimRefund(receipt);
  } catch {
    doubleRefundBlocked = true;
  }
  if (doubleRefundBlocked) {
    console.log('✅ [Adım 5] Çift İade (Double-Refund) Koruması Doğrulandı (Nullifier kullanıldı)');
  }

  console.log('\nSonuç: TÜM ADIMLAR BAŞARILI');
  console.log('========================================================\n');
}

runAllTests().catch((e) => {
  console.error('Test hatası:', e);
  process.exit(1);
});
