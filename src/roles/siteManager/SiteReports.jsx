// src/roles/siteManager/SiteReports.jsx
// 현장 보고서 - 출고/반납 회차 목록 + 상세 이동

import { useEffect, useState } from "react";
import { api } from "../../api/api.js";
import MovementList from "../common/movement/MovementList.jsx";

export default function SiteReports() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getMovements();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorMsg(err.message || "보고서 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const outCount = movements.filter((m) => m.movement_type === "OUT").length;
  const returnCount = movements.filter((m) => m.movement_type === "RETURN").length;
  const completedCount = movements.filter((m) =>
    m.status === "OUT_COMPLETED" || m.status === "RETURN_COMPLETED"
  ).length;

  return (
    <div className="bg-slate-100">
      {/* 요약 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">현장 보고서</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            현장의 출고·반납 회차 이력을 확인합니다.
          </p>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <SummaryCell label="전체 회차" value={`${movements.length}건`} />
              <SummaryCell label="출고 회차" value={`${outCount}건`} />
              <SummaryCell label="반납 회차" value={`${returnCount}건`} />
              <SummaryCell label="완료 회차" value={`${completedCount}건`} />
            </tr>
          </tbody>
        </table>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.0625rem] text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 필터 */}
      <div className="mb-4 flex gap-3">
        {[
          { key: "all", label: "전체" },
          { key: "OUT", label: "출고회차" },
          { key: "RETURN", label: "반납회차" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterType(f.key)}
            className={`border px-5 py-2 text-[1rem] font-medium transition-colors ${
              filterType === f.key
                ? "border-blue-900 bg-blue-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <MovementList
        movements={movements}
        loading={loading}
        basePath="/site-manager"
        title="회차 목록"
        filterType={filterType === "all" ? null : filterType}
        emptyMessage="회차 이력이 없습니다."
      />
    </div>
  );
}

function SummaryCell({ label, value }) {
  return (
    <td className="border-r border-slate-300 px-7 py-6 last:border-r-0">
      <span className="block text-[1.0625rem] text-slate-500">{label}</span>
      <strong className="mt-2 block text-[1.875rem] font-semibold text-slate-900">{value}</strong>
    </td>
  );
}