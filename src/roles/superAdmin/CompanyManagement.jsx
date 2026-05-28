// src/roles/superAdmin/CompanyManagement.jsx
// Super Admin - 회사/현장 관리

import { useEffect, useState } from "react";
import { api } from "../../api/api.js";

const TABS = [
  { key: "companies", label: "회사 목록" },
  { key: "sites", label: "현장 목록" },
];

export default function CompanyManagement() {
  const [tab, setTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    company_name: "", ceo_name: "", company_contact: "", company_address: "",
  });
  const [siteForm, setSiteForm] = useState({
    site_name: "", site_address: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [companyData, siteData] = await Promise.all([
        api.getCompanies(),
        api.getSites(),
      ]);
      setCompanies(Array.isArray(companyData) ? companyData : []);
      setSites(Array.isArray(siteData) ? siteData : []);
    } catch (err) {
      setErrorMsg(err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!companyForm.company_name.trim()) { setErrorMsg("회사명을 입력해주세요."); return; }
    try {
      setSubmitting(true);
      await api.createCompany(companyForm);
      setSuccessMsg(`'${companyForm.company_name}' 회사가 등록되었습니다.`);
      setCompanyForm({ company_name: "", ceo_name: "", company_contact: "", company_address: "" });
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "회사 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!siteForm.site_name.trim()) { setErrorMsg("현장명을 입력해주세요."); return; }
    try {
      setSubmitting(true);
      await api.createSite(siteForm);
      setSuccessMsg(`'${siteForm.site_name}' 현장이 등록되었습니다.`);
      setSiteForm({ site_name: "", site_address: "" });
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "현장 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100">
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">회사/현장 관리</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">전체 회사와 현장을 등록·조회합니다.</p>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-slate-300">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => { setTab(t.key); setErrorMsg(""); setSuccessMsg(""); }}
              className={`px-7 py-4 text-[1.0625rem] font-medium transition-colors ${
                tab === t.key ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50"
              }`}>
              {t.label}
              <span className="ml-2 border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.8125rem] text-slate-600">
                {t.key === "companies" ? companies.length : sites.length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[23.75rem_1fr] gap-0 divide-x divide-slate-200 max-xl:grid-cols-1 max-xl:divide-x-0 max-xl:divide-y">
          {/* 등록 폼 */}
          <div className="p-7">
            <h2 className="mb-5 text-[1.375rem] font-semibold text-slate-900">
              {tab === "companies" ? "회사 등록" : "현장 등록"}
            </h2>

            {errorMsg && <div className="mb-4 border border-red-300 bg-red-50 px-4 py-3 text-[1rem] text-red-700">{errorMsg}</div>}
            {successMsg && <div className="mb-4 border border-green-300 bg-green-50 px-4 py-3 text-[1rem] text-green-800">{successMsg}</div>}

            {tab === "companies" ? (
              <form onSubmit={handleCompanySubmit}>
                <Field label="회사명 *" value={companyForm.company_name} onChange={(v) => setCompanyForm((p) => ({ ...p, company_name: v }))} placeholder="예: 에이티엔시스템" />
                <Field label="대표자명" value={companyForm.ceo_name} onChange={(v) => setCompanyForm((p) => ({ ...p, ceo_name: v }))} placeholder="예: 홍길동" />
                <Field label="연락처" value={companyForm.company_contact} onChange={(v) => setCompanyForm((p) => ({ ...p, company_contact: v }))} placeholder="02-0000-0000" />
                <Field label="주소" value={companyForm.company_address} onChange={(v) => setCompanyForm((p) => ({ ...p, company_address: v }))} placeholder="서울특별시 강남구" />
                <button type="submit" disabled={submitting}
                  className="mt-6 w-full border border-blue-900 bg-blue-900 py-4 text-[1.0625rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400">
                  {submitting ? "등록 중..." : "회사 등록"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSiteSubmit}>
                <Field label="현장명 *" value={siteForm.site_name} onChange={(v) => setSiteForm((p) => ({ ...p, site_name: v }))} placeholder="예: 강남 푸르지오 3차" />
                <Field label="현장 주소" value={siteForm.site_address} onChange={(v) => setSiteForm((p) => ({ ...p, site_address: v }))} placeholder="서울특별시 강남구 역삼동" />
                <button type="submit" disabled={submitting}
                  className="mt-6 w-full border border-blue-900 bg-blue-900 py-4 text-[1.0625rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400">
                  {submitting ? "등록 중..." : "현장 등록"}
                </button>
              </form>
            )}
          </div>

          {/* 목록 */}
          <div className="overflow-x-auto">
            {tab === "companies" ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["ID", "회사명", "대표자", "연락처", "주소"].map((h) => (
                      <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[0.9375rem] font-medium text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</td></tr>
                  ) : companies.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">등록된 회사가 없습니다.</td></tr>
                  ) : companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] font-medium text-blue-900">#{c.id}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1rem] font-medium text-slate-900">{c.company_name}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-700">{c.ceo_name || "-"}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.875rem] text-slate-600">{c.company_contact || "-"}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.875rem] text-slate-600">{c.company_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["ID", "현장명", "주소", "소속 회사"].map((h) => (
                      <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[0.9375rem] font-medium text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</td></tr>
                  ) : sites.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">등록된 현장이 없습니다.</td></tr>
                  ) : sites.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] font-medium text-blue-900">#{s.id}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1rem] font-medium text-slate-900">{s.site_name}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.875rem] text-slate-600">{s.site_address || "-"}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-700">{s.company_name || s.company || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mt-4">
      <label className="mb-1 block text-[1rem] font-semibold text-slate-800">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border border-slate-300 px-4 text-[1rem] focus:border-blue-900 focus:outline-none"
      />
    </div>
  );
}