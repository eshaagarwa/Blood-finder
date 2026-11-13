import { BloodGroup, UrgencyTier } from '../types/lifeline';

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export interface BloodCompatibilityInfo {
  title: string;
  canReceiveFrom: BloodGroup[];
  canDonateTo: BloodGroup[];
  summary: string;
}

export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodCompatibilityInfo> = {
  'A+': {
    title: 'A RhD Positive',
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    canDonateTo: ['A+', 'AB+'],
    summary: 'Can receive A+, A-, O+, or O-. Common regional group.',
  },
  'A-': {
    title: 'A RhD Negative',
    canReceiveFrom: ['A-', 'O-'],
    canDonateTo: ['A+', 'A-', 'AB+', 'AB-'],
    summary: 'Can receive A- or O- only. Rh-negative reserve requires priority allocation.',
  },
  'B+': {
    title: 'B RhD Positive',
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    canDonateTo: ['B+', 'AB+'],
    summary: 'Can receive B+, B-, O+, or O-. High regional availability across NCR.',
  },
  'B-': {
    title: 'B RhD Negative',
    canReceiveFrom: ['B-', 'O-'],
    canDonateTo: ['B+', 'B-', 'AB+', 'AB-'],
    summary: 'Can receive B- or O- only. Prioritizes exact B- donors before O- universal reserve.',
  },
  'AB+': {
    title: 'Universal Red Blood Recipient',
    canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    canDonateTo: ['AB+'],
    summary: 'Universal Red Blood Recipient. Can receive any ABO/Rh group (AB+ preferred first).',
  },
  'AB-': {
    title: 'AB RhD Negative',
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    canDonateTo: ['AB+', 'AB-'],
    summary: 'Rare Rh-negative group. Can receive AB-, A-, B-, or O-.',
  },
  'O+': {
    title: 'O RhD Positive',
    canReceiveFrom: ['O+', 'O-'],
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    summary: 'Can receive O+ or O-. High-demand emergency trauma transfusion group.',
  },
  'O-': {
    title: 'Universal Red Blood Donor',
    canReceiveFrom: ['O-'],
    canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    summary: 'Universal Red Blood Donor. Can only receive O-.',
  },
};

export function isCompatibleDonor(donorGroup: BloodGroup, requestedGroup: BloodGroup): boolean {
  return BLOOD_COMPATIBILITY[requestedGroup].canReceiveFrom.includes(donorGroup);
}

export function getCompatibilityAlertText(group: BloodGroup, unitsLeft: number): {
  headline: string;
  warning: string | null;
  isCriticalLow: boolean;
} {
  const info = BLOOD_COMPATIBILITY[group];
  const isCriticalLow = unitsLeft <= 6;
  const compatibleList = info.canReceiveFrom.join(', ');

  if (isCriticalLow) {
    return {
      headline: info.summary,
      warning: `(Critical reserve low! Compatible with ${compatibleList} only; algorithm will also query surrounding city clusters).`,
      isCriticalLow: true,
    };
  }

  return {
    headline: info.summary,
    warning: `(Compatible donor pool: ${compatibleList} — ${unitsLeft}u verified in regional buffer).`,
    isCriticalLow: false,
  };
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function estimateEtaMinutes(distanceKm: number, urgency: UrgencyTier): number {
  const speedFactor = urgency === 'Critical' ? 1.9 : urgency === 'Urgent' ? 2.4 : 3.0;
  return Math.max(6, Math.round(distanceKm * speedFactor + 4));
}

export function formatTimeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
