import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  KeyRound, 
  Server,
  Code2,
  HeartPulse,
  Clock,
  Radio,
  Send,
  Zap,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  getSupabaseKeepAliveStatus, 
  pingSupabaseKeepAlive, 
  getExternalCronConfig,
  SupabaseKeepAliveStatus 
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshConnection: () => Promise<void>;
  patientCount: number;
  initialTab?: 'config' | 'keepalive';
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshConnection,
  patientCount,
  initialTab = 'config'
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'keepalive'>(initialTab);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedCronJob, setCopiedCronJob] = useState(false);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [keepAliveStatus, setKeepAliveStatus] = useState<SupabaseKeepAliveStatus>(getSupabaseKeepAliveStatus());
  const [pingFeedback, setPingFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Sync tab when opened
  useEffect(() => {
    if (isOpen) {
      setKeepAliveStatus(getSupabaseKeepAliveStatus());
      setPingFeedback(null);
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();
  const currentUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const cronConfig = getExternalCronConfig();

  const sqlDDL = `-- 1. Tạo bảng patients trên Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    medical_record_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    age INTEGER,
    gender TEXT DEFAULT 'male',
    phone TEXT,
    address TEXT,
    diagnosis TEXT,
    admission_date DATE DEFAULT CURRENT_DATE,
    discharge_date DATE,
    primary_category TEXT DEFAULT 'liver',
    specific_diagnosis TEXT,
    secondary_diagnosis TEXT,
    doctor_in_charge TEXT DEFAULT 'Bác sĩ Đỗ Trung Hiếu',
    liver_labs JSONB DEFAULT '{}'::jsonb,
    ibd_labs JSONB DEFAULT '{}'::jsonb,
    ibs_labs JSONB DEFAULT '{}'::jsonb,
    treatment_notes TEXT,
    medications JSONB DEFAULT '[]'::jsonb,
    dietary_plan TEXT,
    follow_up_date DATE,
    notes TEXT,
    visits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Thiết lập Row Level Security (RLS) cho phép đọc ghi dữ liệu bệnh nhân
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access" ON public.patients;
CREATE POLICY "Allow anon full access" ON public.patients
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Tạo Index tối ưu hóa truy vấn nhanh theo mã bệnh án và ngày nhập viện
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON public.patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patients_admission ON public.patients(admission_date DESC);`;

  const envSample = `VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlDDL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(cronConfig.url);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2500);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(cronConfig.curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  const handleCopyCronJobGuide = () => {
    const text = `URL: ${cronConfig.url}\nMethod: GET\nHeader: apikey: ${cronConfig.apikey}\nSchedule: Every Monday at 08:00 AM (hoặc */5 days)`;
    navigator.clipboard.writeText(text);
    setCopiedCronJob(true);
    setTimeout(() => setCopiedCronJob(false), 2500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshConnection();
    setKeepAliveStatus(getSupabaseKeepAliveStatus());
    setIsRefreshing(false);
  };

  const handleManualPing = async () => {
    setIsPinging(true);
    setPingFeedback(null);
    try {
      const res = await pingSupabaseKeepAlive();
      setKeepAliveStatus(getSupabaseKeepAliveStatus());
      setPingFeedback({
        success: res.success,
        message: res.message
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Quản Lý & Duy Trì Supabase</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {isConnected ? 'PostgreSQL Kết Nối' : 'Chưa cấu hình'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảng dữ liệu: <code className="text-emerald-300 font-mono">public.patients</code> ({patientCount} hồ sơ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'config'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="h-4 w-4" />
              <span>1. Cấu Hình CSDL & SQL</span>
            </button>
            <button
              onClick={() => setActiveTab('keepalive')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'keepalive'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="h-4 w-4 text-rose-500 animate-pulse" />
              <span>2. Tự Động Ping & Chống Tạm Dừng (Keep-Alive)</span>
              {keepAliveStatus.isSafe ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                  An toàn
                </span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                  Cần ping
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</span>
          </button>
        </div>

        {/* Tab 1: Database Configuration & SQL */}
        {activeTab === 'config' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Status Box */}
            <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
              isConnected 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start gap-3">
                {isConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {isConnected 
                      ? 'Kết nối Supabase PostgreSQL đang hoạt động bình thường!' 
                      : 'Chưa phát hiện biến môi trường Supabase hợp lệ'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {isConnected 
                      ? `Ứng dụng đang đọc & ghi dữ liệu trực tiếp vào Supabase (${patientCount} hồ sơ bệnh nhân trong CSDL). Mọi thao tác Thêm (INSERT), Sửa (UPDATE), Xoá (DELETE) đều lưu vào PostgreSQL.`
                      : 'Để kết nối với database Supabase của bạn, hãy thiết lập 2 biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'}
                  </p>
                  {isConnected && currentUrl && (
                    <p className="text-[11px] font-mono text-emerald-800 break-all pt-1">
                      Host: {currentUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 1: Environment Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-600" />
                  <span>1. Biến Môi Trường (Environment Variables)</span>
                </h4>
                <button
                  onClick={handleCopyEnv}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {copiedEnv ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedEnv ? 'Đã sao chép' : 'Sao chép mẫu'}</span>
                </button>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Mở bảng điều khiển <strong>Project Settings → API</strong> trên Supabase để lấy <strong>Project URL</strong> và <strong>anon / public API key</strong>, sau đó điền vào cấu hình:
              </p>

              <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                <div className="text-slate-400 select-none mb-1"># File .env / Secrets Configuration</div>
                <div className="text-emerald-400">VITE_SUPABASE_URL<span className="text-slate-400">=</span><span className="text-amber-300">"https://your-project-id.supabase.co"</span></div>
                <div className="text-emerald-400">VITE_SUPABASE_ANON_KEY<span className="text-slate-400">=</span><span className="text-amber-300">"your-supabase-anon-key"</span></div>
              </div>
            </div>

            {/* Step 2: SQL DDL Schema */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                  <span>2. Script Khởi Tạo Bảng <code className="text-emerald-700">patients</code> (SQL Editor)</span>
                </h4>
                <button
                  onClick={handleCopySQL}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {copiedSQL ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSQL ? 'Đã sao chép SQL' : 'Sao chép toàn bộ SQL'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Đăng nhập vào Supabase Dashboard, vào mục <strong>SQL Editor</strong>, dán đoạn script bên dưới và bấm <strong>Run</strong> để tạo bảng dữ liệu chuẩn:
              </p>

              <div className="relative">
                <pre className="bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 max-h-56 leading-relaxed">
                  <code>{sqlDDL}</code>
                </pre>
              </div>
            </div>

            {/* Step 3: Architecture notes */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-slate-700" />
                <span>Cơ chế đồng bộ thời gian thực:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500">
                <li><strong>SELECT:</strong> Khi tải hoặc làm mới trang, ứng dụng tự động truy vấn dữ liệu từ Supabase PostgreSQL.</li>
                <li><strong>INSERT:</strong> Tạo mới bệnh nhân sẽ đẩy bản ghi trực tiếp vào bảng <code className="font-mono text-slate-700">patients</code>.</li>
                <li><strong>UPDATE:</strong> Chỉnh sửa hồ sơ hoặc ghi nhận đợt tái khám sẽ cập nhật dòng tương ứng.</li>
                <li><strong>DELETE:</strong> Xóa bệnh nhân sẽ thực thi lệnh DELETE khỏi database Supabase.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Auto Keep-Alive & Anti-Pause */}
        {activeTab === 'keepalive' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Keep-Alive Status Banner */}
            <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Tự Động Giữ Kết Nối (Keep-Alive Anti-Pause)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Chính sách Supabase Free Tier: Dự án sẽ bị tạm dừng (Paused) sau <strong>7 ngày</strong> không có hoạt động.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleManualPing}
                  disabled={isPinging || !isConnected}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
                >
                  <Send className={`h-3.5 w-3.5 ${isPinging ? 'animate-bounce' : ''}`} />
                  <span>{isPinging ? 'Đang gửi ping...' : 'Ping Làm Mới Kết Nối Ngay'}</span>
                </button>
              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Lần Ping Gần Nhất
                  </span>
                  <div className="font-bold text-xs text-slate-800">
                    {keepAliveStatus.lastPingTime 
                      ? new Date(keepAliveStatus.lastPingTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Chưa ghi nhận'}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {keepAliveStatus.lastPingTime ? `(${keepAliveStatus.daysElapsed} ngày trước)` : 'Cần gửi lượt ping đầu tiên'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Độ Trễ Phản Hồi (Latency)
                  </span>
                  <div className="font-bold text-xs text-slate-800">
                    {keepAliveStatus.lastPingLatency !== null ? `${keepAliveStatus.lastPingLatency} ms` : '--'}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {keepAliveStatus.lastPingStatus === 'success' ? '✓ Kết nối ổn định' : '--'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Hạn Tạm Dừng Supabase
                  </span>
                  <div className={`font-bold text-xs ${keepAliveStatus.isSafe ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {keepAliveStatus.isSafe ? `Còn ${keepAliveStatus.daysRemaining} ngày an toàn` : 'Cần ping ngay'}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Tối đa 7 ngày không truy vấn
                  </span>
                </div>
              </div>

              {/* Ping feedback alert */}
              {pingFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  pingFeedback.success 
                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-medium' 
                    : 'bg-rose-100/70 border-rose-300 text-rose-900'
                }`}>
                  {pingFeedback.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{pingFeedback.message}</span>
                </div>
              )}
            </div>

            {/* In-app Auto Ping Mechanism */}
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Cơ Chế 1: Tự Động Ping Ngầm Khi Mở Web (In-App Auto Keep-Alive)
                </h5>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Ứng dụng đã được tích hợp sẵn chức năng tự động: Mỗi khi bạn mở web và sử dụng, nếu hệ thống nhận thấy đã quá <strong>3 ngày</strong> kể từ lần ping cuối (hoặc chưa từng ping), hệ thống sẽ <strong>tự động gửi 1 request SELECT nhẹ ngầm</strong> đến Supabase để làm mới thời hạn 7 ngày. Bạn không cần làm gì cả.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Trạng thái tự động ping ngầm:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đang bật (Tần suất: 3-5 ngày/lần)
                </span>
              </div>
            </div>

            {/* 24/7 Cloud Cron Keep-Alive (Even when computer is closed) */}
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                    <Globe className="h-4 w-4" />
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Cơ Chế 2: Tự Động Ping 24/7 Ngoại Tuyến (Khi tắt máy / nghỉ phép)
                  </h5>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Miễn phí 100%
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Nếu bạn đi công tác hoặc nghỉ lễ dài ngày mà <strong>không ai mở trang web trong hơn 7 ngày</strong>, bạn có thể cài đặt 1 lịch trình cron tự động gọi vào Supabase vào <strong>thứ Hai hàng tuần lúc 08:00 sáng</strong> bằng dịch vụ đám mây miễn phí:
              </p>

              {/* Cron-Job.org instructions */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800">
                    Cách 1: Sử dụng Cron-job.org (Miễn phí trọn đời, 2 phút cài đặt)
                  </div>
                  <a
                    href="https://cron-job.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    <span>Mở Cron-job.org</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Tạo tài khoản miễn phí trên <strong>cron-job.org</strong>.</li>
                  <li>Bấm <strong>Create Cronjob</strong>. Đặt tên: <em>Supabase Keep Alive</em>.</li>
                  <li>Dán <strong>URL Endpoint</strong> bên dưới vào ô URL.</li>
                  <li>Chọn tần suất: <strong>Every Monday at 08:00</strong> (hoặc Every 5 days).</li>
                  <li>Mục Headers, thêm header: <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded">apikey: [Anon_Key_Của_Bạn]</code>.</li>
                </ol>

                {/* Direct REST Endpoint */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Đường dẫn REST Endpoint của bạn:</span>
                    <button
                      onClick={handleCopyEndpoint}
                      disabled={!cronConfig.url}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                    >
                      {copiedEndpoint ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedEndpoint ? 'Đã sao chép' : 'Sao chép URL'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all select-all">
                    {cronConfig.url || 'Chưa cấu hình VITE_SUPABASE_URL'}
                  </div>
                </div>

                {/* cURL command */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Lệnh cURL kiểm tra thử trên Terminal:</span>
                    <button
                      onClick={handleCopyCurl}
                      disabled={!cronConfig.curlCommand}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                    >
                      {copiedCurl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCurl ? 'Đã sao chép cURL' : 'Sao chép cURL'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-lg break-all select-all">
                    {cronConfig.curlCommand || 'Chưa cấu hình Supabase'}
                  </div>
                </div>
              </div>

              {/* GitHub Actions alternative */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-indigo-900">Cách 2: Đã tạo sẵn file GitHub Actions tự động:</strong>
                  File kịch bản <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono">.github/workflows/supabase-keepalive.yml</code> đã được cấu hình sẵn trong mã nguồn. Nếu bạn đưa code lên GitHub repo, GitHub sẽ tự động chạy lệnh ping 2 lần/tuần (vào sáng thứ Hai và thứ Năm lúc 09:00 AM giờ Việt Nam).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <span>Mở Supabase Dashboard</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
