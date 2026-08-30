import React, { useMemo, useState } from 'react';
import { PatientRecord, DiseaseCategory } from '../types';
import { 
  PieChart as PieChartIcon, 
  Activity, 
  AlertTriangle, 
  Flame, 
  Layers, 
  TrendingUp, 
  HeartPulse,
  Droplets,
  Zap,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Clock,
  ShieldAlert,
  Bell,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface StatsDashboardProps {
  patients: PatientRecord[];
  onSelectCategory: (category: 'all' | DiseaseCategory) => void;
  onOpenPatientDetail: (patient: PatientRecord) => void;
  onOpenNewPatient?: () => void;
  onQuickSaveLab?: (patientData: Partial<PatientRecord>) => void;
}

const COLORS = {
  liver: '#f59e0b', // Amber
  ibd: '#14b8a6',   // Teal
  ibs: '#f43f5e',   // Rose
  mixed: '#8b5cf6', // Purple
  male: '#6366f1',  // Indigo
  female: '#ec4899',// Pink
  other: '#94a3b8',
  riskLow: '#10b981',
  riskMid: '#f59e0b',
  riskHigh: '#ef4444',
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  patients,
  onSelectCategory,
  onOpenPatientDetail,
  onOpenNewPatient,
  onQuickSaveLab,
}) => {
  // Quick triage input state for the Indigo Bento Card
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState<DiseaseCategory>('liver');
  const [quickAlt, setQuickAlt] = useState('');
  const [quickCalprotectin, setQuickCalprotectin] = useState('');
  const [quickSavedSuccess, setQuickSavedSuccess] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !onQuickSaveLab) return;

    onQuickSaveLab({
      fullName: quickName.trim(),
      primaryCategory: quickCategory,
      specificDiagnosis: quickCategory === 'liver' ? 'Theo dõi men gan tăng / Viêm gan' : quickCategory === 'ibd' ? 'Nghi ngờ viêm ruột IBD' : 'Rối loạn tiêu hoá chức năng IBS',
      liverLabs: quickCategory === 'liver' && quickAlt ? { alt: Number(quickAlt), ast: Number(quickAlt) } : undefined,
      ibdLabs: quickCategory === 'ibd' && quickCalprotectin ? { fecalCalprotectin: Number(quickCalprotectin) } : undefined,
    });

    setQuickName('');
    setQuickAlt('');
    setQuickCalprotectin('');
    setQuickSavedSuccess(true);
    setTimeout(() => setQuickSavedSuccess(false), 3000);
  };

  const stats = useMemo(() => {
    const total = patients.length;
    const liverCount = patients.filter(p => p.primaryCategory === 'liver').length;
    const ibdCount = patients.filter(p => p.primaryCategory === 'ibd').length;
    const ibsCount = patients.filter(p => p.primaryCategory === 'ibs').length;
    const mixedCount = patients.filter(p => p.primaryCategory === 'mixed').length;

    // High risk alerts
    const highFib4Patients = patients.filter(
      p => p.liverLabs?.fib4Category === 'Cao (F3-F4)' || (p.liverLabs?.fib4Score && p.liverLabs.fib4Score > 2.67)
    );
    const highCalprotectinPatients = patients.filter(
      p => (p.ibdLabs?.fecalCalprotectin && p.ibdLabs.fecalCalprotectin > 200) || p.ibdLabs?.diseaseActivity === 'Hoạt động nặng'
    );
    const severeIbsPatients = patients.filter(
      p => p.ibsLabs?.ibssSeverity === 'Nặng (>=300)' || (p.ibsLabs?.ibssScore && p.ibsLabs.ibssScore >= 300)
    );
    const highAltAstPatients = patients.filter(
      p => (p.liverLabs?.alt && p.liverLabs.alt > 80) || (p.liverLabs?.ast && p.liverLabs.ast > 80)
    );
    const anemiaPatients = patients.filter(
      p => (p.ibdLabs?.hemoglobin && p.ibdLabs.hemoglobin < 11.0)
    );

    // Disease Category Distribution
    const categoryData = [
      { name: 'Gan Mật', value: liverCount, category: 'liver', color: COLORS.liver },
      { name: 'IBD (Viêm ruột)', value: ibdCount, category: 'ibd', color: COLORS.ibd },
      { name: 'IBS (Ruột kích thích)', value: ibsCount, category: 'ibs', color: COLORS.ibs },
      { name: 'Bệnh Phối Hợp', value: mixedCount, category: 'mixed', color: COLORS.mixed },
    ].filter(d => d.value > 0);

    // Age & Gender Demographics
    const ageGroups = [
      { group: '< 30t', male: 0, female: 0, other: 0 },
      { group: '30-45t', male: 0, female: 0, other: 0 },
      { group: '46-60t', male: 0, female: 0, other: 0 },
      { group: '> 60t', male: 0, female: 0, other: 0 },
    ];

    patients.forEach(p => {
      let groupIdx = 0;
      if (p.age < 30) groupIdx = 0;
      else if (p.age <= 45) groupIdx = 1;
      else if (p.age <= 60) groupIdx = 2;
      else groupIdx = 3;

      if (p.gender === 'male') ageGroups[groupIdx].male += 1;
      else if (p.gender === 'female') ageGroups[groupIdx].female += 1;
      else ageGroups[groupIdx].other += 1;
    });

    // FIB-4 Risk breakdown (Liver patients)
    let fib4Low = 0;
    let fib4Mid = 0;
    let fib4High = 0;
    patients.forEach(p => {
      if (p.liverLabs?.fib4Category === 'Thấp (F0-F1)') fib4Low++;
      else if (p.liverLabs?.fib4Category === 'Trung gian (F2)') fib4Mid++;
      else if (p.liverLabs?.fib4Category === 'Cao (F3-F4)') fib4High++;
    });

    const fib4Data = [
      { name: 'F0-F1 (Thấp)', value: fib4Low, color: COLORS.riskLow },
      { name: 'F2 (Trung gian)', value: fib4Mid, color: COLORS.riskMid },
      { name: 'F3-F4 (Cao)', value: fib4High, color: COLORS.riskHigh },
    ].filter(d => d.value > 0);

    // IBD Activity breakdown
    const ibdActivityCount: Record<string, number> = {
      'Thuyên giảm': 0,
      'Hoạt động nhẹ': 0,
      'Hoạt động vừa': 0,
      'Hoạt động nặng': 0,
    };
    patients.forEach(p => {
      if (p.primaryCategory === 'ibd' || p.ibdLabs) {
        const act = p.ibdLabs?.diseaseActivity;
        if (act?.includes('Thuyên giảm')) ibdActivityCount['Thuyên giảm']++;
        else if (act?.includes('nhẹ')) ibdActivityCount['Hoạt động nhẹ']++;
        else if (act?.includes('vừa')) ibdActivityCount['Hoạt động vừa']++;
        else if (act?.includes('nặng')) ibdActivityCount['Hoạt động nặng']++;
      }
    });

    const ibdActivityData = [
      { name: 'Thuyên giảm', count: ibdActivityCount['Thuyên giảm'], fill: '#10b981' },
      { name: 'Nhẹ', count: ibdActivityCount['Hoạt động nhẹ'], fill: '#38bdf8' },
      { name: 'Vừa', count: ibdActivityCount['Hoạt động vừa'], fill: '#f59e0b' },
      { name: 'Nặng', count: ibdActivityCount['Hoạt động nặng'], fill: '#ef4444' },
    ];

    // IBS Subtypes breakdown (Rome IV)
    const ibsSubtypes: Record<string, number> = {
      'IBS-D': 0,
      'IBS-C': 0,
      'IBS-M': 0,
      'IBS-U': 0,
    };
    patients.forEach(p => {
      const sub = p.ibsLabs?.romeIVSubtype;
      if (sub === 'IBS-D') ibsSubtypes['IBS-D']++;
      else if (sub === 'IBS-C') ibsSubtypes['IBS-C']++;
      else if (sub === 'IBS-M') ibsSubtypes['IBS-M']++;
      else if (sub === 'IBS-U') ibsSubtypes['IBS-U']++;
    });

    const ibsSubtypesData = Object.entries(ibsSubtypes).map(([name, count]) => ({
      name,
      count
    }));

    // Admission trend by date/month
    const monthlyMap: Record<string, { month: string; liver: number; ibd: number; ibs: number; total: number }> = {};
    patients.forEach(p => {
      const monthKey = p.admissionDate ? p.admissionDate.substring(0, 7) : 'Khác';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, liver: 0, ibd: 0, ibs: 0, total: 0 };
      }
      if (p.primaryCategory === 'liver') monthlyMap[monthKey].liver++;
      else if (p.primaryCategory === 'ibd') monthlyMap[monthKey].ibd++;
      else if (p.primaryCategory === 'ibs') monthlyMap[monthKey].ibs++;
      monthlyMap[monthKey].total++;
    });

    const trendData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Recent 5 patients for the Bento table
    const recentPatients = [...patients].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate)).slice(0, 5);

    return {
      total,
      liverCount,
      ibdCount,
      ibsCount,
      mixedCount,
      highFib4Patients,
      highCalprotectinPatients,
      severeIbsPatients,
      highAltAstPatients,
      anemiaPatients,
      categoryData,
      ageGroups,
      fib4Data,
      ibdActivityData,
      ibsSubtypesData,
      trendData,
      recentPatients
    };
  }, [patients]);

  return (
    <div className="space-y-6 pb-8">
      {/* 4 Bento KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng bệnh nhân */}
        <div 
          id="bento-kpi-total"
          onClick={() => onSelectCategory('all')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng bệnh nhân</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ↑ 100%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Toàn bộ hồ sơ lâm sàng</span>
            <ArrowUpRight className="h-3 w-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 2: Bệnh Gan (Amber border-l-4) */}
        <div 
          id="bento-kpi-liver"
          onClick={() => onSelectCategory('liver')}
          className="bg-white p-5 rounded-3xl border border-slate-200 border-l-4 border-l-amber-500 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Bệnh Gan
            </span>
            <span className="text-xs font-bold text-slate-500">
              {stats.total > 0 ? Math.round((stats.liverCount / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stats.liverCount}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.liverCount / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Viêm gan B/C, Xơ gan, MASLD</span>
            <ArrowUpRight className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 3: Bệnh IBD (Teal border-l-4) */}
        <div 
          id="bento-kpi-ibd"
          onClick={() => onSelectCategory('ibd')}
          className="bg-white p-5 rounded-3xl border border-slate-200 border-l-4 border-l-teal-500 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Bệnh IBD
            </span>
            <span className="text-xs font-bold text-slate-500">
              {stats.total > 0 ? Math.round((stats.ibdCount / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stats.ibdCount}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-teal-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.ibdCount / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Crohn & Viêm loét đại tràng (UC)</span>
            <ArrowUpRight className="h-3 w-3 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 4: Bệnh IBS (Rose border-l-4) */}
        <div 
          id="bento-kpi-ibs"
          onClick={() => onSelectCategory('ibs')}
          className="bg-white p-5 rounded-3xl border border-slate-200 border-l-4 border-l-rose-500 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              Bệnh IBS
            </span>
            <span className="text-xs font-bold text-slate-500">
              {stats.total > 0 ? Math.round((stats.ibsCount / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stats.ibsCount}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.ibsCount / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Rome IV (IBS-D, C, M, U)</span>
            <ArrowUpRight className="h-3 w-3 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* Main Bento Grid Row: Trend Chart (Span 2) & Quick Action / Lab Entry (Span 1) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bento Card 1: Xu hướng bệnh lý (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Xu hướng bệnh lý & Nhập viện</h3>
              <p className="text-xs text-slate-400">Số lượng ca tiếp nhận theo tháng và nhóm bệnh</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Gan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <span className="text-slate-600">IBD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-600">IBS</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bentoGradientLiver" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="bentoGradientIBD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="bentoGradientIBS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="liver" name="Bệnh Gan" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#bentoGradientLiver)" />
                <Area type="monotone" dataKey="ibd" name="Bệnh IBD" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#bentoGradientIBD)" />
                <Area type="monotone" dataKey="ibs" name="Bệnh IBS" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#bentoGradientIBS)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>• Dữ liệu tổng hợp theo từng đợt khám bệnh nhân</span>
            <span className="font-semibold text-indigo-600">Đã cập nhật đầy đủ</span>
          </div>
        </div>

        {/* Bento Card 2: Nhập xét nghiệm nhanh (Indigo Bento Card) */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-md shadow-indigo-200">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 bg-white/10 px-2.5 py-1 rounded-lg">
                Tiếp nhận & Sàng lọc
              </span>
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <h3 className="text-xl font-bold leading-tight">Nhập Xét Nghiệm Nhanh</h3>
            <p className="text-indigo-100 text-xs mt-1">
              Ghi nhanh chỉ số men gan hoặc Calprotectin vào hệ thống.
            </p>

            <form onSubmit={handleQuickSubmit} className="mt-4 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Tên bệnh nhân..."
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(['liver', 'ibd', 'ibs'] as DiseaseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuickCategory(cat)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      quickCategory === cat
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'bg-white/10 text-indigo-100 hover:bg-white/20'
                    }`}
                  >
                    {cat === 'liver' ? 'Gan' : cat === 'ibd' ? 'IBD' : 'IBS'}
                  </button>
                ))}
              </div>

              {quickCategory === 'liver' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="ALT (U/L)..."
                    value={quickAlt}
                    onChange={(e) => setQuickAlt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-200 focus:outline-none"
                  />
                  <div className="text-[11px] text-indigo-200 flex items-center">
                    Bình thường &lt; 40
                  </div>
                </div>
              )}

              {quickCategory === 'ibd' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Calprotectin (µg/g)..."
                    value={quickCalprotectin}
                    onChange={(e) => setQuickCalprotectin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-200 focus:outline-none"
                  />
                  <div className="text-[11px] text-indigo-200 flex items-center">
                    Cảnh báo &gt; 200
                  </div>
                </div>
              )}

              {quickSavedSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã thêm bệnh nhân thành công!</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {quickName.trim() ? (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    Lưu Nhanh
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenNewPatient}
                    className="flex-1 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Mở Biểu Mẫu Đầy Đủ</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Decorative background blur shape */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </section>

      {/* Main Bento Grid Row 2: Recent Patients Table (Span 2) & Alert Box (Span 1) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bento Card 3: Bệnh nhân mới cập nhật (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">Bệnh nhân mới cập nhật</h3>
                <p className="text-xs text-slate-400">Danh sách tiếp nhận gần nhất trong hệ thống</p>
              </div>
              <button
                onClick={() => onSelectCategory('all')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Xem tất cả ({stats.total})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                    <th className="pb-3 px-2">Bệnh nhân</th>
                    <th className="pb-3 px-2">Nhóm bệnh</th>
                    <th className="pb-3 px-2">Chẩn đoán</th>
                    <th className="pb-3 px-2">Trạng thái</th>
                    <th className="pb-3 px-2 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {stats.recentPatients.map((patient) => {
                    const isSevere = 
                      (patient.liverLabs?.fib4Category === 'Cao (F3-F4)') ||
                      (patient.ibdLabs?.fecalCalprotectin && patient.ibdLabs.fecalCalprotectin > 200) ||
                      (patient.ibsLabs?.ibssSeverity === 'Nặng (>=300)');

                    return (
                      <tr 
                        key={patient.id} 
                        onClick={() => onOpenPatientDetail(patient)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900">{patient.fullName}</div>
                          <div className="text-[11px] text-slate-400">{patient.patientCode} • {patient.age}t</div>
                        </td>
                        <td className="py-3 px-2">
                          {patient.primaryCategory === 'liver' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              Gan Mật
                            </span>
                          )}
                          {patient.primaryCategory === 'ibd' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                              IBD
                            </span>
                          )}
                          {patient.primaryCategory === 'ibs' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                              IBS
                            </span>
                          )}
                          {patient.primaryCategory === 'mixed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                              Phối hợp
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 max-w-[180px] truncate text-slate-700">
                          {patient.specificDiagnosis}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isSevere ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSevere ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                            {isSevere ? 'Theo dõi sát' : 'Ổn định'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPatientDetail(patient);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bento Card 4: Cảnh báo bất thường (Dashed Border Bento Card) */}
        <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-6 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-rose-500 mb-3">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Cảnh báo bất thường</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Có <strong className="text-rose-600 font-bold">{stats.highAltAstPatients.length + stats.highCalprotectinPatients.length + stats.highFib4Patients.length} chỉ số</strong> vượt ngưỡng báo động lâm sàng cần hội chẩn.
          </p>

          <div className="w-full space-y-2 mt-4 text-xs text-left">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-600 font-medium">FIB-4 Nguy cơ cao (F3-F4)</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {stats.highFib4Patients.length} ca
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Calprotectin &gt; 200 µg/g</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {stats.highCalprotectinPatients.length} ca
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Men gan AST/ALT &gt; 80</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                {stats.highAltAstPatients.length} ca
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectCategory('all')}
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
          >
            Lọc danh sách bệnh nhân cảnh báo
          </button>
        </div>
      </section>

      {/* Deep Specialty Analytics Bento Row: 3 Specialty Cards + Demographics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Specialty 1: Gan FIB-4 Pie */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Gan: Phân Tầng FIB-4</h4>
              <p className="text-[11px] text-slate-400">Nguy cơ xơ hóa gan F0-F4</p>
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.fib4Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {stats.fib4Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-[10px] pt-2 border-t border-slate-100 font-bold">
            <div className="text-emerald-700 bg-emerald-50 p-1 rounded-lg">F0-F1: {stats.fib4Data.find(d => d.name.includes('F0'))?.value || 0}</div>
            <div className="text-amber-700 bg-amber-50 p-1 rounded-lg">F2: {stats.fib4Data.find(d => d.name.includes('F2'))?.value || 0}</div>
            <div className="text-rose-700 bg-rose-50 p-1 rounded-lg">F3-4: {stats.fib4Data.find(d => d.name.includes('F3'))?.value || 0}</div>
          </div>
        </div>

        {/* Specialty 2: IBD Activity Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">IBD: Hoạt Động Bệnh</h4>
              <p className="text-[11px] text-slate-400">Mayo & Calprotectin</p>
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ibdActivityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="count" name="Số ca" radius={[4, 4, 0, 0]}>
                  {stats.ibdActivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 text-center">
            <strong className="text-teal-600">{stats.highCalprotectinPatients.length} BN</strong> đợt cấp bùng phát
          </div>
        </div>

        {/* Specialty 3: IBS Rome IV */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">IBS: Phân Thể Rome IV</h4>
              <p className="text-[11px] text-slate-400">D, C, M, U & Bristol Scale</p>
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ibsSubtypesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 text-center">
            IBS-D chiếm tỷ lệ khám cao nhất
          </div>
        </div>

        {/* Specialty 4: Demographics Age / Gender */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Cơ Cấu Tuổi & Giới Tính</h4>
              <p className="text-[11px] text-slate-400">Nam vs Nữ theo nhóm tuổi</p>
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ageGroups} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="male" name="Nam" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="female" name="Nữ" fill="#ec4899" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-around">
            <span className="flex items-center gap-1 font-bold text-indigo-600">● Nam</span>
            <span className="flex items-center gap-1 font-bold text-pink-600">● Nữ</span>
          </div>
        </div>
      </section>
    </div>
  );
};

