// src/roles/officeWorker/OfficeInventory.jsx
// 담당 재고관리 페이지

import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/api.js";

export default function OfficeInventory() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchText, setSearchText] = useState("");

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

  const filtered = useMemo(() => {
    if (!searchText.trim()) return materials;
    return materials.filter((m) =>
      (m.material_name || "").includes(searchText.trim())
    );
  }, [materials, searchText]);

  const summary = useMemo(() => {
    const total = materials.reduce((s, m) => s + Number(m.total_qty || 0), 0);
    const loss = materials.reduce((s, m) => s + Number(m.loss_qty || 0), 0);
    const repaired = materials.reduce((s, m) => s + Number(m.repaired_qty || 0), 0);
    const disposed = materials.reduce((s, m) => s + Number(m.disposed_qty || 0), 0);
    return { total, loss, repaired, disposed };
  }, [materials]);

  return (
    <div className="bg-slate-100">

      {/* 요약 통계 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">담당 재고관리</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            전체 자재 재고 현황 및 LOSS·파손 수량을 확인합니다.
          </p>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <SummaryCell label="전체 재고" value={`${summary.total.toLocaleString()}개`} />
              <SummaryCell label="누적 LOSS" value={`${summary.loss.toLocaleString()}개`} danger />
              <SummaryCell label="수리 중" value={`${summary.repaired.toLocaleString()}개`} warning />
              <SummaryCell label="폐기" value={`${summary.disposed.toLocaleString()}개`} danger />
            </tr>
          </tbody>
        </table>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.0625rem] text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 자재 목록 */}
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[1.625rem] font-semibold text-slate-900">자재별 재고 상세</h2>
            <input
              type="text"
              placeholder="자재명 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-11 w-64 border border-slate-300 px-4 text-[1rem] focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["자재명", "규격", "전체 수량", "LOSS", "수리", "폐기", "단가"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[1.125rem] text-slate-500">
                    재고 정보를 불러오는 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[1.125rem] text-slate-500">
                    {searchText ? "검색 결과가 없습니다." : "등록된 자재가 없습니다."}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">
                      {m.material_name || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-600">
                      {m.spec || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-semibold text-slate-900">
                      {Number(m.total_qty || 0).toLocaleString()}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">
                      <span className={Number(m.loss_qty) > 0 ? "font-semibold text-red-600" : "text-slate-500"}>
                        {Number(m.loss_qty || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">
                      <span className={Number(m.repaired_qty) > 0 ? "font-semibold text-amber-600" : "text-slate-500"}>
                        {Number(m.repaired_qty || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">
                      <span className={Number(m.disposed_qty) > 0 ? "font-semibold text-red-600" : "text-slate-500"}>
                        {Number(m.disposed_qty || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                      {m.price ? `${Number(m.price).toLocaleString()}원` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCell({ label, value, danger, warning }) {
  return (
    <td className="border-r border-slate-300 px-7 py-6 last:border-r-0">
      <span className="block text-[1.0625rem] text-slate-500">{label}</span>
      <strong className={`mt-2 block text-[2rem] font-semibold ${
        danger ? "text-red-600" : warning ? "text-amber-600" : "text-slate-900"
      }`}>
        {value}
      </strong>
    </td>
  );
}