// src/roles/siteWorker/SiteReturn.jsx
// 현장 반납 서명 페이지

import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api.js";

export default function SiteReturn() {
  const [movements, setMovements] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [movement, setMovement] = useState(null);
  const [details, setDetails] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await api.getMovements();
      const list = (data || []).filter(
        (m) => m.movement_type === "RETURN" && m.status === "RETURN_CREATED"
      );
      setMovements(list);
      if (list.length > 0) {
        setSelectedId(String(list[0].id));
      } else {
        setSelectedId("");
        setMovement(null);
        setDetails([]);
      }
    } catch (err) {
      alert(err.message || "반납 회차를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMovement = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getMovement(id);
      setMovement(data);
      setDetails(
        (data.movement_details || []).map((item) => ({
          movement_detail_id: item.id,
          material_name: item.material_name || "자재",
          spec: item.spec || "-",
          site_request_return_qty: Number(item.site_request_return_qty || 0),
          return_qty: Number(item.return_qty || item.site_request_return_qty || 0),
        }))
      );
    } catch (err) {
      alert(err.message || "회차 상세를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMovements(); }, []);
  useEffect(() => { if (selectedId) loadMovement(selectedId); }, [selectedId]);

  const totalQty = useMemo(
    () => details.reduce((sum, item) => sum + Number(item.return_qty || 0), 0),
    [details]
  );

  const updateQty = (index, value) => {
    setDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, return_qty: Number(value || 0) } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!movement) { alert("회차를 선택해주세요."); return; }
    if (!signatureFile) { alert("서명 파일을 첨부해주세요."); return; }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (photoFile) formData.append("photo", photoFile);
      formData.append("signature", signatureFile);
      formData.append(
        "details",
        JSON.stringify(
          details.map((item) => ({
            movement_detail_id: item.movement_detail_id,
            return_qty: Number(item.return_qty || 0),
          }))
        )
      );

      await api.siteReturnSign(movement.id, formData);
      alert("현장 반납 서명이 완료되었습니다.");
      setPhotoFile(null);
      setSignatureFile(null);
      await loadMovements();
    } catch (err) {
      alert(err.message || "반납 서명에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100">
      {/* 회차 선택 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">현장 반납 서명</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            반납할 자재 수량을 확인하고 서명합니다.
          </p>
        </div>
        <div className="p-7">
          {loading && !movement ? (
            <p className="text-[1.0625rem] text-slate-500">불러오는 중...</p>
          ) : movements.length === 0 ? (
            <div className="border border-slate-200 bg-slate-50 px-5 py-6 text-[1.0625rem] text-slate-500">
              반납 서명 대기 중인 회차가 없습니다.
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">
                반납 회차 선택
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="h-14 w-full border border-slate-300 bg-white px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none"
              >
                {movements.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    #{m.id} / {m.site_name || "현장"} / 계약#{m.rental}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {movement && (
        <>
          {/* 자재 수량 */}
          <section className="mb-6 border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
              <h2 className="text-[1.375rem] font-semibold text-slate-900">반납 수량 확인</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["자재명", "규격", "반납 요청 수량", "반납 확정 수량"].map((h) => (
                      <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.map((item, index) => (
                    <tr key={item.movement_detail_id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">
                        {item.material_name}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">
                        {item.spec}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] text-slate-700">
                        {item.site_request_return_qty}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={item.return_qty}
                          onChange={(e) => updateQty(index, e.target.value)}
                          className="h-11 w-32 border border-slate-400 px-3 text-[1rem] focus:border-blue-900 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 사진 + 서명 */}
          <section className="mb-6 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
            <FileBox title="사진" file={photoFile} setFile={setPhotoFile} />
            <FileBox title="서명" required file={signatureFile} setFile={setSignatureFile} />
          </section>

          {/* 제출 */}
          <div className="flex items-center justify-between">
            <div className="text-[1.25rem] font-semibold text-slate-800">
              총 반납 수량: <span className="text-amber-600">{totalQty}개</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="border border-amber-600 bg-amber-600 px-8 py-4 text-[1.125rem] font-medium text-white hover:bg-amber-700 disabled:bg-slate-400"
            >
              {submitting ? "처리 중..." : "현장 반납 서명 완료"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FileBox({ title, required, file, setFile }) {
  return (
    <section className="border border-slate-300 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-7 py-4">
        <h2 className="text-[1.375rem] font-semibold text-slate-800">
          {title}{required && <span className="ml-2 text-red-600">*</span>}
        </h2>
      </div>
      <div className="p-7">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border border-slate-300 p-3 text-[1rem]"
        />
        {file && <p className="mt-3 text-[0.9375rem] text-blue-800">선택된 파일: {file.name}</p>}
      </div>
    </section>
  );
}