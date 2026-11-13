import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Globe2,
  Info,
  Minus,
  Plus,
  Zap,
} from 'lucide-react';
import {
  BloodGroup,
  HospitalHub,
  PatientDetails,
  UrgencyTier,
} from '../types/lifeline';
import {
  BLOOD_GROUPS,
  getCompatibilityAlertText,
} from '../utils/compatibility';

interface EmergencyRequestViewProps {
  activeHub: HospitalHub;
  inventory: Record<BloodGroup, number>;
  selectedGroup: BloodGroup;
  onSelectGroup: (group: BloodGroup) => void;
  onQuickActivateCity: (cityName: string, hospitalName?: string) => void;
  onSubmitRequest: (payload: {
    bloodGroup: BloodGroup;
    unitsNeeded: number;
    urgency: UrgencyTier;
    patientDetails?: PatientDetails;
  }) => void;
}

const URGENCY_OPTIONS: Array<{
  id: UrgencyTier;
  label: string;
  windowLabel: string;
  helper: string;
}> = [
  {
    id: 'Critical',
    label: 'Critical',
    windowLabel: '< 1hr',
    helper: 'Critical triggers sirens & SMS priority alerts.',
  },
  {
    id: 'Urgent',
    label: 'Urgent',
    windowLabel: '< 6 hrs',
    helper: 'Urgent broadcasts priority SMS pings within a 15 km cluster.',
  },
  {
    id: 'Planned',
    label: 'Planned',
    windowLabel: '24+ hrs',
    helper: 'Planned schedules verified blood bank cross-match reservation.',
  },
];

