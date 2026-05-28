// src/roles/officeWorker/RentalReturn.jsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/api.js";
import MovementList from "../common/movement/MovementList.jsx";

const RENTAL_STATUS_LABEL = {
  REQUESTED: "승인 대기", APPROVED: "승인 완료", ACTIVE: "진행 중",
  CLOSED: "종료", CANCELLED: "취소",
};
const STATUS_STYLE = {
  ACTIVE: "border border-green-300 bg-green-50 text-green-800",
  REQUESTED: "border border-amber-300 bg-amber-50 text-amber-800",
  APPROVED: "border border-blue-300 bg-blue-50 text-blue-800",
  CLOSED: "border border-slate-300 bg-slate-100 text-slate-600",
  CANCELLED: "border border-red-300 bg-red-50 text-red-700",
};
const TABS = [
  { key: "contracts", label: "계약 목록" },
  { key: "out", label: "출고 회차" },
  { key: "return", label: "반납 회차" },
];

export default function RentalReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "contracts";

  const [tab, setTab] = useState(tabFromUrl);
  const [rentals, setRentals] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { setTab(tabFromUrl); }, [tabFromUrl]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [rentalData, movementData] = await Promise.all([api.getRentals(), api.getMovements()]);
      setRentals(Array.isArray(rentalData) ? rentalData : []);
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (err) {
      setErrorMsg(err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="bg-slate-100">
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">계약/회차 처리</h1>
              <p className="mt-2 text-[1.1875rem] text-slate-600">계약별 출고·반납 회차를 확인하고 처리합니다.</p>
            </div>
            <div />
          </div>
        </div>

        <div className="flex border-b border-slate-300">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`px-8 py-4 text-[1.125rem] font-medium transition-colors ${
                tab === t.key ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50"
              }`}>
              {t.label}
              {t.key === "contracts" && <span className="ml-2 border border-slate-300 bg-slate-100 px-2 py-0.5 text-[0.875rem] text-slate-600">{rentals.length}</span>}
              {t.key === "out" && <span className="ml-2 border border-blue-200 bg-blue-50 px-2 py-0.5 text-[0.875rem] text-blue-700">{movements.filter((m) => m.movement_type === "OUT").length}</span>}
              {t.key === "return" && <span className="ml-2 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.875rem] text-amber-700">{movements.filter((m) => m.movement_type === "RETURN").length}</span>}
            </button>
          ))}
        </div>
      </section>

      {errorMsg && <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>}

      {tab === "contracts" && (
        <section className="border border-slate-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["현장", "요청 회사", "제공 회사", "상태", "생성일"].map((h) => (
                    <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[1.125rem] text-slate-500">불러오는 중...</td></tr>
                ) : rentals.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[1.125rem] text-slate-500">계약이 없습니다.</td></tr>
                ) : rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50">
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-800">{r.site_name || r.site || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-700">{r.requester_company_name || r.requester_company || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-700">{r.provider_company_name || r.provider_company || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-5">
                      <span className={`px-3 py-1 text-[0.9375rem] font-medium ${STATUS_STYLE[r.status] || "border border-slate-300 bg-slate-50 text-slate-700"}`}>
                        {RENTAL_STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[0.9375rem] text-slate-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("ko-KR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "out" && (
        <MovementList movements={movements} loading={loading} basePath="/office-worker"
          title="출고 회차 목록" filterType="OUT" emptyMessage="출고 회차가 없습니다." />
      )}
      {tab === "return" && (
        <MovementList movements={movements} loading={loading} basePath="/office-worker"
          title="반납 회차 목록" filterType="RETURN" emptyMessage="반납 회차가 없습니다." />
      )}
    </div>
  );
}