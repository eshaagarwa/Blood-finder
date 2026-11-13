/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, Menu, PhoneCall, Siren, X } from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { DispatchReceiptModal } from './components/DispatchReceiptModal';
import { DonorsDirectoryView } from './components/DonorsDirectoryView';
import { EmergencyRequestView } from './components/EmergencyRequestView';
import { HospitalsView } from './components/HospitalsView';
import { MatchingResultView } from './components/MatchingResultView';
import { Sidebar } from './components/Sidebar';
import {
  getCityCoordinates,
  INITIAL_DONORS,
  INITIAL_HOSPITALS,
  INITIAL_INVENTORY,
  INITIAL_REQUESTS,
} from './data/seedData';
import {
  BloodGroup,
  Donor,
  DonorResponseStatus,
  EmergencyRequest,
  HospitalHub,
  NavScreen,
  PatientDetails,
  RequestStatus,
  ToastMessage,
  UrgencyTier,
} from './types/lifeline';
import { calculateDistanceKm, isCompatibleDonor } from './utils/compatibility';

const STORAGE_KEY = 'lifeline-grid-state-v2';

interface PersistedState {
  activeHubId: string;
  inventory: Record<BloodGroup, number>;
  hospitals: HospitalHub[];
  donors: Donor[];
  requests: EmergencyRequest[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        parsed.activeHubId &&
        parsed.inventory &&
        Array.isArray(parsed.hospitals) &&
        Array.isArray(parsed.donors) &&
        Array.isArray(parsed.requests)
      ) {
        return {
          activeHubId: parsed.activeHubId,
          inventory: parsed.inventory,
          hospitals: parsed.hospitals,
          donors: parsed.donors,
          requests: parsed.requests,
        };
      }
    }
  } catch {
    // Fallback to initial seed state if storage is unavailable or corrupted
  }
  return {
    activeHubId: INITIAL_HOSPITALS[0].id,
    inventory: { ...INITIAL_INVENTORY },
    hospitals: INITIAL_HOSPITALS,
    donors: INITIAL_DONORS,
    requests: INITIAL_REQUESTS,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeScreen, setActiveScreen] = useState<NavScreen>('request');
  const [activeHubId, setActiveHubId] = useState<string>(initial.activeHubId);
  const [inventory, setInventory] = useState<Record<BloodGroup, number>>(
    initial.inventory
  );
  const [hospitals, setHospitals] = useState<HospitalHub[]>(initial.hospitals);
  const [donors, setDonors] = useState<Donor[]>(initial.donors);
  const [requests, setRequests] = useState<EmergencyRequest[]>(
    initial.requests
  );

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    initial.requests[0]?.id ?? ''
  );
  const [receiptRequest, setReceiptRequest] =
    useState<EmergencyRequest | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      const payload: PersistedState = {
        activeHubId,
        inventory,
        hospitals,
        donors,
        requests,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [activeHubId, inventory, hospitals, donors, requests]);

  const activeHub = useMemo(
    () => hospitals.find((h) => h.id === activeHubId) || hospitals[0],
    [hospitals, activeHubId]
  );

  const openRequestCount = useMemo(
    () => requests.filter((r) => r.status !== 'Fulfilled').length,
    [requests]
  );

  const pushToast = (
    title: string,
    description?: string,
    tone: ToastMessage['tone'] = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, description, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const handleChangeHub = (hubId: string) => {
    setActiveHubId(hubId);
    const nextHub = hospitals.find((h) => h.id === hubId);
    if (nextHub) {
      pushToast(
        `Switched Hub: ${nextHub.name}`,
        `Location locked to ${nextHub.city} (${nextHub.licenseId})`,
        'info'
      );
    }
  };

  const handleQuickActivateCity = (
    cityName: string,
    hospitalName?: string
  ) => {
    const cleanCity = cityName.trim();
    if (!cleanCity) return;

    const existing = hospitals.find(
      (h) =>
        h.city.toLowerCase() === cleanCity.toLowerCase() &&
        (!hospitalName ||
          h.name.toLowerCase() === hospitalName.trim().toLowerCase())
    );

    if (existing && !hospitalName) {
      setActiveHubId(existing.id);
      pushToast(
        `Active City: ${existing.city}`,
        `Connected to ${existing.name} (${existing.licenseId})`,
        'info'
      );
      return;
    }

    const coords = getCityCoordinates(cleanCity);
    const hubName =
      hospitalName?.trim() || `${cleanCity} Emergency Blood & Trauma Hub`;
    const code = cleanCity
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const newHub: HospitalHub = {
      id: `hosp-${Date.now().toString().slice(-5)}`,
      name: hubName,
      shortName: `${hubName.slice(0, 22)} (${cleanCity})`,
      city: cleanCity,
      sector: 'Central Emergency District',
      licenseId: `LF-${code}-2026`,
      verified: true,
      traumaLevel: '24/7 Emergency Blood Bank',
      contactPhone: '1800-LIFE-BLOOD',
      ambulanceBridgeReady: true,
      lat: coords.lat,
      lng: coords.lng,
    };

    setHospitals((prev) => [...prev, newHub]);
    setActiveHubId(newHub.id);
    pushToast(
      `Activated ${cleanCity} Emergency Hub`,
      `${newHub.name} ready for immediate all-city matching.`,
      'success'
    );
  };

  const handleSubmitEmergencyRequest = (payload: {
    bloodGroup: BloodGroup;
    unitsNeeded: number;
    urgency: UrgencyTier;
    patientDetails?: PatientDetails;
  }) => {
    const reqNum = Math.floor(9050 + Math.random() * 900);
    const reqId = `REQ-${reqNum}`;

    const eligibleCompatible = donors
      .filter(
        (d) =>
          d.eligibility === 'Eligible' &&
          isCompatibleDonor(d.bloodGroup, payload.bloodGroup)
      )
      .sort(
        (a, b) =>
          calculateDistanceKm(activeHub.lat, activeHub.lng, a.lat, a.lng) -
          calculateDistanceKm(activeHub.lat, activeHub.lng, b.lat, b.lng)
      );
    const topMatches = eligibleCompatible.slice(0, 3).map((d) => d.id);

    const newRequest: EmergencyRequest = {
      id: reqId,
      hospitalId: activeHub.id,
      bloodGroup: payload.bloodGroup,
      unitsNeeded: payload.unitsNeeded,
      unitsFulfilled: 0,
      urgency: payload.urgency,
      status: 'Matching',
      createdAt: new Date().toISOString(),
      patientDetails: payload.patientDetails,
      matchedDonorIds: topMatches,
      alertLog: [
        `${payload.urgency} dispatch ${reqId} initiated by ${activeHub.name} (${activeHub.city}).`,
        `Broadcasted SMS & siren pings to ${eligibleCompatible.length} compatible ${payload.bloodGroup} donors in ${activeHub.city} & surrounding clusters.`,
      ],
    };

    // Ping compatible eligible donors that are currently on Standby
    setDonors((prev) =>
      prev.map((d) =>
        topMatches.includes(d.id) && d.responseStatus === 'Standby'
          ? { ...d, responseStatus: 'Pinged' }
          : d
      )
    );

    setRequests((prev) => [newRequest, ...prev]);
    setSelectedRequestId(reqId);
    setReceiptRequest(newRequest);

    pushToast(
      `Dispatch ${reqId} Broadcasted`,
      `${payload.bloodGroup} • ${payload.unitsNeeded}u (${payload.urgency}) sent to ${eligibleCompatible.length} nearby donors.`,
      'alert'
    );

    // Simulated live response from top matched donor after 1.6s
    if (topMatches[0]) {
      const firstDonorId = topMatches[0];
      window.setTimeout(() => {
        setDonors((prev) =>
          prev.map((d) =>
            d.id === firstDonorId && d.responseStatus === 'Pinged'
              ? { ...d, responseStatus: 'Confirmed' }
              : d
          )
        );
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: r.status === 'Fulfilled' ? 'Fulfilled' : 'Donor En Route',
                  alertLog: [
                    ...r.alertLog,
                    `Live Match Update: Nearest pre-screened donor confirmed readiness.`,
                  ],
                }
              : r
          )
        );
      }, 1600);
    }
  };

  const handlePingDonor = (donorId: string, requestId: string) => {
    const donor = donors.find((d) => d.id === donorId);
    if (!donor) return;

    setDonors((prev) =>
      prev.map((d) =>
        d.id === donorId ? { ...d, responseStatus: 'Pinged' } : d
      )
    );
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              alertLog: [
                ...r.alertLog,
                `Priority SMS ping sent to ${donor.name} (${donor.bloodGroup}).`,
              ],
            }
          : r
      )
    );
    pushToast(
      `SMS Ping Sent to ${donor.name}`,
      `${donor.bloodGroup} donor in ${donor.locality}`,
      'info'
    );

    // Simulated quick donor confirmation after 1.5s
    window.setTimeout(() => {
      setDonors((prev) =>
        prev.map((d) =>
          d.id === donorId && d.responseStatus === 'Pinged'
            ? { ...d, responseStatus: 'Confirmed' }
            : d
        )
      );
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                alertLog: [
                  ...r.alertLog,
                  `${donor.name} confirmed availability via LifeLine SMS.`,
                ],
              }
            : r
        )
      );
    }, 1500);
  };

  const handleUpdateDonorStatus = (
    donorId: string,
    status: DonorResponseStatus,
    requestId: string
  ) => {
    const donor = donors.find((d) => d.id === donorId);
    setDonors((prev) =>
      prev.map((d) => (d.id === donorId ? { ...d, responseStatus: status } : d))
    );
    if (donor) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status:
                  status === 'En Route' && r.status !== 'Fulfilled'
                    ? 'Donor En Route'
                    : r.status,
                alertLog: [
                  ...r.alertLog,
                  `${donor.name} status updated to ${status}.`,
                ],
              }
            : r
        )
      );
    }
  };

  const handleConfirmUnitDelivered = (donorId: string, requestId: string) => {
    const donor = donors.find((d) => d.id === donorId);
    setDonors((prev) =>
      prev.map((d) =>
        d.id === donorId
          ? {
              ...d,
              responseStatus: 'Delivered',
              donationsCount: d.donationsCount + 1,
              lastDonatedDate: new Date().toISOString().slice(0, 10),
              eligibility: 'Cooldown',
            }
          : d
      )
    );

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const nextFulfilled = Math.min(r.unitsNeeded, r.unitsFulfilled + 1);
        const isDone = nextFulfilled >= r.unitsNeeded;
        return {
          ...r,
          unitsFulfilled: nextFulfilled,
          status: isDone ? 'Fulfilled' : r.status,
          alertLog: [
            ...r.alertLog,
            `1 unit (${donor?.bloodGroup ?? r.bloodGroup}) received from ${
              donor?.name ?? 'Donor'
            }. (${nextFulfilled}/${r.unitsNeeded} fulfilled)`,
          ],
        };
      })
    );

    pushToast(
      'Unit Cross-Matched & Logged',
      `Received from ${donor?.name ?? 'donor'} for ${requestId}.`,
      'success'
    );
  };

  const handleBroadcastWave = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const standbyMatches = donors.filter(
      (d) =>
        d.eligibility === 'Eligible' &&
        d.responseStatus === 'Standby' &&
        isCompatibleDonor(d.bloodGroup, req.bloodGroup)
    );

    setDonors((prev) =>
      prev.map((d) =>
        standbyMatches.some((m) => m.id === d.id)
          ? { ...d, responseStatus: 'Pinged' }
          : d
      )
    );

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              alertLog: [
                ...r.alertLog,
                `Expanded cluster wave: Pinged ${standbyMatches.length} additional compatible donors across surrounding cities.`,
              ],
            }
          : r
      )
    );

    pushToast(
      'Multi-City Cluster Wave Sent',
      `Pinged ${standbyMatches.length} additional compatible donors for ${requestId}.`,
      'alert'
    );
  };

  const handleAdjustInventory = (group: BloodGroup, delta: number) => {
    setInventory((prev) => ({
      ...prev,
      [group]: Math.max(0, (prev[group] ?? 0) + delta),
    }));
  };

  const handleUpdateRequestStatus = (
    requestId: string,
    status: RequestStatus
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              unitsFulfilled:
                status === 'Fulfilled' ? r.unitsNeeded : r.unitsFulfilled,
              alertLog: [
                ...r.alertLog,
                `Admin updated request status to ${status}.`,
              ],
            }
          : r
      )
    );
    pushToast(`Request ${requestId}`, `Status updated to ${status}.`, 'info');
  };

  const handleEscalateRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              urgency: 'Critical',
              alertLog: [
                ...r.alertLog,
                `Escalated to Critical (< 1hr) priority siren broadcast.`,
              ],
            }
          : r
      )
    );
    pushToast(
      `Escalated ${requestId}`,
      'Switched to Critical (< 1hr) SMS & siren priority.',
      'alert'
    );
  };

  const handleAddDonor = (
    payload: Omit<Donor, 'id' | 'responseStatus' | 'donationsCount'>
  ) => {
    const newDonor: Donor = {
      ...payload,
      id: `don-${Date.now().toString().slice(-4)}`,
      donationsCount: 1,
      responseStatus: 'Standby',
    };
    setDonors((prev) => [newDonor, ...prev]);
    pushToast(
      'Donor Registered',
      `${newDonor.name} (${newDonor.bloodGroup}) added to ${newDonor.locality}.`,
      'success'
    );
  };

  const handleToggleVerifyDonor = (donorId: string) => {
    setDonors((prev) =>
      prev.map((d) => (d.id === donorId ? { ...d, verified: !d.verified } : d))
    );
  };

  const handlePingDonorQuick = (donorId: string) => {
    const donor = donors.find((d) => d.id === donorId);
    if (!donor) return;
    setDonors((prev) =>
      prev.map((d) =>
        d.id === donorId ? { ...d, responseStatus: 'Pinged' } : d
      )
    );
    pushToast(
      `Readiness Ping Sent`,
      `Dispatched SMS check to ${donor.name} (${donor.bloodGroup}).`,
      'info'
    );
  };

  const handleToggleVerifyHospital = (hubId: string) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === hubId ? { ...h, verified: !h.verified } : h))
    );
  };

  const handleAddHospital = (payload: Omit<HospitalHub, 'id'>) => {
    const newHub: HospitalHub = {
      ...payload,
      id: `hosp-${Date.now().toString().slice(-4)}`,
    };
    setHospitals((prev) => [...prev, newHub]);
    setActiveHubId(newHub.id);
    pushToast(
      'Partner Hub Onboarded',
      `${newHub.name} verified and set as active hub.`,
      'success'
    );
  };

  const handleResetDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveHubId(INITIAL_HOSPITALS[0].id);
    setInventory({ ...INITIAL_INVENTORY });
    setHospitals(INITIAL_HOSPITALS);
    setDonors(INITIAL_DONORS);
    setRequests(INITIAL_REQUESTS);
    setSelectedGroup('O-');
    setSelectedRequestId(INITIAL_REQUESTS[0].id);
    pushToast(
      'Network Data Restored',
      'Reset to default all-city emergency network baseline.',
      'info'
    );
  };

  const handleCopySummary = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    pushToast('Receipt Copied', 'Dispatch summary copied to clipboard.', 'success');
  };

  const receiptHospital = receiptRequest
    ? hospitals.find((h) => h.id === receiptRequest.hospitalId)
    : undefined;

  const receiptCompatibleCount = receiptRequest
    ? donors.filter(
        (d) =>
          d.eligibility === 'Eligible' &&
          isCompatibleDonor(d.bloodGroup, receiptRequest.bloodGroup)
      ).length
    : 0;

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-bold text-base tracking-tight text-slate-900">
            LifeLine <span className="text-[#F03E3E]">GRID</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen('request')}
          className="px-3 py-1.5 rounded-lg bg-[#F03E3E] text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Siren className="w-3.5 h-3.5" />
          <span>Emergency</span>
        </button>
      </header>

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        hospitals={hospitals}
        activeHub={activeHub}
        onChangeHub={handleChangeHub}
        onQuickActivateCity={handleQuickActivateCity}
        openRequestCount={openRequestCount}
        donorCount={donors.length}
        hospitalCount={hospitals.length}
        hasLiveMatching={openRequestCount > 0}
        onTriggerHotline={() =>
          pushToast(
            '24/7 Red Dispatch Bridge: 1800-LIFE-BLOOD',
            `Direct ambulance & blood bank line ready for ${activeHub.name} (${activeHub.city}).`,
            'alert'
          )
        }
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Viewport */}
      <main className="flex-1 min-w-0">
        {activeScreen === 'request' && (
          <EmergencyRequestView
            activeHub={activeHub}
            inventory={inventory}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            onQuickActivateCity={handleQuickActivateCity}
            onSubmitRequest={handleSubmitEmergencyRequest}
          />
        )}

        {activeScreen === 'matching' && (
          <MatchingResultView
            requests={requests}
            selectedRequestId={selectedRequestId}
            onSelectRequestId={setSelectedRequestId}
            hospitals={hospitals}
            donors={donors}
            onPingDonor={handlePingDonor}
            onUpdateDonorStatus={handleUpdateDonorStatus}
            onConfirmUnitDelivered={handleConfirmUnitDelivered}
            onBroadcastWave={handleBroadcastWave}
            onOpenReceipt={(req) => setReceiptRequest(req)}
            onGoToRequestForm={() => setActiveScreen('request')}
          />
        )}

        {activeScreen === 'admin' && (
          <AdminDashboardView
            requests={requests}
            hospitals={hospitals}
            inventory={inventory}
            onAdjustInventory={handleAdjustInventory}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onEscalateRequest={handleEscalateRequest}
            onInspectMatching={(reqId) => {
              setSelectedRequestId(reqId);
              setActiveScreen('matching');
            }}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeScreen === 'donors' && (
          <DonorsDirectoryView
            donors={donors}
            activeHub={activeHub}
            onAddDonor={handleAddDonor}
            onToggleVerifyDonor={handleToggleVerifyDonor}
            onPingDonorQuick={handlePingDonorQuick}
          />
        )}

        {activeScreen === 'hospitals' && (
          <HospitalsView
            hospitals={hospitals}
            activeHubId={activeHubId}
            onSelectActiveHub={handleChangeHub}
            onToggleVerifyHospital={handleToggleVerifyHospital}
            onAddHospital={handleAddHospital}
          />
        )}
      </main>

      {/* Emergency Dispatch Receipt Modal */}
      <DispatchReceiptModal
        request={receiptRequest}
        hospital={receiptHospital}
        compatibleDonorCount={receiptCompatibleCount}
        onClose={() => setReceiptRequest(null)}
        onOpenMatching={() => {
          setReceiptRequest(null);
          setActiveScreen('matching');
        }}
        onCopySummary={handleCopySummary}
      />

      {/* Non-blocking Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white border border-slate-200 shadow-xl rounded-xl p-3.5 flex items-start gap-3"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  toast.tone === 'alert'
                    ? 'bg-red-50 text-[#F03E3E]'
                    : toast.tone === 'success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-blue-50 text-blue-600'
                }`}
              >
                {toast.tone === 'alert' ? (
                  <PhoneCall className="w-4 h-4" />
                ) : toast.tone === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-slate-900">
                  {toast.title}
                </div>
                {toast.description && (
                  <div className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                    {toast.description}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
