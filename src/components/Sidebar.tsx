import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  Droplet,
  Globe2,
  Heart,
  PhoneCall,
  Plus,
  Siren,
  Target,
  X,
} from 'lucide-react';
import { HospitalHub, NavScreen } from '../types/lifeline';

interface SidebarProps {
  activeScreen: NavScreen;
  onSelectScreen: (screen: NavScreen) => void;
  hospitals: HospitalHub[];
  activeHub: HospitalHub;
  onChangeHub: (hubId: string) => void;
  onQuickActivateCity: (cityName: string, hospitalName?: string) => void;
  openRequestCount: number;
  donorCount: number;
  hospitalCount: number;
  hasLiveMatching: boolean;
  onTriggerHotline: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  hospitals,
  activeHub,
  onChangeHub,
  onQuickActivateCity,
  openRequestCount,
  donorCount,
  hospitalCount,
  hasLiveMatching,
  onTriggerHotline,
  mobileOpen,
  onCloseMobile,
}) => {
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [showCustomCity, setShowCustomCity] = useState<boolean>(false);
  const [customCityInput, setCustomCityInput] = useState<string>('');

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => set.add(h.city));
    return Array.from(set);
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    if (cityFilter === 'ALL') return hospitals;
    return hospitals.filter((h) => h.city === cityFilter);
  }, [hospitals, cityFilter]);

  const handleCitySelect = (value: string) => {
    if (value === '__CUSTOM__') {
      setShowCustomCity(true);
      return;
    }
    setShowCustomCity(false);
    setCityFilter(value);
    if (value !== 'ALL') {
      const firstInCity = hospitals.find((h) => h.city === value);
      if (firstInCity && firstInCity.id !== activeHub.id) {
        onChangeHub(firstInCity.id);
      }
    }
  };

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customCityInput.trim();
    if (!cleaned) return;
    onQuickActivateCity(cleaned);
    setCityFilter(cleaned);
    setCustomCityInput('');
    setShowCustomCity(false);
  };

  const navItems: Array<{
    id: NavScreen;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeType?: 'fast' | 'alert' | 'count' | 'live';
  }> = [
    {
      id: 'request',
      label: 'Emergency Request',
      icon: <Siren className="w-4 h-4 shrink-0" />,
      badge: 'FAST',
      badgeType: 'fast',
    },
    {
      id: 'matching',
      label: 'Matching Result',
      icon: <Target className="w-4 h-4 shrink-0" />,
      badge: hasLiveMatching ? 'LIVE' : undefined,
      badgeType: 'live',
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      badge: openRequestCount,
      badgeType: 'alert',
    },
    {
      id: 'donors',
      label: 'Donors Directory',
      icon: <Droplet className="w-4 h-4 shrink-0" />,
      badge: donorCount,
      badgeType: 'count',
    },
    {
      id: 'hospitals',
      label: 'Hospitals',
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      badge: hospitalCount,
      badgeType: 'count',
    },
  ];

  const handleNavClick = (id: NavScreen) => {
    onSelectScreen(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside className="w-[260px] h-full bg-white border-r border-slate-200/90 flex flex-col justify-between select-none overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNavClick('request')}
            className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F03E3E] rounded-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4B4B] to-[#F03E3E] shadow-md shadow-red-500/25 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[17px] tracking-tight text-slate-900 leading-none">
                  LifeLine
                </span>
                <span className="text-[10px] font-bold tracking-wider text-[#F03E3E] bg-red-50 border border-red-200/70 px-1.5 py-0.5 rounded leading-none">
                  GRID
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Emergency Blood Network
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active City & Hospital Hub Switcher */}
        <div className="px-4 pt-4">
          <div className="bg-[#EEF3F9] border border-slate-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Active Hospital Hub
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                <Globe2 className="w-3 h-3" />
                All Cities
              </span>
            </div>

            {/* City Filter / Custom City Launcher */}
            <div className="relative">
              <select
                aria-label="Select City"
                value={showCustomCity ? '__CUSTOM__' : cityFilter}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="w-full appearance-none bg-white/90 border border-slate-300/80 hover:border-slate-400 focus:border-[#F03E3E] focus:outline-none rounded-lg pl-2.5 pr-7 py-1.5 text-[11.5px] font-semibold text-slate-700 truncate transition-colors cursor-pointer"
              >
                <option value="ALL">
                  All Cities ({availableCities.length} cities)
                </option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Enter Any Other City...</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>

            {showCustomCity && (
              <form
                onSubmit={handleCustomCitySubmit}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={customCityInput}
                  onChange={(e) => setCustomCityInput(e.target.value)}
                  placeholder="Enter any city name..."
                  autoFocus
                  className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11.5px] text-slate-900 focus:outline-none focus:border-[#F03E3E]"
                />
                <button
                  type="submit"
                  aria-label="Activate city hub"
                  className="px-2 py-1.5 rounded-lg bg-[#F03E3E] hover:bg-[#DC2626] text-white text-[11px] font-bold shrink-0 cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  Go
                </button>
              </form>
            )}

            {/* Hospital Dropdown */}
            <div className="relative">
              <select
                aria-label="Active Hospital Hub"
                value={activeHub.id}
                onChange={(e) => onChangeHub(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300/90 hover:border-slate-400 focus:border-[#F03E3E] focus:outline-none focus:ring-2 focus:ring-red-100 rounded-lg pl-2.5 pr-7 py-2 text-[12px] font-semibold text-slate-800 truncate transition-colors cursor-pointer"
              >
                {filteredHospitals.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center justify-between pt-0.5 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  activeHub.verified ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeHub.verified ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {activeHub.verified ? 'Verified Partner' : 'Pending Audit'}
              </span>
              <span className="text-slate-500 font-medium truncate max-w-[100px]">
                {activeHub.city}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary Navigation" className="px-4 pt-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F03E3E] ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF4B4B] to-[#F03E3E] text-white shadow-md shadow-red-500/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={
                      isActive
                        ? 'text-white'
                        : item.id === 'matching'
                          ? 'text-[#F03E3E]'
                          : 'text-slate-500'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </span>

                {item.badge !== undefined && (
                  <span
                    className={`shrink-0 tabular-nums leading-none ${
                      item.badgeType === 'fast'
                        ? isActive
                          ? 'bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wide'
                          : 'bg-red-50 text-[#F03E3E] text-[10px] font-bold px-2 py-1 rounded-full tracking-wide'
                        : item.badgeType === 'live'
                          ? isActive
                            ? 'bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1'
                          : item.badgeType === 'alert'
                            ? isActive
                              ? 'bg-white text-[#F03E3E] text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center'
                              : 'bg-[#FFF0F0] text-[#F03E3E] text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center'
                            : isActive
                              ? 'text-white/90 text-[12px] font-semibold'
                              : 'text-slate-400 text-[12px] font-semibold'
                    }`}
                  >
                    {item.badgeType === 'live' && (
                      <Activity className="w-2.5 h-2.5 shrink-0" />
                    )}
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom 24/7 Red Dispatch Bridge */}
      <div className="p-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onTriggerHotline}
          className="w-full bg-[#FFF5F5] hover:bg-[#FFEBEB] border border-[#FFE0E0] rounded-xl p-3.5 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F03E3E]"
        >
          <div className="text-[10px] font-bold tracking-wider text-[#F03E3E] uppercase flex items-center justify-center gap-1.5">
            <PhoneCall className="w-3 h-3" />
            <span>24/7 Red Dispatch</span>
          </div>
          <div className="text-[13px] font-bold text-[#E03131] mt-1 font-mono tabular-nums tracking-tight">
            1800-LIFE-BLOOD
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            All-city hospital ambulance bridge
          </div>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
