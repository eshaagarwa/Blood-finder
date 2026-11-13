import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { getCityCoordinates, SUPPORTED_CITIES } from '../data/seedData';
import { BloodGroup, Donor, HospitalHub } from '../types/lifeline';
import { BLOOD_GROUPS, calculateDistanceKm } from '../utils/compatibility';

interface DonorsDirectoryViewProps {
  donors: Donor[];
  activeHub: HospitalHub;
  onAddDonor: (
    donor: Omit<Donor, 'id' | 'responseStatus' | 'donationsCount'>
  ) => void;
  onToggleVerifyDonor: (donorId: string) => void;
  onPingDonorQuick: (donorId: string) => void;
}

export const DonorsDirectoryView: React.FC<DonorsDirectoryViewProps> = ({
  donors,
  activeHub,
  onAddDonor,
  onToggleVerifyDonor,
  onPingDonorQuick,
}) => {
  const [search, setSearch] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<BloodGroup | 'ALL'>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<
    'ALL' | 'Eligible' | 'Cooldown'
  >('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  // Registration form state
  const [name, setName] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [phone, setPhone] = useState<string>('');
  const [cityChoice, setCityChoice] = useState<string>(activeHub.city);
  const [customCity, setCustomCity] = useState<string>('');
  const [locality, setLocality] = useState<string>('');
  const [age, setAge] = useState<number>(28);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [lastDonatedDate, setLastDonatedDate] = useState<string>('2026-04-15');
  const [formError, setFormError] = useState<string>('');

  const availableCities = useMemo(() => {
    const set = new Set<string>(SUPPORTED_CITIES.map((c) => c.city));
    donors.forEach((d) => set.add(d.city));
    set.add(activeHub.city);
    return Array.from(set).sort();
  }, [donors, activeHub.city]);

  const filteredDonors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donors
      .map((d) => ({
        ...d,
        distanceKm: calculateDistanceKm(
          activeHub.lat,
          activeHub.lng,
          d.lat,
          d.lng
        ),
      }))
      .filter((d) => {
        if (
          cityFilter !== 'ALL' &&
          d.city.toLowerCase() !== cityFilter.toLowerCase()
        ) {
          return false;
        }
        if (groupFilter !== 'ALL' && d.bloodGroup !== groupFilter) return false;
        if (
          eligibilityFilter !== 'ALL' &&
          d.eligibility !== eligibilityFilter
        ) {
          return false;
        }
        if (!q) return true;
        return (
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.locality.toLowerCase().includes(q) ||
          d.phone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [donors, activeHub, search, cityFilter, groupFilter, eligibilityFilter]);

  const eligibleCount = donors.filter(
    (d) => d.eligibility === 'Eligible'
  ).length;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCity =
      cityChoice === '__OTHER__' ? customCity.trim() : cityChoice.trim();

    if (!name.trim() || !phone.trim() || !resolvedCity) {
      setFormError('Full name, city, and mobile number are required.');
      return;
    }
    if (age < 18 || age > 65 || weightKg < 50) {
      setFormError('Donor must be 18-65 years old and at least 50 kg.');
      return;
    }

    const baseCoords = getCityCoordinates(resolvedCity);
    onAddDonor({
      name: name.trim(),
      bloodGroup,
      phone: phone.trim(),
      city: resolvedCity,
      locality: locality.trim() || 'Central City Area',
      age,
      weightKg,
      lastDonatedDate,
      eligibility: 'Eligible',
      verified: true,
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.03,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.03,
    });

    setName('');
    setPhone('');
    setLocality('');
    setCustomCity('');
    setFormError('');
    setShowRegisterModal(false);
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1220px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F03E3E]">
            Nationwide Pre-Screened Pool
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Donors Directory ({donors.length})
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {eligibleCount} eligible donors ready across all cities &bull;
            Distances from{' '}
            <span className="font-semibold text-slate-700">
              {activeHub.name} ({activeHub.city})
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCityChoice(activeHub.city);
            setShowRegisterModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F03E3E] hover:bg-[#DC2626] text-white text-[13px] font-bold shadow-md shadow-red-500/20 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Donor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[210px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, area, phone..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
            />
          </div>

          <select
            aria-label="Filter by city"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Cities</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setGroupFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer ${
                groupFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer ${
                  groupFilter === g
                    ? 'bg-[#F03E3E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by eligibility"
            value={eligibilityFilter}
            onChange={(e) =>
              setEligibilityFilter(
                e.target.value as 'ALL' | 'Eligible' | 'Cooldown'
              )
            }
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Eligible">Eligible Only</option>
            <option value="Cooldown">90-Day Cooldown</option>
          </select>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Donor</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">City &amp; Locality</th>
                <th className="py-3 px-4">Last Donation</th>
                <th className="py-3 px-4">Eligibility</th>
                <th className="py-3 px-4">Screening</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredDonors.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-500 text-sm"
                  >
                    No donors found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor) => (
                  <tr
                    key={donor.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">
                        {donor.name}
                      </div>
                      <div className="text-[11.5px] text-slate-500 font-mono tabular-nums inline-flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {donor.phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center justify-center w-10 py-1 rounded-lg bg-red-50 border border-red-200/80 text-[#F03E3E] font-bold text-xs">
                        {donor.bloodGroup}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-semibold inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{donor.city}</span>
                        <span className="text-slate-400 font-normal">&bull;</span>
                        <span className="text-slate-600 font-normal">
                          {donor.locality}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {donor.distanceKm} km from {activeHub.city} hub
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-[12px] text-slate-600">
                      <div>{donor.lastDonatedDate}</div>
                      <div className="text-[11px] text-slate-400">
                        {donor.donationsCount} total units
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          donor.eligibility === 'Eligible'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {donor.eligibility}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleVerifyDonor(donor.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                          donor.verified
                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {donor.verified ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3" />
                            Verify
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        disabled={donor.eligibility === 'Cooldown'}
                        onClick={() => onPingDonorQuick(donor.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                      >
                        Ping Readiness
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Donor Modal */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-donor-title"
        >
          <form
            onSubmit={handleRegisterSubmit}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2
                  id="register-donor-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Register Donor (Any City)
                </h2>
                <p className="text-xs text-slate-500">
                  Adds donor immediately to the nationwide live matching pool.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#C92A2A]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Khanna"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) =>
                      setBloodGroup(e.target.value as BloodGroup)
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#F03E3E]"
                  >
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98110 00000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <select
                    value={cityChoice}
                    onChange={(e) => setCityChoice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__OTHER__">+ Other City...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Indiranagar"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
              </div>

              {cityChoice === '__OTHER__' && (
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Enter City / Town Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="e.g. Surat, Nagpur, Indore..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Age (18-65)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={150}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Last Donated
                  </label>
                  <input
                    type="date"
                    value={lastDonatedDate}
                    onChange={(e) => setLastDonatedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs font-mono focus:outline-none focus:border-[#F03E3E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F03E3E] hover:bg-[#DC2626] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Network</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
