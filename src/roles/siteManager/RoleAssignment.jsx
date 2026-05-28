// src/roles/siteManager/RoleAssignment.jsx
// 현장 총책임자 - 현장 직원 승인 + 현장 배정

import { useEffect, useState } from "react";
import { api } from "../../api/api.js";

const TABS = [
  { key: "pending", label: "승인 대기" },
  { key: "all", label: "전체 직원" },
];

export default function SiteRoleAssignment() {
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState("pending");
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [userData, siteData] = await Promise.all([
        api.getUsers(),
        api.getSites(),
      ]);
      // 현장 직원만 표시
      const siteUsers = (Array.isArray(userData) ? userData : []).filter(
        (u) => u.role === "siteWorker" || u.role === "siteManager"
      );
      setUsers(siteUsers);
      setSites(Array.isArray(siteData) ? siteData : []);
    } catch (err) {
      setErrorMsg(err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (userId) => {
    try {
      setProcessingId(userId);
      await api.approveUser(userId);
      await loadData();
    } catch (err) {
      alert(err.message || "승인에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSiteAssign = async (userId, siteId) => {
    try {
      setProcessingId(userId);
      await api.assignSite(userId, siteId || null);
      await loadData();
    } catch (err) {
      alert(err.message || "현장 배정에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingUsers = users.filter((u) => !u.is_approved);
  const displayUsers = tab === "pending" ? pendingUsers : users;

  return (
    <div className="bg-slate-100">
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">현장 직원 승인/배정</h1>
              <p className="mt-2 text-[1.1875rem] text-slate-600">
                현장 직원을 승인하고 담당 현장을 배정합니다.
              </p>
            </div>
            {pendingUsers.length > 0 && (
              <span className="border border-amber-300 bg-amber-50 px-5 py-3 text-[1.0625rem] font-medium text-amber-800">
                승인 대기 {pendingUsers.length}명
              </span>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-slate-300">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-7 py-4 text-[1.0625rem] font-medium transition-colors ${
                tab === t.key
                  ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
              <span className="ml-2 border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.8125rem] text-slate-600">
                {t.key === "pending" ? pendingUsers.length : users.length}
              </span>
            </button>
          ))}
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
                {["이름", "이메일", "연락처", "권한", "현장 배정", "승인 상태", "상태"].map((h) => (
                  <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">불러오는 중...</td>
                </tr>
              ) : displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">
                    {tab === "pending" ? "승인 대기 중인 직원이 없습니다." : "등록된 현장 직원이 없습니다."}
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">{user.name || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{user.email || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{user.phone || "-"}</td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-700">
                      {user.role === "siteManager" ? "현장 총책임자" : "현장 직원"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      <select
                        value={user.site || ""}
                        onChange={(e) => handleSiteAssign(user.id, e.target.value)}
                        disabled={processingId === user.id}
                        className="h-9 border border-slate-300 bg-white px-2 text-[0.875rem] focus:border-blue-900 focus:outline-none disabled:bg-slate-100"
                      >
                        <option value="">배정 없음</option>
                        {sites.map((s) => (
                          <option key={s.id} value={String(s.id)}>{s.site_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      <span className={`px-3 py-1 text-[0.875rem] font-medium border ${
                        user.is_approved
                          ? "border-green-300 bg-green-50 text-green-800"
                          : "border-amber-300 bg-amber-50 text-amber-800"
                      }`}>
                        {user.is_approved ? "승인됨" : "대기 중"}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4">
                      {!user.is_approved && (
                        <button
                          type="button"
                          onClick={() => handleApprove(user.id)}
                          disabled={processingId === user.id}
                          className="border border-blue-900 bg-blue-900 px-4 py-2 text-[0.875rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
                        >
                          {processingId === user.id ? "처리 중..." : "승인"}
                        </button>
                      )}
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