export const EmergencyRequestView: React.FC<EmergencyRequestViewProps> = ({
  activeHub,
  inventory,
  selectedGroup,
  onSelectGroup,
  onQuickActivateCity,
  onSubmitRequest,
}) => {
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [urgency, setUrgency] = useState<UrgencyTier>('Critical');
  const [showPatientDetails, setShowPatientDetails] = useState<boolean>(false);
  const [patientRef, setPatientRef] = useState<string>('');
  const [ageGender, setAgeGender] = useState<string>('');
  const [wardUnit, setWardUnit] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [indication, setIndication] = useState<string>('Trauma / Acute Surgery');

  const [showCityOverride, setShowCityOverride] = useState<boolean>(false);
  const [customCity, setCustomCity] = useState<string>('');
  const [customHospital, setCustomHospital] = useState<string>('');

  const selectedUnitsLeft = inventory[selectedGroup] ?? 0;
  const compatibilityInfo = getCompatibilityAlertText(
    selectedGroup,
    selectedUnitsLeft
  );
  const activeUrgencyMeta =
    URGENCY_OPTIONS.find((opt) => opt.id === urgency) || URGENCY_OPTIONS[0];

  const handleStepUnits = (delta: number) => {
    setUnitsNeeded((prev) => Math.max(1, Math.min(12, prev + delta)));
  };

  const handleApplyCustomLocation = () => {
    if (!customCity.trim()) return;
    onQuickActivateCity(customCity.trim(), customHospital.trim() || undefined);
    setCustomCity('');
    setCustomHospital('');
    setShowCityOverride(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasPatientFields =
      showPatientDetails &&
      (patientRef.trim() ||
        ageGender.trim() ||
        wardUnit.trim() ||
        doctorName.trim());

    onSubmitRequest({
      bloodGroup: selectedGroup,
      unitsNeeded,
      urgency,
      patientDetails: hasPatientFields
        ? {
            patientRef: patientRef.trim() || 'WARD-STAT-01',
            ageGender: ageGender.trim() || 'Adult',
            wardUnit: wardUnit.trim() || 'Emergency Bay',
            doctorName: doctorName.trim() || 'Duty Medical Officer',
            indication,
          }
        : undefined,
    });
  };

  return (
    <div className="min-h-full py-8 px-4 sm:px-8 flex flex-col items-center justify-start">
      {/* Top Priority Hero Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFEAEA] border border-red-200/60 text-[#F03E3E] text-[11px] font-bold tracking-[0.08em] uppercase px-3.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F03E3E]" />
          <span>Priority Emergency Dispatch &bull; All Cities</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-[38px] font-extrabold text-[#F03E3E] tracking-tight leading-tight">
          Need blood urgently?
        </h1>

        <p className="mt-2.5 text-slate-600 text-[14px] sm:text-[15px] leading-relaxed max-w-xl mx-auto">
          Instant hospital-to-donor network available across every city.
          Registered donors are pre-screened; choose the required blood group to
          trigger live nearby matching.
        </p>
      </div>

      {/* Main Clinical Intake Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[770px] mt-7 bg-white rounded-2xl border border-slate-200/80 shadow-[0_14px_40px_rgba(15,23,42,0.06)] p-5 sm:p-8"
      >
        {/* Step 1: Blood Group Grid */}
        <div>
          <label className="block text-[11px] font-bold tracking-[0.07em] text-slate-500 uppercase">
            1. Select Blood Group <span className="text-[#F03E3E]">*</span>
          </label>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 mt-3">
            {BLOOD_GROUPS.map((group) => {
              const unitsLeft = inventory[group] ?? 0;
              const isSelected = selectedGroup === group;
              const isLow = unitsLeft <= 6;

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => onSelectGroup(group)}
                  className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F03E3E] ${
                    isSelected
                      ? 'bg-[#FFF3F3] border-2 border-[#F03E3E] shadow-sm'
                      : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <span
                    className={`text-[18px] font-bold tracking-tight leading-none ${
                      isSelected ? 'text-[#F03E3E]' : 'text-slate-900'
                    }`}
                  >
                    {group}
                  </span>
                  <span
                    className={`mt-1.5 text-[11px] font-medium tabular-nums ${
                      isSelected
                        ? 'text-[#D9480F]'
                        : isLow
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                    }`}
                  >
                    {unitsLeft}u left
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Compatibility Note */}
          <div className="mt-3.5 bg-[#EFF6FF] border border-[#CFE2FF] rounded-xl px-4 py-3 flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5" />
            </div>
            <p className="text-[12.5px] leading-relaxed text-[#1E3A8A]">
              <span className="font-bold">
                Compatibility Note for {selectedGroup}:
              </span>{' '}
              {compatibilityInfo.headline}{' '}
              {compatibilityInfo.warning && (
                <span
                  className={
                    compatibilityInfo.isCriticalLow
                      ? 'font-semibold text-[#C92A2A]'
                      : 'text-[#1D4ED8]'
                  }
                >
                  {compatibilityInfo.warning}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Step 2 & Step 3 Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-6">
          {/* Step 2: Units Needed */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold tracking-[0.07em] text-slate-500 uppercase">
              2. Units Needed
            </label>
            <div className="mt-2.5 border border-slate-200 rounded-xl p-1.5 flex items-center justify-between bg-white h-[56px]">
              <button
                type="button"
                onClick={() => handleStepUnits(-1)}
                disabled={unitsNeeded <= 1}
                aria-label="Decrease units"
                className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-baseline gap-1.5 select-none">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {unitsNeeded}
                </span>
                <span className="text-[12px] text-slate-400 font-medium">
                  {unitsNeeded === 1 ? 'unit' : 'units'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleStepUnits(1)}
                disabled={unitsNeeded >= 12}
                aria-label="Increase units"
                className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Standard transfusion pack: 350ml - 450ml per unit.
            </p>
          </div>

          {/* Step 3: Urgency Tier */}
          <div className="md:col-span-7">
            <label className="block text-[11px] font-bold tracking-[0.07em] text-slate-500 uppercase">
              3. Urgency Tier
            </label>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5 h-[56px]">
              {URGENCY_OPTIONS.map((tier) => {
                const isSelected = urgency === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setUrgency(tier.id)}
                    className={`rounded-xl px-2.5 py-2 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F03E3E] ${
                      isSelected
                        ? 'bg-[#FFF4F4] border-2 border-[#F03E3E]'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`text-[12.5px] font-bold inline-flex items-center gap-1.5 leading-none ${
                        isSelected ? 'text-[#C92A2A]' : 'text-slate-700'
                      }`}
                    >
                      {tier.id === 'Critical' && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-[#F03E3E]' : 'bg-slate-400'
                          }`}
                        />
                      )}
                      {tier.label}
                    </span>
                    <span
                      className={`mt-1 text-[11px] tabular-nums ${
                        isSelected ? 'text-[#E03131]' : 'text-slate-400'
                      }`}
                    >
                      {tier.windowLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {activeUrgencyMeta.helper}
            </p>
          </div>
        </div>

        {/* Step 4: Requesting Hospital Profile + Instant City Override */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-[11px] font-bold tracking-[0.07em] text-slate-500 uppercase">
              4. Requesting Hospital (Auto-Filled Profile)
            </label>
            <button
              type="button"
              onClick={() => setShowCityOverride((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>
                {showCityOverride ? 'Cancel City Change' : 'Request from Another City'}
              </span>
            </button>
          </div>

          {showCityOverride && (
            <div className="mt-2.5 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Any City / Town Name *
                </label>
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="e.g. Surat, Indore, Nagpur..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] focus:outline-none focus:border-[#F03E3E]"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hospital Name (optional)
                </label>
                <input
                  type="text"
                  value={customHospital}
                  onChange={(e) => setCustomHospital(e.target.value)}
                  placeholder="e.g. City General Hospital"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] focus:outline-none focus:border-[#F03E3E]"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleApplyCustomLocation}
                  disabled={!customCity.trim()}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[12px] font-bold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          <div className="mt-2.5 bg-[#F8FAFC] border border-slate-200/90 rounded-xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-slate-900 truncate">
                  {activeHub.name}
                </div>
                <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                  Location: {activeHub.city} &bull; Verified Lic:{' '}
                  <span className="font-mono">{activeHub.licenseId}</span>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                activeHub.verified
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/70'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeHub.verified ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {activeHub.verified ? 'Auto-Verified' : 'Audit Pending'}
            </span>
          </div>
        </div>

        {/* Optional Patient Details Accordion */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowPatientDetails((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#F03E3E] hover:text-[#D62828] cursor-pointer focus:outline-none"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Add patient details (optional)</span>
            {showPatientDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showPatientDetails && (
            <div className="mt-3 p-4 bg-slate-50/80 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Patient Ref / Case ID
                </label>
                <input
                  type="text"
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                  placeholder="e.g. OT-CARDIAC-14"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Age &amp; Sex
                </label>
                <input
                  type="text"
                  value={ageGender}
                  onChange={(e) => setAgeGender(e.target.value)}
                  placeholder="e.g. 42M"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ward / Theatre Unit
                </label>
                <input
                  type="text"
                  value={wardUnit}
                  onChange={(e) => setWardUnit(e.target.value)}
                  placeholder="e.g. Trauma Bay 2"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Attending Physician
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. A. Verma"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Clinical Indication
                </label>
                <select
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
                >
                  <option value="Trauma / Acute Surgery">
                    Trauma / Acute Surgery
                  </option>
                  <option value="Cardiac Bypass / Valve Procedure">
                    Cardiac Bypass / Valve Procedure
                  </option>
                  <option value="Obstetric Hemorrhage Support">
                    Obstetric Hemorrhage Support
                  </option>
                  <option value="Oncology / Thalassemia Transfusion">
                    Oncology / Thalassemia Transfusion
                  </option>
                  <option value="Organ Transplant Cross-Match">
                    Organ Transplant Cross-Match
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          className="mt-5 w-full bg-gradient-to-r from-[#FF4B4B] to-[#F03E3E] hover:from-[#F03E3E] hover:to-[#DC2626] active:scale-[0.995] text-white font-bold text-[15px] py-4 px-6 rounded-xl shadow-[0_10px_24px_rgba(240,62,62,0.28)] transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F03E3E]"
        >
          <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
          <span>Request Blood Now</span>
          <span className="bg-black/15 text-white text-[11px] font-bold font-mono tabular-nums px-2.5 py-1 rounded-full tracking-wide">
            {selectedGroup} &bull; {unitsNeeded}{' '}
            {unitsNeeded === 1 ? 'UNIT' : 'UNITS'}
          </span>
        </button>

        <div className="mt-3 text-center text-[11.5px] text-slate-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            Instant transmission to qualified donors in {activeHub.city} &amp;
            surrounding city clusters.
          </span>
        </div>
      </form>
    </div>
  );
};
