/**
 * Cairn Compact Smart Contract Client & ZK Simulator
 * Compatible with Midnight JS & Lace Wallet
 */

export interface CairnState {
  organizer: string;
  target: bigint;
  deadline: number;
  totalRaised: bigint;
  isFinalized: boolean;
  isSuccess: boolean;
  commitments: Set<string>;
  nullifiers: Set<string>;
}

export interface ContributionReceipt {
  commitment: string;
  amount: bigint;
  salt: string;
  contributorPk: string;
  timestamp: number;
}

export interface RefundReceipt {
  nullifier: string;
  amount: bigint;
  contributorPk: string;
  timestamp: number;
}

// Güvenli ZK hash simülatörü (Poseidon / SHA-256 standardı)
async function hashBytes(...inputs: string[]): Promise<string> {
  const enc = new TextEncoder();
  const buffer = enc.encode(inputs.join(':'));
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  return `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

export class CairnContract {
  state: CairnState;
  private userReceipts: Map<string, ContributionReceipt[]> = new Map();

  constructor(organizer: string, targetCents: bigint = BigInt(10000), durationHours: number = 120) {
    this.state = {
      organizer,
      target: targetCents,
      deadline: Date.now() + durationHours * 3600 * 1000,
      totalRaised: BigInt(0),
      isFinalized: false,
      isSuccess: false,
      commitments: new Set(),
      nullifiers: new Set(),
    };
  }

  // 1. ZK Commitment Hesaplama: H(amount || salt || pk)
  async computeCommitment(amount: bigint, salt: string, contributorPk: string): Promise<string> {
    return hashBytes('commitment', amount.toString(), salt, contributorPk);
  }

  // 2. Nullifier Hesaplama: H(salt || pk) - Çift iadeyi önler
  async computeNullifier(salt: string, contributorPk: string): Promise<string> {
    return hashBytes('nullifier', salt, contributorPk);
  }

  // 3. Gizli Katkı Yap (ZK Circuit: contribute)
  async contribute(
    amount: bigint,
    contributorPk: string,
    providedSalt?: string
  ): Promise<ContributionReceipt> {
    if (this.state.isFinalized) {
      throw new Error('Kampanya zaten sona erdi.');
    }
    if (amount <= BigInt(0)) {
      throw new Error('Katkı tutarı sıfırdan büyük olmalıdır.');
    }
    if (this.state.totalRaised + amount > this.state.target) {
      throw new Error('Bu katkı hedef tutarı aşıyor.');
    }

    const salt = providedSalt || `salt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const commitment = await this.computeCommitment(amount, salt, contributorPk);

    if (this.state.commitments.has(commitment)) {
      throw new Error('Bu taahhüt zaten mevcut.');
    }

    // State güncelleme
    this.state.commitments.add(commitment);
    this.state.totalRaised += amount;

    const receipt: ContributionReceipt = {
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

  // 4. Süreyi Tamamla & Karar Ver (ZK Circuit: finalize)
  finalize(): { isFinalized: boolean; isSuccess: boolean } {
    if (this.state.isFinalized) {
      throw new Error('Kampanya zaten finalize edildi.');
    }

    this.state.isFinalized = true;
    this.state.isSuccess = this.state.totalRaised >= this.state.target;

    return {
      isFinalized: this.state.isFinalized,
      isSuccess: this.state.isSuccess,
    };
  }

  // 5. Gizli İade Al (ZK Circuit: claim_refund)
  async claimRefund(receipt: ContributionReceipt): Promise<RefundReceipt> {
    if (!this.state.isFinalized) {
      throw new Error('Kampanya henüz finalize edilmedi.');
    }
    if (this.state.isSuccess) {
      throw new Error('Kampanya başarılı olduğu için iade yapılamaz.');
    }

    // Taahhüdün geçerliliğini doğrula
    const expectedCommitment = await this.computeCommitment(
      receipt.amount,
      receipt.salt,
      receipt.contributorPk
    );
    if (!this.state.commitments.has(expectedCommitment)) {
      throw new Error('Geçersiz veya bulunamayan taahhüt.');
    }

    // Nullifier üret
    const nullifier = await this.computeNullifier(receipt.salt, receipt.contributorPk);
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

  // 6. Başarılıysa Fonları Çek (ZK Circuit: payout)
  payout(callerPk: string): bigint {
    if (!this.state.isFinalized) {
      throw new Error('Kampanya henüz finalize edilmedi.');
    }
    if (!this.state.isSuccess) {
      throw new Error('Kampanya hedefe ulaşamadığı için fon çekilemez.');
    }
    if (callerPk !== this.state.organizer) {
      throw new Error('Yalnızca kampanya sahibi fonları çekebilir.');
    }

    return this.state.totalRaised;
  }

  // Kullanıcının kayıtlı makbuzları
  getUserReceipts(userPk: string): ContributionReceipt[] {
    return this.userReceipts.get(userPk) || [];
  }
}
