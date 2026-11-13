import React, { useMemo, useState } from 'react';
import {
  Ambulance,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Globe2,
  MapPin,
  Phone,
  Radio,
  Send,
  ShieldCheck,
  Target,
} from 'lucide-react';
import {
  Donor,
  DonorResponseStatus,
  EmergencyRequest,
  HospitalHub,
} from '../types/lifeline';
import {
  BLOOD_COMPATIBILITY,
  calculateDistanceKm,
  estimateEtaMinutes,
  formatTimeAgo,
  isCompatibleDonor,
} from '../utils/compatibility';

interface MatchingResultViewProps {
  requests: EmergencyRequest[];
  selectedRequestId: string;
  onSelectRequestId: (id: string) => void;
  hospitals: HospitalHub[];
  donors: Donor[];
  onPingDonor: (donorId: string, requestId: string) => void;
  onUpdateDonorStatus: (
    donorId: string,
    status: DonorResponseStatus,
    requestId: string
  ) => void;
  onConfirmUnitDelivered: (donorId: string, requestId: string) => void;
  onBroadcastWave: (requestId: string) => void;
  onOpenReceipt: (request: EmergencyRequest) => void;
  onGoToRequestForm: () => void;
}

type MatchFilter = 'all' | 'exact' | 'responded';

