import React, { useState } from 'react';
import { 
  Calculator, 
  Droplets, 
  Flame, 
  Zap, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  calculateFIB4, 
  calculateAPRI, 
  interpretCalprotectin, 
  BRISTOL_STOOL_SCALE 
} from '../utils/clinicalCalculators';
import { BristolStoolType } from '../types';

export const ClinicalCalculatorsView: React.FC = () => {
  const [calcTab, setCalcTab] = useState<'fib4' | 'apri' | 'childpugh' | 'calprotectin' | 'bristol'>('fib4');

  // FIB-4 State
  const [fAge, setFAge] = useState<number>(45);
  const [fAst, setFAst] = useState<number>(65);
  const [fAlt, setFAlt] = useState<number>(55);
  const [fPlt, setFPlt] = useState<number>(180);

  // APRI State
  const [apAst, setApAst] = useState<number>(70);
  const [apUln, setApUln] = useState<number>(40);
  const [apPlt, setApPlt] = useState<number>(160);

  // Child-Pugh State
  const [cpBili, setCpBili] = useState<number>(1.5); // mg/dL
  const [cpAlb, setCpAlb] = useState<number>(3.2); // g/dL
  const [cpInr, setCpInr] = useState<number>(1.4);
  const [cpAscites, setCpAscites] = useState<number>(1); // 1: None, 2: Slight/Moderate, 3: Tense
  const [cpEnceph, setCpEnceph] = useState<number>(1); // 1: None, 2: Grade 1-2, 3: Grade 3-4

  // Calprotectin State
  const [calVal, setCalVal] = useState<number>(180);

  // Bristol Stool Type State
  const [selectedBristol, setSelectedBristol] = useState<BristolStoolType>(4);

  // Calculations
  const fib4Result = calculateFIB4(fAge, fAst, fAlt, fPlt);
  const apriResult = calculateAPRI(apAst, apPlt, apUln);
  const calResult = interpretCalprotectin(calVal);

  // Calculate Child-Pugh Score
  const calculateChildPugh = () => {
    let score = 0;
    // Bilirubin
    if (cpBili < 2.0) score += 1;
    else if (cpBili <= 3.0) score += 2;
    else score += 3;

    // Albumin
    if (cpAlb > 3.5) score += 1;
    else if (cpAlb >= 2.8) score += 2;
    else score += 3;

    // INR
    if (cpInr < 1.7) score += 1;
    else if (cpInr <= 2.2) score += 2;
    else score += 3;

    // Ascites
    score += cpAscites;

    // Encephalopathy
    score += cpEnceph;

    let stage = 'Child-Pugh A (Xơ gan còn bù tốt)';
    let color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let survival = 'Tỷ lệ sống 1 năm: 100%, 2 năm: 85%';

    if (score >= 10) {
      stage = 'Child-Pugh C (Xơ gan mất bù nặng)';
      color = 'bg-rose-50 text-rose-800 border-rose-200';
      survival = 'Tỷ lệ sống 1 năm: 45%, 2 năm: 35% (Cần đánh giá ghép gan)';
    } else if (score >= 7) {
      stage = 'Child-Pugh B (Xơ gan tổn thương chức năng vừa)';
      color = 'bg-amber-50 text-amber-800 border-amber-200';
      survival = 'Tỷ lệ sống 1 năm: 80%, 2 năm: 60%';
    }

    return { score, stage, color, survival };
  };

  const childPugh = calculateChildPugh();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Bộ Công Cụ Tính Thang Điểm Y Khoa Tiêu Hoá - Gan Mật
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hỗ trợ tính nhanh FIB-4, APRI, Child-Pugh, Phân tầng Calprotectin IBD và Thang phân Bristol theo chuẩn quốc tế.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-slate-200 bg-white p-1.5 rounded-2xl shadow-xs overflow-x-auto scrollbar-none gap-1">
        <button
          onClick={() => setCalcTab('fib4')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            calcTab === 'fib4'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Droplets className="h-3.5 w-3.5" />
          <span>FIB-4 Index (Xơ hóa gan)</span>
        </button>

        <button
          onClick={() => setCalcTab('apri')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            calcTab === 'apri'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Droplets className="h-3.5 w-3.5" />
          <span>APRI Score</span>
        </button>

        <button
          onClick={() => setCalcTab('childpugh')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            calcTab === 'childpugh'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Droplets className="h-3.5 w-3.5" />
          <span>Child-Pugh (Xơ gan)</span>
        </button>

        <button
          onClick={() => setCalcTab('calprotectin')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            calcTab === 'calprotectin'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Calprotectin Phân (IBD)</span>
        </button>

        <button
          onClick={() => setCalcTab('bristol')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            calcTab === 'bristol'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Thang Phân Bristol (IBS)</span>
        </button>
      </div>

      {/* CALCULATOR 1: FIB-4 */}
      {calcTab === 'fib4' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-600" />
              <span>Nhập Chỉ Số Lâm Sàng</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tuổi (năm)</label>
                <input
                  type="number"
                  value={fAge}
                  onChange={(e) => setFAge(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">AST / SGOT (U/L)</label>
                <input
                  type="number"
                  value={fAst}
                  onChange={(e) => setFAst(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ALT / SGPT (U/L)</label>
                <input
                  type="number"
                  value={fAlt}
                  onChange={(e) => setFAlt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiểu Cầu (x10^9/L)</label>
                <input
                  type="number"
                  value={fPlt}
                  onChange={(e) => setFPlt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong>Công thức:</strong> FIB-4 = (Tuổi × AST) / (Tiểu cầu × √ALT)
            </div>
          </div>

          <div className="flex flex-col justify-between p-5 rounded-2xl bg-sky-50/70 border border-sky-200">
            <div>
              <div className="text-xs font-semibold text-sky-900 uppercase">Kết Quả Điểm FIB-4</div>
              <div className="text-4xl font-black text-slate-900 mt-2">
                {fib4Result.score !== undefined ? fib4Result.score : '--'}
              </div>
              {fib4Result.category && (
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${fib4Result.color}`}>
                  Phân tầng: {fib4Result.category}
                </div>
              )}
              <div className="mt-4 text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-sky-100">
                {fib4Result.interpretation}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-200 text-[11px] text-slate-500">
              Ngưỡng cắt: &lt; 1.30 (loại trừ xơ hóa tiến triển); &gt; 2.67 (nguy cơ cao F3-F4). Đối với người &ge; 65 tuổi: ngưỡng là 2.0 và 3.25.
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: APRI */}
      {calcTab === 'apri' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-600" />
              <span>Chỉ Số Tỷ Lệ AST / Tiểu Cầu (APRI)</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">AST của Bệnh Nhân (U/L)</label>
                <input
                  type="number"
                  value={apAst}
                  onChange={(e) => setApAst(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giới Hạn Trên Bình Thường AST (ULN AST - Mặc định 40 U/L)</label>
                <input
                  type="number"
                  value={apUln}
                  onChange={(e) => setApUln(parseFloat(e.target.value) || 40)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số Lượng Tiểu Cầu (x10^9/L)</label>
                <input
                  type="number"
                  value={apPlt}
                  onChange={(e) => setApPlt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong>Công thức:</strong> APRI = [(AST / ULN AST) × 100] / Tiểu cầu
            </div>
          </div>

          <div className="flex flex-col justify-between p-5 rounded-2xl bg-sky-50/70 border border-sky-200">
            <div>
              <div className="text-xs font-semibold text-sky-900 uppercase">Kết Quả Điểm APRI</div>
              <div className="text-4xl font-black text-slate-900 mt-2">
                {apriResult.score !== undefined ? apriResult.score : '--'}
              </div>
              <div className="mt-4 text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-sky-100">
                {apriResult.interpretation}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-200 text-[11px] text-slate-500">
              • APRI &lt; 0.5: Rất ít khả năng xơ hóa có ý nghĩa.<br/>
              • APRI &gt; 1.5: Nguy cơ cao xơ gan (F4).
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 3: CHILD-PUGH */}
      {calcTab === 'childpugh' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Đánh Giá Giai Đoạn Xơ Gan Child-Pugh
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bilirubin Toàn Phần (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cpBili}
                  onChange={(e) => setCpBili(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Albumin Máu (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cpAlb}
                  onChange={(e) => setCpAlb(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chỉ Số Đông Máu (INR)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={cpInr}
                  onChange={(e) => setCpInr(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức Độ Cổ Trướng (Tràn dịch màng bụng)
                </label>
                <select
                  value={cpAscites}
                  onChange={(e) => setCpAscites(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>Không có (1 điểm)</option>
                  <option value={2}>Lượng ít đến vừa, kiểm soát được bằng lợi tiểu (2 điểm)</option>
                  <option value={3}>Lượng nhiều / căng / kháng trị (3 điểm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bệnh Não Gan (Hôn mê gan)
                </label>
                <select
                  value={cpEnceph}
                  onChange={(e) => setCpEnceph(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>Không có (1 điểm)</option>
                  <option value={2}>Độ 1 - 2: Lẫn nhẹ, rối loạn giấc ngủ, run vỗ cánh (2 điểm)</option>
                  <option value={3}>Độ 3 - 4: Lú lẫn nặng, ngủ lơ mơ hoặc hôn mê (3 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Tổng Điểm Child-Pugh</div>
              <div className="text-4xl font-black text-slate-900 mt-2">
                {childPugh.score} điểm
              </div>
              <div className={`mt-3 p-3 rounded-xl border text-sm font-bold ${childPugh.color}`}>
                {childPugh.stage}
              </div>
              <div className="mt-4 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                <strong>Tiên lượng:</strong> {childPugh.survival}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
              • Class A: 5-6 điểm (Còn bù tốt)<br/>
              • Class B: 7-9 điểm (Tổn thương vừa)<br/>
              • Class C: 10-15 điểm (Mất bù nặng)
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 4: CALPROTECTIN */}
      {calcTab === 'calprotectin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-600" />
              <span>Phân Tầng Calprotectin Phân (IBD vs IBS)</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nồng Độ Calprotectin Phân (µg/g)
              </label>
              <input
                type="number"
                value={calVal}
                onChange={(e) => setCalVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                <strong>&lt; 50 µg/g:</strong> Bình thường. Rất ít khả năng có viêm ruột hoạt tính; gợi ý hội chứng ruột kích thích (IBS) nếu có rối loạn tiêu hóa.
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <strong>50 - 200 µg/g:</strong> Vùng ranh giới / Viêm nhẹ. Có thể do NSAIDs, polyp hoặc IBD thể nhẹ. Cần lặp lại sau 4-6 tuần.
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                <strong>&gt; 200 µg/g:</strong> Viêm niêm mạc ruột hoạt tính mạnh (IBD đợt bùng phát). Cần chỉ định nội soi đại tràng sinh thiết.
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-5 rounded-2xl bg-rose-50/60 border border-rose-200">
            <div>
              <div className="text-xs font-semibold text-rose-900 uppercase">Kết Quả Diễn Giải</div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {calVal} µg/g
              </div>
              <div className={`mt-3 p-3 rounded-xl border text-xs font-bold ${calResult.color}`}>
                Phân loại: {calResult.category}
              </div>
              <div className="mt-4 text-xs text-slate-700 bg-white p-3 rounded-xl border border-rose-100">
                {calResult.description}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-200 text-[11px] text-slate-500">
              Calprotectin là protein trong bạch cầu trung tính, có độ nhạy &gt; 90% trong việc phân biệt bệnh viêm ruột thực thể (IBD) với rối loạn chức năng (IBS).
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 5: BRISTOL STOOL SCALE */}
      {calcTab === 'bristol' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              <span>Thang Đo Hình Dạng Phân Bristol (Bristol Stool Form Scale)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuẩn vàng trong phân loại IBS theo tiêu chuẩn Rome IV (IBS-D, IBS-C, IBS-M).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {([1, 2, 3, 4, 5, 6, 7] as BristolStoolType[]).map((type) => {
              const item = BRISTOL_STOOL_SCALE[type];
              const isSelected = selectedBristol === type;
              return (
                <div
                  key={type}
                  onClick={() => setSelectedBristol(type)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded font-bold ${item.iconColor}`}>
                      {item.name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{item.category}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-2">{item.vietnameseTitle}</div>
                  <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
            <Info className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <strong>Quy tắc phân loại Rome IV:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                <li><strong>IBS-D (Tiêu chảy):</strong> &gt;25% số lần đi ngoài là Type 6 hoặc 7, và &lt;25% là Type 1 hoặc 2.</li>
                <li><strong>IBS-C (Táo bón):</strong> &gt;25% số lần đi ngoài là Type 1 hoặc 2, và &lt;25% là Type 6 hoặc 7.</li>
                <li><strong>IBS-M (Hỗn hợp):</strong> &gt;25% là Type 1/2 VÀ &gt;25% là Type 6/7.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
