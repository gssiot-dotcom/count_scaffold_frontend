// src/roles/officeWorker/OfficeWorkerDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import MovementList from "../common/movement/MovementList.jsx";

const RENTAL_STATUS_LABEL = {
  REQUESTED: "승인 대기",
  APPROVED: "승인 완료",
  ACTIVE: "진행 중",
  CLOSED: "종료",
  CANCELLED: "취소",
};

export default function OfficeWorkerDashboard() {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [rentalData, movementData] = await Promise.all([
        api.getRentals(),
        api.getMovements(),
      ]);
      setRentals(Array.isArray(rentalData) ? rentalData : []);
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (err) {
      setErrorMsg(err.message || "대시보드 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const active = rentals.filter((r) => r.status === "ACTIVE").length;
    const requested = rentals.filter((r) => r.status === "REQUESTED").length;
    const outPending = movements.filter(
      (m) => m.movement_type === "OUT" && !m.status?.includes("COMPLETED")
    ).length;
    const returnPending = movements.filter(
      (m) => m.movement_type === "RETURN" && !m.status?.includes("COMPLETED")
    ).length;
    return { active, requested, outPending, returnPending };
  }, [rentals, movements]);

  return (
    <div className="bg-slate-100">

      {/* 헤더 */}
      <section className="mb-7 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">
                업무 대시보드
              </h1>
              <p className="mt-2 text-[1.1875rem] text-slate-600">
                담당 계약의 출고·반납 회차 현황을 확인하고 처리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/office-worker/estimate")}
                className="border border-blue-900 bg-blue-900 px-6 py-3 text-[1.0625rem] font-medium text-white hover:bg-blue-950"
              >
                견적서 업로드
              </button>
              <button
                type="button"
                onClick={() => navigate("/office-worker/create-out")}
                className="border border-slate-400 bg-white px-6 py-3 text-[1.0625rem] font-medium text-slate-800 hover:bg-slate-100"
              >
                출고 회차 생성
              </button>
              <button
                type="button"
                onClick={() => navigate("/office-worker/create-return")}
                className="border border-slate-400 bg-white px-6 py-3 text-[1.0625rem] font-medium text-slate-800 hover:bg-slate-100"
              >
                반납 회차 생성
              </button>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <StatusCell title="진행 중 계약" value={`${stats.active}건`} />
              <StatusCell title="승인 대기 계약" value={`${stats.requested}건`} warning />
              <StatusCell title="출고 처리 대기" value={`${stats.outPending}건`} warning />
              <StatusCell title="반납 처리 대기" value={`${stats.returnPending}건`} warning />
            </tr>
          </tbody>
        </table>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.125rem] text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 계약 목록 */}
      <section className="mb-7 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.625rem] font-semibold text-slate-900">담당 계약 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["현장", "요청 회사", "제공 회사", "상태"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[1.125rem] text-slate-500">
                    불러오는 중...
                  </td>
                </tr>
              ) : rentals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[1.125rem] text-slate-500">
                    담당 계약이 없습니다.
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => (
                  <tr
                    key={rental.id}
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => navigate(`/office-worker/rental`)}
                  >
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.125rem] font-medium text-blue-900">
                      #{rental.id}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-800">
                      {rental.site_name || rental.site || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-700">
                      {rental.requester_company_name || rental.requester_company || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-700">
                      {rental.provider_company_name || rental.provider_company || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5">
                      <span className={`px-3 py-1 text-[0.9375rem] font-medium border ${
                        rental.status === "ACTIVE"
                          ? "border-green-300 bg-green-50 text-green-800"
                          : rental.status === "REQUESTED"
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-slate-300 bg-slate-50 text-slate-700"
                      }`}>
                        {RENTAL_STATUS_LABEL[rental.status] || rental.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 회차 목록 */}
      <MovementList
        movements={movements}
        loading={loading}
        basePath="/office-worker"
        title="출고/반납 회차 현황"
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