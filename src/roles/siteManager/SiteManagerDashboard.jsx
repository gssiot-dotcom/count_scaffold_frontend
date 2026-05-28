// src/roles/siteManager/SiteManagerDashboard.jsx
// 현장 총책임자 대시보드

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getLoginUser } from "../../api/api.js";
import MovementList from "../common/movement/MovementList.jsx";

export default function SiteManagerDashboard() {
  const navigate = useNavigate();
  const me = getLoginUser();

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await api.getMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const receiveWaiting = movements.filter(
      (m) => m.movement_type === "OUT" && m.status === "OUT_IN_TRANSIT"
    ).length;
    const returnWaiting = movements.filter(
      (m) => m.movement_type === "RETURN" && m.status === "RETURN_CREATED"
    ).length;
    const outTotal = movements.filter((m) => m.movement_type === "OUT").length;
    const returnTotal = movements.filter((m) => m.movement_type === "RETURN").length;
    return { receiveWaiting, returnWaiting, outTotal, returnTotal };
  }, [movements]);

  return (
    <div className="bg-slate-100">
      {/* 헤더 */}
      <section className="mb-7 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">
                현장 대시보드
              </h1>
              <p className="mt-2 text-[1.1875rem] text-slate-600">
                현장 수령·반납 서명 및 직원 관리를 처리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/site-manager/approval")}
                className="border border-blue-900 bg-blue-900 px-6 py-3 text-[1.0625rem] font-medium text-white hover:bg-blue-950"
              >
                서명 승인 처리
              </button>
              <button
                type="button"
                onClick={() => navigate("/site-manager/roles")}
                className="border border-slate-400 bg-white px-6 py-3 text-[1.0625rem] font-medium text-slate-800 hover:bg-slate-100"
              >
                직원 관리
              </button>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <StatusCell title="수령 서명 대기" value={`${stats.receiveWaiting}건`} warning />
              <StatusCell title="반납 서명 대기" value={`${stats.returnWaiting}건`} warning />
              <StatusCell title="전체 출고 회차" value={`${stats.outTotal}건`} />
              <StatusCell title="전체 반납 회차" value={`${stats.returnTotal}건`} />
            </tr>
          </tbody>
        </table>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.125rem] text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 서명 대기 회차 강조 */}
      {stats.receiveWaiting > 0 && (
        <section className="mb-7 border border-amber-300 bg-amber-50">
          <div className="border-b border-amber-300 bg-amber-100 px-7 py-4">
            <h2 className="text-[1.375rem] font-semibold text-amber-900">
              ⚠ 현장 수령 서명 대기 {stats.receiveWaiting}건
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[ "현장", "상태", "서명"].map((h) => (
                    <th key={h} className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-left text-[1rem] font-medium text-amber-800">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements
                  .filter((m) => m.movement_type === "OUT" && m.status === "OUT_IN_TRANSIT")
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-amber-100">
                      <td className="border-b border-amber-200 px-5 py-4 text-[1.0625rem] font-medium text-blue-900">#{m.id}</td>
                      <td className="border-b border-amber-200 px-5 py-4 text-[1rem] text-slate-700">#{m.rental || "-"}</td>
                      <td className="border-b border-amber-200 px-5 py-4 text-[1rem] text-slate-700">{m.site_name || m.site || "-"}</td>
                      <td className="border-b border-amber-200 px-5 py-4 text-[0.9375rem] text-amber-700">이동 중</td>
                      <td className="border-b border-amber-200 px-5 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/site-manager/movements/${m.id}`)}
                          className="border border-blue-900 bg-blue-900 px-4 py-2 text-[0.9375rem] font-medium text-white hover:bg-blue-950"
                        >
                          서명하기
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 전체 회차 목록 */}
      <MovementList
        movements={movements}
        loading={loading}
        basePath="/site-manager"
        title="현장 출고/반납 회차 전체"
      />
    </div>
  );
}

function StatusCell({ title, value, warning }) {
  return (
    <td className="border-r border-slate-300 px-7 py-6 last:border-r-0">
      <span className="block text-[1.0625rem] text-slate-500">{title}</span>
      <strong className={`mt-2 block text-[2rem] font-semibold ${warning ? "text-amber-600" : "text-slate-900"}`}>
        {value}
      </strong>
    </td>
  );
}