import React, { useMemo, useState } from 'react';
import {
  Ambulance,
  Building2,
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getCityCoordinates } from '../data/seedData';
import { HospitalHub } from '../types/lifeline';
import { calculateDistanceKm } from '../utils/compatibility';

interface HospitalsViewProps {
  hospitals: HospitalHub[];
  activeHubId: string;
  onSelectActiveHub: (hubId: string) => void;
  onToggleVerifyHospital: (hubId: string) => void;
  onAddHospital: (hospital: Omit<HospitalHub, 'id'>) => void;
}

export const HospitalsView: React.FC<HospitalsViewProps> = ({
  hospitals,
  activeHubId,
  onSelectActiveHub,
  onToggleVerifyHospital,
  onAddHospital,
}) => {
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [sector, setSector] = useState<string>('');
  const [licenseId, setLicenseId] = useState<string>('LF-HUB-2026');
  const [traumaLevel, setTraumaLevel] = useState<string>(
    '24/7 Emergency Blood Bank'
  );
  const [contactPhone, setContactPhone] = useState<string>('+91 1800 543 325');

  const activeHub = hospitals.find((h) => h.id === activeHubId) || hospitals[0];

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => set.add(h.city));
    return Array.from(set).sort();
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hospitals.filter((h) => {
      if (cityFilter !== 'ALL' && h.city !== cityFilter) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.sector.toLowerCase().includes(q) ||
        h.licenseId.toLowerCase().includes(q)
      );
    });
  }, [hospitals, cityFilter, search]);

  const handleCreateHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !sector.trim() || !licenseId.trim()) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const coords = getCityCoordinates(trimmedCity);

    onAddHospital({
      name: trimmedName,
      shortName: `${trimmedName.slice(0, 22)} (${trimmedCity})`,
      city: trimmedCity,
      sector: sector.trim(),
      licenseId: licenseId.trim().toUpperCase(),
      verified: true,
      traumaLevel,
      contactPhone: contactPhone.trim(),
      ambulanceBridgeReady: true,
      lat: coords.lat + (Math.random() - 0.5) * 0.02,
      lng: coords.lng + (Math.random() - 0.5) * 0.02,
    });

    setName('');
    setCity('');
    setSector('');
    setShowAddModal(false);
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1220px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F03E3E]">
            All-City Verified Partner Network
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Hospitals &amp; Blood Hubs ({hospitals.length})
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Covering {availableCities.length} cities &mdash; switch active hub or
            add a hospital in any city worldwide.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F03E3E] hover:bg-[#DC2626] text-white text-[13px] font-bold shadow-md shadow-red-500/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Partner Hospital</span>
        </button>
      </div>

      {/* City & Search Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospital, city, license..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
          />
        </div>

        <select
          aria-label="Filter hospitals by city"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Cities ({availableCities.length})</option>
          {availableCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Hospital Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHospitals.map((hub) => {
          const isActive = hub.id === activeHubId;
          const distFromActive =
            activeHub && hub.id !== activeHub.id
              ? calculateDistanceKm(
                  activeHub.lat,
                  activeHub.lng,
                  hub.lat,
                  hub.lng
                )
              : 0;

          return (
            <div
              key={hub.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-2 border-[#F03E3E] shadow-[0_10px_28px_rgba(240,62,62,0.08)]'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-red-50 text-[#F03E3E] border border-red-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleVerifyHospital(hub.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      hub.verified
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {hub.verified ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        Auto-Verified
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3" />
                        Audit Pending
                      </>
                    )}
                  </button>
                </div>

                <h2 className="mt-4 text-[16px] font-bold text-slate-900 leading-snug">
                  {hub.name}
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  {hub.traumaLevel}
                </p>

                <div className="mt-4 space-y-2 text-[12px] text-slate-600 border-t border-slate-100 pt-3.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {hub.sector},{' '}
                      <strong className="text-slate-800">{hub.city}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hub.contactPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-500">
                      Lic:{' '}
                      <strong className="font-mono text-slate-800">
                        {hub.licenseId}
                      </strong>
                    </span>
                    {!isActive && (
                      <span className="font-mono tabular-nums text-slate-500">
                        {distFromActive} km away
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Ambulance className="w-3.5 h-3.5 text-[#F03E3E]" />
                  Bridge Ready
                </span>

                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-[#F03E3E] text-[12px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active Hub
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectActiveHub(hub.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    Set Active Hub
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Partner Hospital Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-hospital-title"
        >
          <form
            onSubmit={handleCreateHospital}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2
                  id="add-hospital-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Onboard Hospital in Any City
                </h2>
                <p className="text-xs text-slate-500">
                  Adds verified facility to the Active Hub selector.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apollo Hospital"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Surat, Indore..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    License Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseId}
                    onChange={(e) => setLicenseId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                  Area / Address *
                </label>
                <input
                  type="text"
                  required
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g. Ring Road, Civil Lines"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Capability Tier
                  </label>
                  <select
                    value={traumaLevel}
                    onChange={(e) => setTraumaLevel(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#F03E3E]"
                  >
                    <option value="24/7 Emergency Blood Bank">
                      24/7 Emergency Blood Bank
                    </option>
                    <option value="Level 1 Trauma & Cardiac Hub">
                      Level 1 Trauma &amp; Cardiac Hub
                    </option>
                    <option value="Obstetric & Surgical Blood Bank">
                      Obstetric &amp; Surgical Blood Bank
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Emergency Desk Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F03E3E] hover:bg-[#DC2626] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Verify &amp; Add Hub</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
