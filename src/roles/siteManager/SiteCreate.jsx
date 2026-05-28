// src/roles/siteManager/SiteCreate.jsx
// 현장 등록 + 현장 목록

import { useEffect, useState } from "react";
import { api } from "../../api/api.js";

export default function SiteCreate() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    site_name: "",
    site_address: "",
  });

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await api.getSites();
      setSites(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || "현장 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSites(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.site_name.trim()) {
      setErrorMsg("현장명을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await api.createSite({
        site_name: form.site_name.trim(),
        site_address: form.site_address.trim(),
      });
      setSuccessMsg(`'${form.site_name}' 현장이 등록되었습니다.`);
      setForm({ site_name: "", site_address: "" });
      await loadSites();
    } catch (err) {
      setErrorMsg(err.message || "현장 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100">
      <div className="grid grid-cols-[25rem_1fr] gap-6 max-xl:grid-cols-1">

        {/* 등록 폼 */}
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h1 className="text-[1.75rem] font-semibold text-slate-900">현장 등록</h1>
            <p className="mt-1 text-[1rem] text-slate-600">새 현장을 등록합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-7">
            {errorMsg && (
              <div className="mb-5 border border-red-300 bg-red-50 px-4 py-3 text-[1rem] text-red-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 border border-green-300 bg-green-50 px-4 py-3 text-[1rem] text-green-800">
                {successMsg}
              </div>
            )}

            <div className="mt-2">
              <label className="mb-2 block text-[1.0625rem] font-semibold text-slate-800">현장명 *</label>
              <input
                name="site_name"
                value={form.site_name}
                onChange={handleChange}
                placeholder="예: 강남구 푸르지오 3차"
                className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-[1.0625rem] font-semibold text-slate-800">현장 주소</label>
              <input
                name="site_address"
                value={form.site_address}
                onChange={handleChange}
                placeholder="예: 서울특별시 강남구 역삼동"
                className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 w-full border border-blue-900 bg-blue-900 py-4 text-[1.125rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
            >
              {submitting ? "등록 중..." : "현장 등록"}
            </button>
          </form>
        </section>

        {/* 현장 목록 */}
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h2 className="text-[1.75rem] font-semibold text-slate-900">
              등록된 현장 목록
              <span className="ml-3 text-[1.25rem] font-normal text-slate-500">({sites.length}개)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["현장 ID", "현장명", "주소", "소속 회사"].map((h) => (
                    <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</td>
                  </tr>
                ) : sites.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">등록된 현장이 없습니다.</td>
                  </tr>
                ) : (
                  sites.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[1rem] font-medium text-blue-900">#{s.id}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">{s.site_name || "-"}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{s.site_address || "-"}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{s.company_name || s.company || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}