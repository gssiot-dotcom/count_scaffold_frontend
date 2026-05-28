// src/roles/officeManager/contracts/ContractList.jsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../../api/api.js";

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
  { key: "all", label: "전체 계약" },
  { key: "REQUESTED", label: "승인 대기" },
  { key: "ACTIVE", label: "진행 중" },
  { key: "CLOSED", label: "종료" },
];

export default function ContractList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "all";

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState(tabFromUrl);
  const [approvingId, setApprovingId] = useState(null);

  // URL 탭 파라미터 바뀌면 탭 동기화
  useEffect(() => { setTab(tabFromUrl); }, [tabFromUrl]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await api.getRentals();
      setRentals(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || "계약 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (rentalId) => {
    if (!window.confirm(`계약 #${rentalId}을 승인하시겠습니까?`)) return;
    try {
      setApprovingId(rentalId);
      await api.approveRental(rentalId);
      alert("계약이 승인되었습니다. 출고/반납 회차를 생성할 수 있습니다.");
      await loadData();
    } catch (err) {
      alert(err.message || "계약 승인에 실패했습니다.");
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = tab === "all" ? rentals : rentals.filter((r) => r.status === tab);

  return (
    <div className="bg-slate-100">
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">계약 관리</h1>
              <p className="mt-2 text-[1.1875rem] text-slate-600">전체 계약을 확인하고 승인 대기 계약을 처리합니다.</p>
            </div>
            <span className="border border-amber-300 bg-amber-50 px-5 py-3 text-[1.0625rem] font-medium text-amber-800">
              승인 대기 {rentals.filter((r) => r.status === "REQUESTED").length}건
            </span>
          </div>
        </div>

        <div className="flex border-b border-slate-300">
          {TABS.map((t) => {
            const count = t.key === "all" ? rentals.length : rentals.filter((r) => r.status === t.key).length;
            return (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`px-7 py-4 text-[1.0625rem] font-medium transition-colors ${
                  tab === t.key ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50"
                }`}>
                {t.label}
                <span className="ml-2 border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.8125rem] text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>

        {errorMsg && <div className="mx-7 mt-5 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["현장", "요청 회사", "제공 회사", "상태", "생성일", "처리"].map((h) => (
                  <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">계약 정보를 불러오는 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">표시할 계약이 없습니다.</td></tr>
              ) : filtered.map((r) => (
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
                  <td className="border-b border-slate-200 px-5 py-5">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => navigate(`/office-manager/contracts/${r.id}`)}
                        className="border border-slate-400 bg-white px-4 py-2 text-[0.9375rem] font-medium text-slate-700 hover:bg-slate-100">
                        상세
                      </button>
                      {r.status === "REQUESTED" && (
                        <button type="button" onClick={() => handleApprove(r.id)} disabled={approvingId === r.id}
                          className="border border-blue-900 bg-blue-900 px-4 py-2 text-[0.9375rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400">
                          {approvingId === r.id ? "승인 중..." : "승인"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}