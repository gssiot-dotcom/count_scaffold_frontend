// src/roles/superAdmin/GlobalInventory.jsx
// Super Admin - 전체 재고 현황 + 시각화

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "../../api/api.js";

const COLORS = {
  total: "#1e3a8a",
  loss: "#dc2626",
  repaired: "#d97706",
  disposed: "#6b7280",
};

// 커스텀 툴팁
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-slate-200 bg-white px-4 py-3 shadow-lg text-[0.875rem]">
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString()}개
        </p>
      ))}
    </div>
  );
}

export default function GlobalInventory() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchText, setSearchText] = useState("");
  const [chartType, setChartType] = useState("bar"); // "bar" | "pie"

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getMaterials();
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorMsg(err.message || "재고 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = useMemo(() => ({
    total: materials.reduce((s, m) => s + Number(m.total_qty || 0), 0),
    loss: materials.reduce((s, m) => s + Number(m.loss_qty || 0), 0),
    repaired: materials.reduce((s, m) => s + Number(m.repaired_qty || 0), 0),
    disposed: materials.reduce((s, m) => s + Number(m.disposed_qty || 0), 0),
  }), [materials]);

  // 막대 차트용 데이터 — 상위 10개 자재
  const barData = useMemo(() =>
    [...materials]
      .sort((a, b) => Number(b.total_qty || 0) - Number(a.total_qty || 0))
      .slice(0, 10)
      .map((m) => ({
        name: m.material_name?.length > 10
          ? m.material_name.slice(0, 10) + "…"
          : (m.material_name || "-"),
        전체: Number(m.total_qty || 0),
        LOSS: Number(m.loss_qty || 0),
        수리: Number(m.repaired_qty || 0),
        폐기: Number(m.disposed_qty || 0),
      })),
    [materials]
  );

  // 파이 차트용 데이터 — 재고 상태 비율
  const pieData = useMemo(() => {
    const normal = summary.total - summary.loss - summary.repaired - summary.disposed;
    return [
      { name: "정상 재고", value: Math.max(normal, 0), color: "#1e3a8a" },
      { name: "LOSS", value: summary.loss, color: "#dc2626" },
      { name: "수리 중", value: summary.repaired, color: "#d97706" },
      { name: "폐기", value: summary.disposed, color: "#6b7280" },
    ].filter((d) => d.value > 0);
  }, [summary]);

  // 회사별 재고 파이 차트
  const companyPieData = useMemo(() => {
    const map = {};
    materials.forEach((m) => {
      const company = m.company_name || m.company || "미분류";
      if (!map[company]) map[company] = 0;
      map[company] += Number(m.total_qty || 0);
    });
    const colors = ["#1e3a8a", "#0284c7", "#059669", "#d97706", "#7c3aed", "#db2777"];
    return Object.entries(map).map(([name, value], i) => ({
      name, value, color: colors[i % colors.length],
    }));
  }, [materials]);

  const filtered = useMemo(() =>
    searchText.trim()
      ? materials.filter((m) => (m.material_name || "").includes(searchText.trim()))
      : materials,
    [materials, searchText]
  );

  return (
    <div className="bg-slate-100">

      {/* 요약 카드 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">전체 재고 현황</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">전체 자재 재고와 손실 현황을 확인합니다.</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-200 max-lg:grid-cols-2">
          <SummaryCell label="전체 재고" value={summary.total.toLocaleString()} unit="개" />
          <SummaryCell label="누적 LOSS" value={summary.loss.toLocaleString()} unit="개" danger />
          <SummaryCell label="수리 중" value={summary.repaired.toLocaleString()} unit="개" warning />
          <SummaryCell label="폐기" value={summary.disposed.toLocaleString()} unit="개" muted />
        </div>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
      )}

      {/* 차트 섹션 */}
      {!loading && materials.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-6 max-xl:grid-cols-1">

          {/* 자재별 재고 막대 차트 */}
          <section className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-slate-50 px-6 py-4">
              <h2 className="text-[1.25rem] font-semibold text-slate-900">자재별 재고 현황 (상위 10개)</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                  <Bar dataKey="전체" fill={COLORS.total} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="LOSS" fill={COLORS.loss} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="수리" fill={COLORS.repaired} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="폐기" fill={COLORS.disposed} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 재고 상태 파이 차트 */}
          <section className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-slate-50 px-6 py-4">
              <h2 className="text-[1.25rem] font-semibold text-slate-900">재고 상태 비율</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()}개`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* 범례 */}
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[0.875rem] text-slate-700">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                    {d.name}: {d.value.toLocaleString()}개
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 회사별 재고 파이 차트 */}
          {companyPieData.length > 1 && (
            <section className="border border-slate-300 bg-white max-xl:col-span-1">
              <div className="border-b border-slate-300 bg-slate-50 px-6 py-4">
                <h2 className="text-[1.25rem] font-semibold text-slate-900">회사별 재고 비율</h2>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={companyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {companyPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}개`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* LOSS/수리/폐기 비교 막대 차트 */}
          <section className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-slate-50 px-6 py-4">
              <h2 className="text-[1.25rem] font-semibold text-slate-900">손실 현황 비교</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[
                    { name: "LOSS", value: summary.loss, fill: "#dc2626" },
                    { name: "수리 중", value: summary.repaired, fill: "#d97706" },
                    { name: "폐기", value: summary.disposed, fill: "#6b7280" },
                  ]}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 13, fill: "#475569" }} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}개`, "수량"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[
                      { fill: "#dc2626" },
                      { fill: "#d97706" },
                      { fill: "#6b7280" },
                    ].map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {/* 자재 목록 테이블 */}
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[1.5rem] font-semibold text-slate-900">자재별 상세 재고</h2>
            <input
              type="text"
              placeholder="자재명 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 w-56 border border-slate-300 px-4 text-[0.9375rem] focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["자재명", "규격", "전체 수량", "LOSS", "수리", "폐기", "단가", "소속 회사"].map((h) => (
                  <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[0.9375rem] font-medium text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">{searchText ? "검색 결과가 없습니다." : "등록된 자재가 없습니다."}</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem] font-medium text-slate-900">{m.material_name || "-"}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[0.875rem] text-slate-600">{m.spec || "-"}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem] font-semibold text-slate-900">{Number(m.total_qty || 0).toLocaleString()}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem]">
                    <span className={Number(m.loss_qty) > 0 ? "font-semibold text-red-600" : "text-slate-400"}>{Number(m.loss_qty || 0).toLocaleString()}</span>
                  </td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem]">
                    <span className={Number(m.repaired_qty) > 0 ? "font-semibold text-amber-600" : "text-slate-400"}>{Number(m.repaired_qty || 0).toLocaleString()}</span>
                  </td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem]">
                    <span className={Number(m.disposed_qty) > 0 ? "font-semibold text-red-600" : "text-slate-400"}>{Number(m.disposed_qty || 0).toLocaleString()}</span>
                  </td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-700">{m.price ? `${Number(m.price).toLocaleString()}원` : "-"}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[0.875rem] text-slate-600">{m.company_name || m.company || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCell({ label, value, unit, danger, warning, muted }) {
  return (
    <div className="px-7 py-6">
      <span className="block text-[1rem] text-slate-500">{label}</span>
      <strong className={`mt-2 block text-[1.875rem] font-semibold ${
        danger ? "text-red-600" : warning ? "text-amber-600" : muted ? "text-slate-500" : "text-slate-900"
      }`}>
        {value}<span className="ml-1 text-[1.125rem] font-normal text-slate-500">{unit}</span>
      </strong>
    </div>
  );
}