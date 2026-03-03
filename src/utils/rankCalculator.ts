// Rank calculator — converts score to rank title and info

import { RANK_TIERS } from './constants';

export interface RankInfo {
    title: string;
    icon: string;
    color: string;
    minScore: number;
    nextRankTitle?: string;
    nextRankScore?: number;
    progress: number; // 0-1 progress to next rank
}

export function getRankInfo(score: number): RankInfo {
    let currentTier = RANK_TIERS[0];
    let nextTier: typeof RANK_TIERS[0] | undefined;

    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (score >= RANK_TIERS[i].minScore) {
            currentTier = RANK_TIERS[i];
            nextTier = RANK_TIERS[i + 1];
            break;
        }
    }

    let progress = 1;
    if (nextTier) {
        const range = nextTier.minScore - currentTier.minScore;
        const achieved = score - currentTier.minScore;
        progress = Math.min(achieved / range, 1);
    }

    return {
        title: currentTier.title,
        icon: currentTier.icon,
        color: currentTier.color,
        minScore: currentTier.minScore,
        nextRankTitle: nextTier?.title,
        nextRankScore: nextTier?.minScore,
        progress,
    };
}
