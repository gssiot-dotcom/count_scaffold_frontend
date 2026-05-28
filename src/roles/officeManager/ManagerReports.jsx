// src/roles/officeManager/ManagerReports.jsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/api.js";

const TABS = [
  { key: "dispatch", label: "반출증" },
  { key: "invoice", label: "출고송장" },
  { key: "returnConfirm", label: "입고검수확인서" },
];

export default function ManagerReports() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dispatch";

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState(tabFromUrl);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => { setTab(tabFromUrl); }, [tabFromUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getMovements();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorMsg(err.message || "회차 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredMovements = movements.filter((m) => {
    if (tab === "dispatch") return m.movement_type === "OUT";
    if (tab === "invoice") return m.movement_type === "OUT" && m.status === "OUT_COMPLETED";
    if (tab === "returnConfirm") return m.movement_type === "RETURN" && m.status === "RETURN_COMPLETED";
    return false;
  });

  const handleDownload = async (movement) => {
    try {
      setDownloadingId(movement.id);
      let blob, filename;
      if (tab === "dispatch") {
        blob = await api.downloadMovementDispatch(movement.id);
        filename = `Rental${movement.rental}_OUT${movement.id}_반출증.xlsx`;
      } else if (tab === "invoice") {
        blob = await api.downloadMovementInvoice(movement.id);
        filename = `Rental${movement.rental}_OUT${movement.id}_출고송장.xlsx`;
      } else {
        blob = await api.downloadMovementReturnConfirm(movement.id);
        filename = `Rental${movement.rental}_RETURN${movement.id}_입고검수확인서.xlsx`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "다운로드에 실패했습니다.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-slate-100">
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">문서 관리</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">반출증, 출고송장, 입고검수확인서를 다운로드합니다.</p>
        </div>

        <div className="flex border-b border-slate-300">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`px-7 py-4 text-[1.0625rem] font-medium transition-colors ${
                tab === t.key ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-7 py-3">
          <p className="text-[0.9375rem] text-slate-500">
            {tab === "dispatch" && "모든 출고 회차에 대해 반출증을 다운로드할 수 있습니다."}
            {tab === "invoice" && "출고 완료 상태의 회차에서 출고송장을 다운로드할 수 있습니다."}
            {tab === "returnConfirm" && "반납 완료 상태의 회차에서 입고검수확인서를 다운로드할 수 있습니다."}
          </p>
        </div>

        {errorMsg && <div className="mx-7 mt-5 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["유형", "현장", "상태", "생성일", "다운로드"].map((h) => (
                  <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">불러오는 중...</td></tr>
              ) : filteredMovements.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">다운로드 가능한 문서가 없습니다.</td></tr>
              ) : filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-blue-900">#{m.id}</td>
                  <td className="border-b border-slate-200 px-5 py-4">
                    <span className={`px-2 py-1 text-[0.875rem] font-semibold ${m.movement_type === "OUT" ? "bg-blue-900 text-white" : "bg-amber-600 text-white"}`}>
                      {m.movement_type === "OUT" ? "출고" : "반납"}
                    </span>
                  </td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">#{m.rental || "-"}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-800">{m.site_name || m.site || "-"}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{m.status}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString("ko-KR") : "-"}
                  </td>
                  <td className="border-b border-slate-200 px-5 py-4">
                    <button type="button" onClick={() => handleDownload(m)} disabled={downloadingId === m.id}
                      className="border border-blue-900 bg-white px-4 py-2 text-[0.9375rem] font-medium text-blue-900 hover:bg-blue-50 disabled:border-slate-300 disabled:text-slate-400">
                      {downloadingId === m.id ? "다운로드 중..." : "⬇ 다운로드"}
                    </button>
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