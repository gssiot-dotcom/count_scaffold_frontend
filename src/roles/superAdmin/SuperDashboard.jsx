// src/roles/superAdmin/SuperDashboard.jsx
// Super Admin 전체 대시보드

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";

export default function SuperDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [companyData, siteData, userData, materialData, rentalData, movementData] =
          await Promise.all([
            api.getCompanies(),
            api.getSites(),
            api.getUsers(),
            api.getMaterials(),
            api.getRentals(),
            api.getMovements(),
          ]);
        setCompanies(Array.isArray(companyData) ? companyData : []);
        setSites(Array.isArray(siteData) ? siteData : []);
        setUsers(Array.isArray(userData) ? userData : []);
        setMaterials(Array.isArray(materialData) ? materialData : []);
        setRentals(Array.isArray(rentalData) ? rentalData : []);
        setMovements(Array.isArray(movementData) ? movementData : []);
      } catch (err) {
        setErrorMsg(err.message || "데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalQty = materials.reduce((s, m) => s + Number(m.total_qty || 0), 0);
    const totalLoss = materials.reduce((s, m) => s + Number(m.loss_qty || 0), 0);
    const activeRentals = rentals.filter((r) => r.status === "ACTIVE").length;
    const pendingUsers = users.filter((u) => !u.is_approved).length;
    const pendingRentals = rentals.filter((r) => r.status === "REQUESTED").length;
    const pendingMovements = movements.filter(
      (m) => !String(m.status || "").includes("COMPLETED")
    ).length;
    return { totalQty, totalLoss, activeRentals, pendingUsers, pendingRentals, pendingMovements };
  }, [materials, rentals, users, movements]);

  return (
    <div className="bg-slate-100">
      {/* 헤더 */}
      <section className="mb-7 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">전체 대시보드</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            전체 회사·현장·사용자·재고 현황을 통합 관리합니다.
          </p>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-6 divide-x divide-slate-200 max-xl:grid-cols-3 max-lg:grid-cols-2">
          <StatCell label="전체 회사" value={companies.length} unit="개" onClick={() => navigate("/super/companies")} />
          <StatCell label="전체 현장" value={sites.length} unit="개" onClick={() => navigate("/super/companies")} />
          <StatCell label="전체 사용자" value={users.length} unit="명" onClick={() => navigate("/super/users")} />
          <StatCell label="승인 대기 사용자" value={stats.pendingUsers} unit="명" warning onClick={() => navigate("/super/users")} />
          <StatCell label="진행 중 계약" value={stats.activeRentals} unit="건" onClick={() => navigate("/super/inventory")} />
          <StatCell label="전체 재고" value={stats.totalQty.toLocaleString()} unit="개" onClick={() => navigate("/super/inventory")} />
        </div>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.0625rem] text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 처리 대기 요약 */}
      <div className="mb-7 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        <AlertCard
          title="승인 대기 계약"
          value={stats.pendingRentals}
          unit="건"
          desc="견적서가 업로드되어 승인 대기 중입니다."
          onClick={() => navigate("/super/inventory")}
        />
        <AlertCard
          title="처리 대기 회차"
          value={stats.pendingMovements}
          unit="건"
          desc="서명 또는 검수가 필요한 회차입니다."
          onClick={() => navigate("/super/inventory")}
        />
        <AlertCard
          title="누적 LOSS"
          value={stats.totalLoss.toLocaleString()}
          unit="개"
          desc="전체 자재 누적 LOSS 수량입니다."
          danger
          onClick={() => navigate("/super/inventory")}
        />
      </div>

      {/* 회사 목록 요약 */}
      <section className="mb-7 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.5rem] font-semibold text-slate-900">회사 목록</h2>
            <button
              type="button"
              onClick={() => navigate("/super/companies")}
              className="border border-slate-300 bg-white px-5 py-2 text-[0.9375rem] text-slate-700 hover:bg-slate-50"
            >
              전체 보기
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["회사 ID", "회사명", "대표자", "연락처", "소속 현장 수", "소속 사용자 수"].map((h) => (
                  <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">등록된 회사가 없습니다.</td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] font-medium text-blue-900">#{c.id}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">{c.company_name || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-700">{c.ceo_name || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{c.company_contact || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                      {sites.filter((s) => String(s.company) === String(c.id)).length}개
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                      {users.filter((u) => String(u.company) === String(c.id)).length}명
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

function StatCell({ label, value, unit, warning, onClick }) {
  return (
    <div
      className="cursor-pointer px-6 py-6 hover:bg-slate-50"
      onClick={onClick}
    >
      <span className="block text-[1rem] text-slate-500">{label}</span>
      <strong className={`mt-2 block text-[1.75rem] font-semibold ${warning ? "text-amber-600" : "text-slate-900"}`}>
        {value}<span className="ml-1 text-[1.125rem] font-normal text-slate-500">{unit}</span>
      </strong>
    </div>
  );
}

function AlertCard({ title, value, unit, desc, danger, onClick }) {
  return (
    <div
      className={`cursor-pointer border bg-white p-6 hover:bg-slate-50 ${danger ? "border-red-200" : "border-slate-300"}`}
      onClick={onClick}
    >
      <p className="text-[1.0625rem] text-slate-500">{title}</p>
      <p className={`mt-2 text-[2.375rem] font-black ${danger ? "text-red-600" : "text-slate-900"}`}>
        {value}
        <span className="ml-1 text-[1.25rem] font-semibold text-slate-500">{unit}</span>
      </p>
      <p className="mt-3 text-[0.9375rem] text-slate-500">{desc}</p>
    </div>
  );
}