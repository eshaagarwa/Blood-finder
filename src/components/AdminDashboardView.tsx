import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Droplets,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Siren,
} from 'lucide-react';
import {
  BloodGroup,
  EmergencyRequest,
  HospitalHub,
  RequestStatus,
} from '../types/lifeline';
import { BLOOD_GROUPS, formatTimeAgo } from '../utils/compatibility';

interface AdminDashboardViewProps {
  requests: EmergencyRequest[];
  hospitals: HospitalHub[];
  inventory: Record<BloodGroup, number>;
  onAdjustInventory: (group: BloodGroup, delta: number) => void;
  onUpdateRequestStatus: (requestId: string, status: RequestStatus) => void;
  onEscalateRequest: (requestId: string) => void;
  onInspectMatching: (requestId: string) => void;
  onResetDefaults: () => void;
}

type QueueFilter = 'all' | 'open' | 'critical' | 'fulfilled';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  requests,
  hospitals,
  inventory,
  onAdjustInventory,
  onUpdateRequestStatus,
  onEscalateRequest,
  onInspectMatching,
  onResetDefaults,
}) => {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const openCount = requests.filter((r) => r.status !== 'Fulfilled').length;
  const criticalCount = requests.filter(
    (r) => r.status !== 'Fulfilled' && r.urgency === 'Critical'
  ).length;
  const fulfilledCount = requests.filter((r) => r.status === 'Fulfilled').length;
  const totalUnits = Object.values(inventory).reduce((sum, u) => sum + u, 0);
  const lowGroups = BLOOD_GROUPS.filter((g) => (inventory[g] ?? 0) <= 6);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((req) => {
      if (queueFilter === 'open' && req.status === 'Fulfilled') return false;
      if (
        queueFilter === 'critical' &&
        (req.urgency !== 'Critical' || req.status === 'Fulfilled')
      ) {
        return false;
      }
      if (queueFilter === 'fulfilled' && req.status !== 'Fulfilled') {
        return false;
      }

      if (!q) return true;
      const hospital = hospitals.find((h) => h.id === req.hospitalId);
      return (
        req.id.toLowerCase().includes(q) ||
        req.bloodGroup.toLowerCase().includes(q) ||
        (hospital?.name.toLowerCase().includes(q) ?? false) ||
        (req.patientDetails?.patientRef.toLowerCase().includes(q) ?? false)
      );
    });
  }, [requests, queueFilter, searchQuery, hospitals]);

  return (
    <div className="p-5 sm:p-8 max-w-[1220px] mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F03E3E]">
            Network Operations Control
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Admin Dashboard
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Monitor live emergency blood dispatches across all cities and manage
            network unit reserves.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetDefaults}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12px] font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Dispatches
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#F03E3E] font-mono tabular-nums">
              {openCount}
            </span>
            <span className="text-[11.5px] font-medium text-slate-500">
              {fulfilledCount} fulfilled
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Critical (&lt; 1hr)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {criticalCount}
            </span>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-red-600">
              <Siren className="w-3.5 h-3.5" />
              Priority Queue
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Regional Units Ready
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalUnits}u
            </span>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600">
              <Droplets className="w-3.5 h-3.5" />8 Groups
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Low Reserve Alerts
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600 font-mono tabular-nums">
              {lowGroups.length}
            </span>
            <span className="text-[11.5px] font-medium text-slate-500 truncate max-w-[130px]">
              {lowGroups.length > 0 ? lowGroups.join(', ') : 'All healthy'}
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              Emergency Dispatch Queue
            </h2>
            <p className="text-[12px] text-slate-500">
              Real-time hospital requests across Gurugram &amp; NCR hubs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, hospital, group..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-800 focus:outline-none focus:border-[#F03E3E] w-56"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'all', label: 'All' },
                { id: 'open', label: 'Open' },
                { id: 'critical', label: 'Critical' },
                { id: 'fulfilled', label: 'Fulfilled' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilter(tab.id as QueueFilter)}
                  className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-colors cursor-pointer ${
                    queueFilter === tab.id
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Request</th>
                <th className="py-3 px-4">Hospital Hub</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-500 text-sm"
                  >
                    No dispatch requests match your current filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const hospital = hospitals.find((h) => h.id === req.hospitalId);
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-slate-900">
                          {req.id}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {formatTimeAgo(req.createdAt)}
                          {req.patientDetails?.patientRef
                            ? ` • ${req.patientDetails.patientRef}`
                            : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {hospital?.name ?? 'Partner Hub'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {hospital?.city} &bull;{' '}
                          <span className="font-mono">{hospital?.licenseId}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-50 border border-red-200/80 text-[#F03E3E] font-bold text-xs">
                          {req.bloodGroup}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-800">
                        {req.unitsFulfilled}/{req.unitsNeeded}u
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            req.urgency === 'Critical'
                              ? 'bg-red-50 text-[#F03E3E]'
                              : req.urgency === 'Urgent'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Update status for ${req.id}`}
                          value={req.status}
                          onChange={(e) =>
                            onUpdateRequestStatus(
                              req.id,
                              e.target.value as RequestStatus
                            )
                          }
                          className={`text-[11.5px] font-semibold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
                            req.status === 'Fulfilled'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value="Dispatching">Dispatching</option>
                          <option value="Matching">Matching</option>
                          <option value="Donor En Route">Donor En Route</option>
                          <option value="Fulfilled">Fulfilled</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {req.urgency !== 'Critical' &&
                            req.status !== 'Fulfilled' && (
                              <button
                                type="button"
                                onClick={() => onEscalateRequest(req.id)}
                                className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Escalate
                              </button>
                            )}
                          <button
                            type="button"
                            onClick={() => onInspectMatching(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                          >
                            <span>Match</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Blood Inventory Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              Regional Blood Bank Unit Inventory
            </h2>
            <p className="text-[12px] text-slate-500">
              Adjusting unit counts syncs live with the Emergency Request blood
              group selector.
            </p>
          </div>
          <span className="text-[11.5px] text-slate-500 font-medium">
            Critical low threshold: &le; 6 units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {BLOOD_GROUPS.map((group) => {
            const units = inventory[group] ?? 0;
            const isCritical = units <= 6;
            const barPct = Math.min(100, Math.round((units / 50) * 100));

            return (
              <div
                key={group}
                className={`rounded-xl border p-4 transition-colors ${
                  isCritical
                    ? 'bg-[#FFF8F8] border-red-200'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-slate-900">
                    {group}
                  </span>
                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F03E3E]">
                      <AlertTriangle className="w-3 h-3" />
                      Critical Low
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Adequate
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {units}
                    <span className="text-xs font-sans font-normal text-slate-500 ml-1">
                      units
                    </span>
                  </span>
                </div>

                <div className="mt-2 h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isCritical ? 'bg-[#F03E3E]' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    disabled={units <= 0}
                    onClick={() => onAdjustInventory(group, -1)}
                    className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />1
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustInventory(group, 1)}
                    className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />1
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustInventory(group, 5)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />5
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
