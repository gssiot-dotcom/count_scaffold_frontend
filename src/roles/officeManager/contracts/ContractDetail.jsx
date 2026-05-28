// src/roles/officeManager/contracts/ContractDetail.jsx
// 계약 상세 - 자재 목록 + 회차 목록

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../api/api.js";
import MovementList from "../../common/movement/MovementList.jsx";

const RENTAL_STATUS_LABEL = {
  REQUESTED: "승인 대기",
  APPROVED: "승인 완료",
  ACTIVE: "진행 중",
  CLOSED: "종료",
  CANCELLED: "취소",
};

const STATUS_STYLE = {
  ACTIVE: "border border-green-300 bg-green-50 text-green-800",
  REQUESTED: "border border-amber-300 bg-amber-50 text-amber-800",
  APPROVED: "border border-blue-300 bg-blue-50 text-blue-800",
  CLOSED: "border border-slate-300 bg-slate-100 text-slate-600",
  CANCELLED: "border border-red-300 bg-red-50 text-red-700",
};

export default function ContractDetail() {
  const { rentalId } = useParams();
  const navigate = useNavigate();

  const [rental, setRental] = useState(null);
  const [rentalDetails, setRentalDetails] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [approving, setApproving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [rentalData, detailData, movementData] = await Promise.all([
        api.getRental(rentalId),
        api.getRentalDetails(),
        api.getMovements(),
      ]);

      setRental(rentalData);

      const filtered = (Array.isArray(detailData) ? detailData : []).filter(
        (d) => String(d.rental) === String(rentalId)
      );
      setRentalDetails(filtered);

      const relatedMovements = (Array.isArray(movementData) ? movementData : []).filter(
        (m) => String(m.rental) === String(rentalId) || String(m.rental_id) === String(rentalId)
      );
      setMovements(relatedMovements);
    } catch (err) {
      setErrorMsg(err.message || "계약 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rentalId) loadData();
  }, [rentalId]);

  const handleApprove = async () => {
    if (!window.confirm(`계약 #${rentalId}을 승인하시겠습니까?`)) return;
    try {
      setApproving(true);
      await api.approveRental(rentalId);
      alert("계약이 승인되었습니다. 출고/반납 회차를 생성할 수 있습니다.");
      await loadData();
    } catch (err) {
      alert(err.message || "계약 승인에 실패했습니다.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-slate-300 bg-white px-8 py-16 text-center text-[1.25rem] text-slate-500">
        계약 정보를 불러오는 중...
      </div>
    );
  }

  if (errorMsg || !rental) {
    return (
      <div className="border border-red-300 bg-red-50 px-8 py-10 text-[1.125rem] text-red-700">
        {errorMsg || "계약을 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="bg-slate-100">
      {/* 뒤로가기 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/office-manager/contracts")}
          className="border border-slate-300 bg-white px-5 py-2 text-[1rem] text-slate-700 hover:bg-slate-50"
        >
          ← 계약 목록
        </button>
      </div>

      {/* 계약 기본 정보 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">
                계약 #{rental.id}
              </h1>
              <p className="mt-2 text-[1.125rem] text-slate-600">
                현장: {rental.site_name || rental.site || "-"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 text-[1.0625rem] font-medium ${STATUS_STYLE[rental.status] || "border border-slate-300 bg-slate-50 text-slate-700"}`}>
                {RENTAL_STATUS_LABEL[rental.status] || rental.status}
              </span>
              {rental.status === "REQUESTED" && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approving}
                  className="border border-blue-900 bg-blue-900 px-6 py-3 text-[1.0625rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
                >
                  {approving ? "승인 중..." : "계약 승인 (ACTIVE)"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 max-lg:grid-cols-2">
          <MetaCell label="요청 회사" value={rental.requester_company_name || rental.requester_company || "-"} />
          <MetaCell label="제공 회사" value={rental.provider_company_name || rental.provider_company || "-"} />
          <MetaCell label="생성일" value={rental.created_at ? new Date(rental.created_at).toLocaleDateString("ko-KR") : "-"} />
          <MetaCell label="승인자" value={rental.approved_by_name || rental.approved_by || "-"} />
        </div>
      </section>

      {/* 자재 목록 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.5rem] font-semibold text-slate-900">계약 자재 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["자재명", "규격", "계약 수량", "누적 출고", "누적 반납", "현장 잔여"].map((h) => (
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
              {rentalDetails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">
                    자재 목록이 없습니다.
                  </td>
                </tr>
              ) : (
                rentalDetails.map((d) => {
                  const siteRemain =
                    Number(d.total_site_receive_qty || 0) -
                    Number(d.total_return_qty || 0) -
                    Number(d.total_loss_qty || 0);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">
                        {d.material_name || d.material || "-"}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">
                        {d.spec || "-"}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] text-slate-800">
                        {Number(d.planned_qty || 0).toLocaleString()}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] text-blue-800">
                        {Number(d.total_out_qty || 0).toLocaleString()}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] text-amber-700">
                        {Number(d.total_return_qty || 0).toLocaleString()}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-semibold">
                        <span className={siteRemain > 0 ? "text-slate-900" : "text-slate-400"}>
                          {siteRemain.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 회차 목록 */}
      <MovementList
        movements={movements}
        loading={loading}
        basePath="/office-manager"
        title="이 계약의 출고/반납 회차"
        emptyMessage="이 계약의 회차가 없습니다."
      />
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="px-6 py-5">
      <span className="block text-[0.9375rem] text-slate-500">{label}</span>
      <strong className="mt-1 block text-[1.1875rem] font-medium text-slate-900">{value}</strong>
    </div>
  );
}