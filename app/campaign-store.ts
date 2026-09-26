'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CampaignItem, ContributionRecord } from './campaigns';

const STORAGE_KEY = 'cairn_campaigns';

/** localStorage'dan kampanyaları yükle */
function loadFromStorage(): CampaignItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CampaignItem[];
  } catch {
    return [];
  }
}

/** localStorage'a kampanyaları kaydet */
function saveToStorage(campaigns: CampaignItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.warn('Kampanyalar localStorage\'a kaydedilemedi:', e);
  }
}

/** Benzersiz kampanya ID'si üret */
function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `cairn-${ts}-${rand}`;
}

/** React hook: localStorage ile senkronize kampanya store */
export function useCampaignStore() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // İlk yüklemede localStorage'dan oku
  useEffect(() => {
    setCampaigns(loadFromStorage());
    setLoaded(true);
  }, []);

  // State değiştiğinde localStorage'a yaz
  useEffect(() => {
    if (loaded) {
      saveToStorage(campaigns);
    }
  }, [campaigns, loaded]);

  /** Yeni kampanya oluştur */
  const createCampaign = useCallback(
    (data: {
      title: string;
      description: string;
      category: CampaignItem['category'];
      targetAmount: number;
      deadlineDays: number;
      creatorAddress: string;
    }): CampaignItem => {
      const newCampaign: CampaignItem = {
        id: generateId(),
        title: data.title,
        description: data.description,
        category: data.category,
        targetAmount: data.targetAmount,
        raisedAmount: 0,
        deadlineDays: data.deadlineDays,
        createdAt: Date.now(),
        creatorAddress: data.creatorAddress,
        contributions: [],
        status: 'active',
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      return newCampaign;
    },
    []
  );

  /** Kampanyaya katkı ekle */
  const addContribution = useCallback(
    (campaignId: string, contribution: ContributionRecord): void => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id !== campaignId) return c;
          const newRaised = c.raisedAmount + contribution.amount;
          return {
            ...c,
            raisedAmount: newRaised,
            contributions: [...c.contributions, contribution],
            status: newRaised >= c.targetAmount ? 'success' : c.status,
          };
        })
      );
    },
    []
  );

  /** Kampanya durumunu güncelle (finalize için) */
  const updateCampaignStatus = useCallback(
    (campaignId: string, status: CampaignItem['status']): void => {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId ? { ...c, status } : c
        )
      );
    },
    []
  );

  return {
    campaigns,
    loaded,
    createCampaign,
    addContribution,
    updateCampaignStatus,
  };
}
