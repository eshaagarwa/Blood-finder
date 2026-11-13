import React from 'react';
import {
  Building2,
  CheckCircle2,
  Copy,
  Radio,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import { EmergencyRequest, HospitalHub } from '../types/lifeline';

interface DispatchReceiptModalProps {
  request: EmergencyRequest | null;
  hospital: HospitalHub | undefined;
  compatibleDonorCount: number;
  onClose: () => void;
  onOpenMatching: () => void;
  onCopySummary: (text: string) => void;
}

export const DispatchReceiptModal: React.FC<DispatchReceiptModalProps> = ({
  request,
  hospital,
  compatibleDonorCount,
  onClose,
  onOpenMatching,
  onCopySummary,
}) => {
  if (!request) return null;

  const summaryText = `LifeLine GRID Dispatch ${request.id} | Blood: ${request.bloodGroup} (${request.unitsNeeded}u) | Urgency: ${request.urgency} | Hospital: ${hospital?.name ?? 'Hub'} (${hospital?.licenseId ?? ''}) | Compatible Donors Pinged: ${compatibleDonorCount}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#FF4B4B] to-[#F03E3E] px-6 py-5 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-red-100">
                Emergency Dispatch Receipt
              </span>
              <h2
                id="receipt-title"
                className="text-xl font-bold tracking-tight mt-0.5"
              >
                Broadcast Active &bull;{' '}
                <span className="font-mono tabular-nums">{request.id}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50/70 border border-red-200/70 rounded-xl p-3 text-center">
              <div className="text-[10.5px] font-bold text-slate-500 uppercase">
                Blood Group
              </div>
              <div className="text-xl font-extrabold text-[#F03E3E] mt-1">
                {request.bloodGroup}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[10.5px] font-bold text-slate-500 uppercase">
                Quantity
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {request.unitsNeeded}u
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[10.5px] font-bold text-slate-500 uppercase">
                Urgency
              </div>
              <div className="text-sm font-bold text-slate-900 mt-2">
                {request.urgency}
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-900 truncate">
                  {hospital?.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {hospital?.city} &bull; {hospital?.licenseId}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>

          {request.patientDetails && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[12px] text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">
                Clinical Patient Reference
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                <span>
                  Case ID:{' '}
                  <strong className="font-mono text-slate-900">
                    {request.patientDetails.patientRef}
                  </strong>
                </span>
                <span>
                  Ward:{' '}
                  <strong className="text-slate-900">
                    {request.patientDetails.wardUnit}
                  </strong>
                </span>
                <span>
                  Physician:{' '}
                  <strong className="text-slate-900">
                    {request.patientDetails.doctorName}
                  </strong>
                </span>
                <span>
                  Indication:{' '}
                  <strong className="text-slate-900">
                    {request.patientDetails.indication}
                  </strong>
                </span>
              </div>
            </div>
          )}

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">
                Priority SMS &amp; Siren Alert Dispatched:
              </span>{' '}
              Queried{' '}
              <span className="font-bold font-mono tabular-nums">
                {compatibleDonorCount}
              </span>{' '}
              pre-screened compatible donors in {hospital?.city ?? 'local'} &amp;
              surrounding city clusters.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onCopySummary(summaryText)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12.5px] font-semibold transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Receipt</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12.5px] font-semibold transition-colors cursor-pointer"
              >
                Stay Here
              </button>
              <button
                type="button"
                onClick={onOpenMatching}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F03E3E] hover:bg-[#DC2626] text-white text-[13px] font-bold shadow-md shadow-red-500/20 transition-colors cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>Open Live Matching</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
