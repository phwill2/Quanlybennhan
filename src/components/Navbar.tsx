import React from 'react';
import { 
  Activity, 
  Users, 
  BarChart3, 
  Calculator, 
  Plus, 
  Download, 
  FileSpreadsheet,
  Stethoscope,
  TrendingUp
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'patients' | 'timeline' | 'calculators';
  setCurrentTab: (tab: 'dashboard' | 'patients' | 'timeline' | 'calculators') => void;
  totalPatients: number;
  onOpenNewPatient: () => void;
  onOpenImportExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  totalPatients,
  onOpenNewPatient,
  onOpenImportExport,
}) => {
  return (
    <header className="lg:hidden bg-white text-slate-900 sticky top-0 z-30 shadow-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Specialty Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-100">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-slate-900 tracking-tight">
                  GI-Track Pro
                </h1>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Gan • IBD • IBS
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              id="nav-tab-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </button>

            <button
              id="nav-tab-patients"
              onClick={() => setCurrentTab('patients')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'patients'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Bệnh nhân</span>
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 text-[10px] rounded-full font-bold">
                {totalPatients}
              </span>
            </button>

            <button
              id="nav-tab-timeline"
              onClick={() => setCurrentTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'timeline'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Diễn tiến</span>
            </button>

            <button
              id="nav-tab-calculators"
              onClick={() => setCurrentTab('calculators')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'calculators'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Thang điểm</span>
            </button>
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              id="btn-import-export"
              onClick={onOpenImportExport}
              title="Sao lưu & Xuất Excel"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>

            <button
              id="btn-add-patient-nav"
              onClick={onOpenNewPatient}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs shadow-xs transition"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Thêm BN</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