export const MatchingResultView: React.FC<MatchingResultViewProps> = ({
  requests,
  selectedRequestId,
  onSelectRequestId,
  hospitals,
  donors,
  onPingDonor,
  onUpdateDonorStatus,
  onConfirmUnitDelivered,
  onBroadcastWave,
  onOpenReceipt,
  onGoToRequestForm,
}) => {
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [localCityOnly, setLocalCityOnly] = useState<boolean>(false);
  const [focusedDonorId, setFocusedDonorId] = useState<string | null>(null);

  const activeRequest =
    requests.find((r) => r.id === selectedRequestId) || requests[0];

  const requestingHospital = useMemo(
    () =>
      hospitals.find((h) => h.id === activeRequest?.hospitalId) || hospitals[0],
    [hospitals, activeRequest]
  );

  const compatibleGroups = activeRequest
    ? BLOOD_COMPATIBILITY[activeRequest.bloodGroup].canReceiveFrom
    : [];

  const rankedDonors = useMemo(() => {
    if (!activeRequest || !requestingHospital) return [];

    const statusWeight: Record<DonorResponseStatus, number> = {
      'En Route': 0,
      Confirmed: 1,
      Pinged: 2,
      Standby: 3,
      Delivered: 4,
    };

    return donors
      .filter((d) => isCompatibleDonor(d.bloodGroup, activeRequest.bloodGroup))
      .map((d) => {
        const distanceKm = calculateDistanceKm(
          requestingHospital.lat,
          requestingHospital.lng,
          d.lat,
          d.lng
        );
        const etaMins = estimateEtaMinutes(distanceKm, activeRequest.urgency);
        const isExact = d.bloodGroup === activeRequest.bloodGroup;
        const isSameCity =
          d.city.toLowerCase() === requestingHospital.city.toLowerCase();
        return {
          ...d,
          distanceKm,
          etaMins,
          isExact,
          isSameCity,
        };
      })
      .sort((a, b) => {
        if (a.eligibility !== b.eligibility) {
          return a.eligibility === 'Eligible' ? -1 : 1;
        }
        if (a.isSameCity !== b.isSameCity) {
          return a.isSameCity ? -1 : 1;
        }
        const statusDiff =
          statusWeight[a.responseStatus] - statusWeight[b.responseStatus];
        if (statusDiff !== 0) return statusDiff;
        if (a.isExact !== b.isExact) return a.isExact ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      });
  }, [donors, activeRequest, requestingHospital]);

  const filteredDonors = useMemo(() => {
    return rankedDonors.filter((d) => {
      if (localCityOnly && !d.isSameCity) return false;
      if (filter === 'exact') return d.isExact;
      if (filter === 'responded') {
        return (
          d.responseStatus === 'Confirmed' ||
          d.responseStatus === 'En Route' ||
          d.responseStatus === 'Pinged' ||
          d.responseStatus === 'Delivered'
        );
      }
      return true;
    });
  }, [rankedDonors, filter, localCityOnly]);

  if (!activeRequest || !requestingHospital) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10">
          <Target className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            No Active Blood Dispatch Selected
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Submit an emergency request to trigger live donor radius matching.
          </p>
          <button
            type="button"
            onClick={onGoToRequestForm}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#F03E3E] text-white text-sm font-semibold cursor-pointer"
          >
            Create Emergency Request
          </button>
        </div>
      </div>
    );
  }

  // Convert lat/lng delta around active hub to radar SVG coordinates
  const mapMaxKm = 20;
  const projectPoint = (lat: number, lng: number) => {
    const dLatKm = (lat - requestingHospital.lat) * 111;
    const dLngKm =
      (lng - requestingHospital.lng) *
      111 *
      Math.cos((requestingHospital.lat * Math.PI) / 180);
    const dist = Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm);
    const clampedRatio = dist > mapMaxKm ? (mapMaxKm * 0.94) / dist : 1;
    const scale = 160 / mapMaxKm;
    const x = 200 + dLngKm * clampedRatio * scale;
    const y = 200 - dLatKm * clampedRatio * scale;
    return { x, y };
  };

  const progressPct = Math.min(
    100,
    Math.round(
      (activeRequest.unitsFulfilled / Math.max(1, activeRequest.unitsNeeded)) *
        100
    )
  );

  return (
    <div className="p-5 sm:p-8 max-w-[1220px] mx-auto space-y-6">
      {/* Header & Request Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F03E3E]">
            <Radio className="w-3.5 h-3.5" />
            <span>
              Live Compatibility &amp; Multi-City Matching &bull;{' '}
              {requestingHospital.city}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Matching Result &bull;{' '}
            <span className="font-mono text-[#F03E3E]">{activeRequest.id}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select dispatch request"
            value={activeRequest.id}
            onChange={(e) => onSelectRequestId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-slate-800 focus:outline-none focus:border-[#F03E3E] cursor-pointer"
          >
            {requests.map((req) => (
              <option key={req.id} value={req.id}>
                {req.id} &bull; {req.bloodGroup} ({req.unitsNeeded}u) &bull;{' '}
                {req.status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onOpenReceipt(activeRequest)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12.5px] font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => onBroadcastWave(activeRequest.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F03E3E] hover:bg-[#DC2626] text-white text-[12.5px] font-bold shadow-sm shadow-red-500/20 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Cluster Wave</span>
          </button>
        </div>
      </div>

      {/* Dispatch Telemetry Summary Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 grid grid-cols-2 lg:grid-cols-5 gap-4 items-center">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Target Group
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#F03E3E]">
              {activeRequest.bloodGroup}
            </span>
            <span className="text-[11.5px] text-slate-500">
              Pool: {compatibleGroups.join(', ')}
            </span>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Requesting Hub
          </div>
          <div className="mt-1 text-[13.5px] font-bold text-slate-900 truncate">
            {requestingHospital.name}
          </div>
          <div className="text-[11.5px] text-slate-500 font-mono">
            {requestingHospital.city} &bull; {requestingHospital.licenseId}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Urgency &amp; Age
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[11.5px] font-bold ${
                activeRequest.urgency === 'Critical'
                  ? 'bg-red-50 text-[#F03E3E] border border-red-200'
                  : activeRequest.urgency === 'Urgent'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {activeRequest.urgency}
            </span>
            <span className="text-[12px] text-slate-500 font-mono tabular-nums inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(activeRequest.createdAt)}
            </span>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Units Fulfilled
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {activeRequest.unitsFulfilled}/{activeRequest.unitsNeeded}u
            </span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[90px]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPct >= 100 ? 'bg-emerald-500' : 'bg-[#F03E3E]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Dispatch State
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold ${
                activeRequest.status === 'Fulfilled'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeRequest.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Matching Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive City & Regional Radius Radar */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                {requestingHospital.city} &amp; Regional Radius
              </h2>
              <p className="text-[12px] text-slate-500">
                Centered on {requestingHospital.name} (20 km + Inter-City)
              </p>
            </div>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {rankedDonors.filter((d) => d.eligibility === 'Eligible').length}{' '}
              eligible
            </span>
          </div>

          <div className="relative bg-[#F6F9FD] border border-slate-200/80 rounded-xl overflow-hidden aspect-square">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full select-none"
              role="img"
              aria-label="Donor radius radar around requesting hospital"
            >
              <defs>
                <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F03E3E" stopOpacity="0.10" />
                  <stop offset="70%" stopColor="#2563EB" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F03E3E" stopOpacity="0" />
                  <stop offset="100%" stopColor="#F03E3E" stopOpacity="0.16" />
                </linearGradient>
              </defs>

              <circle cx="200" cy="200" r="180" fill="url(#radar-glow)" />

              {/* Cardinal Coordinates */}
              <line
                x1="20"
                y1="200"
                x2="380"
                y2="200"
                stroke="#CBD5E1"
                strokeWidth="0.75"
                strokeDasharray="3 4"
              />
              <line
                x1="200"
                y1="20"
                x2="200"
                y2="380"
                stroke="#CBD5E1"
                strokeWidth="0.75"
                strokeDasharray="3 4"
              />

              {/* Concentric Distance Rings */}
              {[
                { r: 45, label: '5 km' },
                { r: 90, label: '10 km' },
                { r: 135, label: '15 km' },
                { r: 175, label: '20 km+' },
              ].map((ring) => (
                <g key={ring.label}>
                  <circle
                    cx="200"
                    cy="200"
                    r={ring.r}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    strokeDasharray={ring.r === 175 ? undefined : '4 4'}
                  />
                  <text
                    x="204"
                    y={200 - ring.r + 11}
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                  >
                    {ring.label}
                  </text>
                </g>
              ))}

              {/* Animated Sweep Wedge */}
              {activeRequest.status !== 'Fulfilled' && (
                <g className="animate-radar-sweep">
                  <path
                    d="M 200 200 L 200 25 A 175 175 0 0 1 323 76 Z"
                    fill="url(#sweep-grad)"
                  />
                </g>
              )}

              {/* Partner Hospitals */}
              {hospitals
                .filter((h) => h.id !== requestingHospital.id)
                .map((h) => {
                  const pt = projectPoint(h.lat, h.lng);
                  return (
                    <g key={h.id}>
                      <rect
                        x={pt.x - 4}
                        y={pt.y - 4}
                        width="8"
                        height="8"
                        rx="2"
                        fill="#FFFFFF"
                        stroke="#64748B"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

              {/* Compatible Donor Pins */}
              {filteredDonors.map((donor) => {
                const pt = projectPoint(donor.lat, donor.lng);
                const isFocused = focusedDonorId === donor.id;
                const fill =
                  donor.responseStatus === 'En Route' ||
                  donor.responseStatus === 'Delivered'
                    ? '#10B981'
                    : donor.responseStatus === 'Confirmed'
                      ? '#2563EB'
                      : donor.responseStatus === 'Pinged'
                        ? '#F59E0B'
                        : '#64748B';

                return (
                  <g
                    key={donor.id}
                    onClick={() => setFocusedDonorId(donor.id)}
                    className="cursor-pointer"
                  >
                    {isFocused && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="13"
                        fill="none"
                        stroke="#F03E3E"
                        strokeWidth="2"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isFocused ? 7.5 : 6}
                      fill={fill}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <title>
                      {donor.name} ({donor.bloodGroup}, {donor.city}) &bull;{' '}
                      {donor.distanceKm} km &bull; {donor.responseStatus}
                    </title>
                  </g>
                );
              })}

              {/* Center Active Hospital Hub Pin */}
              <circle
                cx="200"
                cy="200"
                r="14"
                fill="#FEE2E2"
                stroke="#F03E3E"
                strokeWidth="1.5"
              />
              <circle cx="200" cy="200" r="6" fill="#F03E3E" />
            </svg>
          </div>

          {/* Radar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F03E3E]" />
              Active Hub
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              En Route
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Confirmed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Pinged
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Standby
            </span>
          </div>

          {/* Recent Dispatch Log */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Dispatch Event Trail
            </div>
            <ul className="space-y-1.5 text-[12px] text-slate-600 max-h-32 overflow-y-auto pr-1">
              {activeRequest.alertLog.map((entry, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Ranked Compatible Donors */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                Compatible Donors ({filteredDonors.length})
              </h2>
              <p className="text-[12px] text-slate-500">
                Prioritizes {requestingHospital.city} donors first, then
                surrounding city clusters
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLocalCityOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold border transition-colors cursor-pointer ${
                  localCityOnly
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>
                  {localCityOnly
                    ? `${requestingHospital.city} Only`
                    : 'All Cities'}
                </span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'all', label: 'All Compatible' },
                  { id: 'exact', label: `Exact ${activeRequest.bloodGroup}` },
                  { id: 'responded', label: 'Responded' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id as MatchFilter)}
                    className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      filter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredDonors.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-semibold text-slate-700">
                No compatible donors found in this narrow filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLocalCityOnly(false);
                  setFilter('all');
                }}
                className="mt-2 text-xs font-semibold text-[#F03E3E] hover:underline cursor-pointer"
              >
                Expand search to all surrounding cities
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDonors.map((donor, idx) => {
                const isFocused = focusedDonorId === donor.id;
                const isCooldown = donor.eligibility === 'Cooldown';

                return (
                  <div
                    key={donor.id}
                    onClick={() => setFocusedDonorId(donor.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      isFocused
                        ? 'border-[#F03E3E] bg-[#FFF8F8]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            donor.isExact
                              ? 'bg-red-50 text-[#F03E3E] border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {donor.bloodGroup}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              #{idx + 1}
                            </span>
                            <h3 className="text-[14px] font-bold text-slate-900 truncate">
                              {donor.name}
                            </h3>
                            {donor.verified && (
                              <ShieldCheck
                                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                aria-label="Verified Donor"
                              />
                            )}
                            <span
                              className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                                donor.isExact
                                  ? 'bg-red-50 text-[#C92A2A]'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {donor.isExact ? 'Exact Match' : 'Compatible'}
                            </span>
                            {!donor.isSameCity && (
                              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {donor.city} Cluster
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {donor.locality}, {donor.city}
                            </span>
                            <span className="font-mono tabular-nums text-slate-700 font-medium">
                              {donor.distanceKm} km (~{donor.etaMins} min)
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {donor.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            donor.responseStatus === 'En Route'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : donor.responseStatus === 'Delivered'
                                ? 'bg-slate-100 text-slate-700'
                                : donor.responseStatus === 'Confirmed'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : donor.responseStatus === 'Pinged'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {donor.responseStatus}
                        </span>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div
                      className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[11.5px] text-slate-500 font-mono tabular-nums">
                        {donor.donationsCount} prior donations &bull; Last:{' '}
                        {donor.lastDonatedDate} &bull;{' '}
                        <span
                          className={
                            isCooldown
                              ? 'text-amber-600 font-semibold'
                              : 'text-emerald-600 font-semibold'
                          }
                        >
                          {donor.eligibility}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {donor.responseStatus === 'Standby' && (
                          <button
                            type="button"
                            disabled={isCooldown}
                            onClick={() =>
                              onPingDonor(donor.id, activeRequest.id)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F03E3E] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Ping SMS</span>
                          </button>
                        )}

                        {donor.responseStatus === 'Pinged' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateDonorStatus(
                                donor.id,
                                'Confirmed',
                                activeRequest.id
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Confirmed</span>
                          </button>
                        )}

                        {donor.responseStatus === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateDonorStatus(
                                donor.id,
                                'En Route',
                                activeRequest.id
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                          >
                            <Ambulance className="w-3 h-3" />
                            <span>Dispatch En Route</span>
                          </button>
                        )}

                        {(donor.responseStatus === 'En Route' ||
                          donor.responseStatus === 'Confirmed') &&
                          activeRequest.status !== 'Fulfilled' && (
                            <button
                              type="button"
                              onClick={() =>
                                onConfirmUnitDelivered(
                                  donor.id,
                                  activeRequest.id
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>Confirm Unit Received</span>
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
