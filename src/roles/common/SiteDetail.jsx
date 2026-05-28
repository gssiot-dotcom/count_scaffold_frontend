// src/roles/common/SiteDetail.jsx
// 현장 상세 페이지 (공통)
// 사용처: officeManager, officeWorker 등

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import MovementList from "./movement/MovementList.jsx";

export default function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [movements, setMovements] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!siteId) return;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const [siteList, rentalData, movementData] = await Promise.all([
          api.getSites(),
          api.getRentals(),
          api.getMovements(),
        ]);

        const found = (siteList || []).find((s) => String(s.id) === String(siteId));
        setSite(found || null);

        const siteRentals = (rentalData || []).filter(
          (r) => String(r.site) === String(siteId) || String(r.site_id) === String(siteId)
        );
        setRentals(siteRentals);

        const rentalIds = new Set(siteRentals.map((r) => r.id));
        const siteMovements = (movementData || []).filter((m) =>
          rentalIds.has(m.rental || m.rental_id)
        );
        setMovements(siteMovements);
      } catch (err) {
        setErrorMsg(err.message || "현장 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [siteId]);

  if (loading) {
    return (
      <div className="bg-slate-100 p-8">
        <div className="border border-slate-300 bg-white px-8 py-16 text-center text-[1.25rem] text-slate-500">
          현장 정보를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (errorMsg || !site) {
    return (
      <div className="bg-slate-100 p-8">
        <div className="border border-red-300 bg-red-50 px-8 py-10 text-[1.125rem] text-red-700">
          {errorMsg || "현장을 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100">

      {/* 뒤로가기 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-slate-300 bg-white px-5 py-2 text-[1rem] text-slate-700 hover:bg-slate-50"
        >
          ← 목록으로
        </button>
      </div>

      {/* 현장 기본 정보 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">
            {site.site_name || "-"}
          </h1>
          <p className="mt-2 text-[1.125rem] text-slate-600">
            현장 상세 정보 및 계약/회차 현황
          </p>
        </div>

        <div className="grid grid-cols-4 divide-x divide-slate-200 max-lg:grid-cols-2">
          <MetaCell label="현장 ID" value={`#${site.id}`} />
          <MetaCell label="주소" value={site.site_address || "-"} />
          <MetaCell label="소속 회사" value={site.company_name || site.company || "-"} />
          <MetaCell label="진행 중 계약" value={`${rentals.filter((r) => r.status === "ACTIVE").length}건`} />
        </div>
      </section>

      {/* 계약 목록 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.5rem] font-semibold text-slate-900">
            연결된 계약 목록
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[ "상태", "요청 회사", "제공 회사", "생성일"].map((h) => (
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
              {rentals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[1.0625rem] text-slate-500">
                    연결된 계약이 없습니다.
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-blue-50">
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-blue-900">
                      #{rental.id}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      <StatusBadge status={rental.status} />
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                      {rental.requester_company_name || rental.requester_company || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                      {rental.provider_company_name || rental.provider_company || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-500">
                      {rental.created_at
                        ? new Date(rental.created_at).toLocaleDateString("ko-KR")
                        : "-"}
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
        basePath={window.location.pathname.includes("office-manager")
          ? "/office-manager"
          : "/office-worker"}
        title="현장 출고/반납 회차"
        emptyMessage="이 현장의 회차가 없습니다."
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

const RENTAL_STATUS_LABEL = {
  REQUESTED: "승인 대기",
  APPROVED: "승인 완료",
  ACTIVE: "진행 중",
  CLOSED: "종료",
  CANCELLED: "취소",
};

function StatusBadge({ status }) {
  const styleMap = {
    ACTIVE: "border border-green-300 bg-green-50 text-green-800",
    REQUESTED: "border border-amber-300 bg-amber-50 text-amber-800",
    APPROVED: "border border-blue-300 bg-blue-50 text-blue-800",
    CLOSED: "border border-slate-300 bg-slate-100 text-slate-600",
    CANCELLED: "border border-red-300 bg-red-50 text-red-700",
  };
  return (
    <span className={`px-3 py-1 text-[0.9375rem] font-medium ${styleMap[status] || "border border-slate-300 bg-slate-50 text-slate-700"}`}>
      {RENTAL_STATUS_LABEL[status] || status || "-"}
    </span>
  );
}