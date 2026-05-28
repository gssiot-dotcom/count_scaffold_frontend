// src/roles/siteWorker/WorkerSubmitHistory.jsx
// 현장 직원 - 제출 내역

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";

const STATUS_LABEL = {
  OUT_CREATED: "출고 생성",
  OUT_OFFICE_CHECKED: "사무실 확인",
  OUT_OFFICE_SIGNED: "사무실 서명",
  OUT_IN_TRANSIT: "이동 중",
  OUT_SITE_RECEIVED: "수령 확인",
  OUT_SITE_SIGNED: "현장 서명",
  OUT_COMPLETED: "출고 완료",
  RETURN_CREATED: "반납 생성",
  RETURN_SITE_CHECKED: "현장 확인",
  RETURN_SITE_SIGNED: "현장 서명",
  RETURN_IN_TRANSIT: "이동 중",
  RETURN_FACTORY_CHECKED: "검수 완료",
  RETURN_OFFICE_SIGNED: "사무실 서명",
  RETURN_COMPLETED: "반납 완료",
};

function getStatusStyle(status = "") {
  if (status.includes("COMPLETED")) return "border border-green-300 bg-green-50 text-green-800";
  if (status.includes("SIGNED")) return "border border-blue-300 bg-blue-50 text-blue-800";
  if (status.includes("TRANSIT")) return "border border-amber-300 bg-amber-50 text-amber-800";
  return "border border-slate-300 bg-slate-50 text-slate-700";
}

const FILTER_TABS = [
  { key: "all", label: "전체" },
  { key: "OUT", label: "출고" },
  { key: "RETURN", label: "반납" },
];

export default function WorkerSubmitHistory() {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getMovements();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorMsg(err.message || "내역을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered =
    filterTab === "all"
      ? movements
      : movements.filter((m) => m.movement_type === filterTab);

  return (
    <div className="bg-slate-100">
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">제출 내역</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            출고 수령 및 반납 처리 이력을 확인합니다.
          </p>
        </div>

        {/* 필터 탭 */}
        <div className="flex border-b border-slate-300">
          {FILTER_TABS.map((t) => {
            const count =
              t.key === "all"
                ? movements.length
                : movements.filter((m) => m.movement_type === t.key).length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilterTab(t.key)}
                className={`px-7 py-4 text-[1.0625rem] font-medium transition-colors ${
                  filterTab === t.key
                    ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
                <span className="ml-2 border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.8125rem] text-slate-600">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mx-7 mt-5 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["유형","현장", "상태", "날짜", "상세"].map((h) => (
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
                  <td colSpan={7} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">
                    불러오는 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">
                    내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50">
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-blue-900">
                      #{m.id}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      <span className={`px-2 py-1 text-[0.875rem] font-semibold ${
                        m.movement_type === "OUT" ? "bg-blue-900 text-white" : "bg-amber-600 text-white"
                      }`}>
                        {m.movement_type === "OUT" ? "출고" : "반납"}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                      #{m.rental || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-800">
                      {m.site_name || m.site || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      <span className={`px-3 py-1 text-[0.875rem] font-medium ${getStatusStyle(m.status)}`}>
                        {STATUS_LABEL[m.status] || m.status}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-500">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/site-worker/movements/${m.id}`)}
                        className="border border-slate-400 bg-white px-4 py-2 text-[0.9375rem] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        보기
                      </button>
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