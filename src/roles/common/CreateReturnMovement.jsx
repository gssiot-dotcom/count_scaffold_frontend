// src/roles/common/CreateReturnMovement.jsx
// 반납 회차 생성 — officeManager 전용
// 생성 후: AI 검수(return_site) → 현장 서명(SiteApproval) → 사무실 총책임자 서명(FinalApproval tab=in)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";

export default function CreateReturnMovement() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        const data = await api.getReturnRequests();
        const pending = (Array.isArray(data) ? data : []).filter((r) => r.status === "PENDING");
        setRequests(pending);
      } catch (err) {
        setErrorMsg(err.message || "반납 신청 목록을 불러오지 못했습니다.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectRequest = (req) => {
    setSelected(req);
    setDetails(
      (req.details || []).map((d) => ({
        rental_detail_id: d.rental_detail_id ?? d.rental_detail,
        material_name: d.material_name || "자재",
        spec: d.material_spec || d.spec || "-",
        request_qty: d.request_qty || 0,
      }))
    );
    setErrorMsg("");
  };

  const updateQty = (index, value) => {
    setDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, request_qty: Math.max(0, Number(value)) } : item
      )
    );
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!selected) { setErrorMsg("반납 신청을 선택해주세요."); return; }
    if (details.every((d) => Number(d.request_qty) === 0)) {
      setErrorMsg("반납 수량을 1개 이상 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("rental_id", String(selected.rental || selected.rental_id));
      formData.append("return_request_id", String(selected.id));
      formData.append(
        "details",
        JSON.stringify(
          details
            .filter((d) => Number(d.request_qty) > 0)
            .map((d) => ({
              rental_detail_id: d.rental_detail_id,
              request_qty: Number(d.request_qty),
            }))
        )
      );
      await api.createReturnMovement(formData);

      // 반납 회차 생성 완료 → 사무실 총책임자 최종 서명 (Step 6)
      navigate("/office-manager/approval?tab=in");
    } catch (err) {
      setErrorMsg(err.message || "반납 회차 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = details.reduce((sum, d) => sum + Number(d.request_qty || 0), 0);

  // ── 목록 화면 ──
  if (!selected) {
    return (
      <div className="bg-slate-100">
        {/* 흐름 안내 배너 */}
        <div className="mb-6 flex gap-0 border border-slate-300 bg-white">
          <FlowStep num={1} label="반납 회차 생성" active />
          <FlowStep num={2} label="AI 사진 검수" />
          <FlowStep num={3} label="현장 서명" />
          <FlowStep num={4} label="사무실 총책임자 서명" />
        </div>

        <section className="mb-6 border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h1 className="text-[2.125rem] font-semibold text-slate-900">반납 회차 생성</h1>
            <p className="mt-2 text-[1.1875rem] text-slate-600">
              현장에서 접수된 반납 신청을 확인하고 반납 회차를 생성합니다.
            </p>
          </div>

          <div className="p-7">
            {errorMsg && (
              <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">
                {errorMsg}
              </div>
            )}

            {pageLoading ? (
              <div className="border border-slate-300 bg-slate-50 px-5 py-10 text-center text-[1.0625rem] text-slate-500">
                반납 신청 목록을 불러오는 중...
              </div>
            ) : requests.length === 0 ? (
              <div className="border border-amber-300 bg-amber-50 px-5 py-10 text-center text-[1.0625rem] text-amber-700">
                처리 대기 중인 반납 신청이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["현장", "계약", "신청일", "처리"].map((h) => (
                        <th key={h}
                          className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-blue-50">
                        <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] font-medium text-slate-900">
                          {req.site_name || "-"}
                        </td>
                        <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-700">
                          #{req.rental || req.rental_id || "-"}
                        </td>
                        <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-500">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString("ko-KR") : "-"}
                        </td>
                        <td className="border-b border-slate-200 px-5 py-5">
                          <button type="button" onClick={() => handleSelectRequest(req)}
                            className="border border-amber-600 bg-amber-600 px-5 py-3 text-[1rem] font-medium text-white hover:bg-amber-700">
                            회차 생성
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ── 수량 확인 화면 ──
  return (
    <div className="bg-slate-100">
      {/* 흐름 안내 배너 */}
      <div className="mb-6 flex gap-0 border border-slate-300 bg-white">
        <FlowStep num={1} label="반납 회차 생성" active />
        <FlowStep num={2} label="AI 사진 검수" />
        <FlowStep num={3} label="현장 서명" />
        <FlowStep num={4} label="사무실 총책임자 서명" />
      </div>

      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { setSelected(null); setDetails([]); }}
              className="border border-slate-300 bg-white px-4 py-2 text-[0.9375rem] text-slate-600 hover:bg-slate-50">
              ← 목록
            </button>
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">반납 회차 생성</h1>
              <p className="mt-1 text-[1.125rem] text-slate-600">
                {selected.site_name || "현장"} / 계약 #{selected.rental || selected.rental_id}
              </p>
            </div>
          </div>
        </div>

        <div className="p-7">
          {errorMsg && (
            <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="mb-4 text-[1.125rem] font-semibold text-slate-800">반납 수량 확인 및 수정</div>
          <div className="mb-6 overflow-x-auto border border-slate-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["자재명", "규격", "신청 수량", "최종 반납 수량"].map((h) => (
                    <th key={h}
                      className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[1.0625rem] text-slate-500">자재 정보가 없습니다.</td>
                  </tr>
                ) : (
                  details.map((item, index) => (
                    <tr key={item.rental_detail_id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">{item.material_name}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-600">{item.spec}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] text-slate-700">{item.request_qty}</td>
                      <td className="border-b border-slate-200 px-5 py-4">
                        <input type="number" min={0} value={item.request_qty}
                          onChange={(e) => updateQty(index, e.target.value)}
                          className="h-11 w-32 border border-slate-400 px-3 text-[1.0625rem] focus:border-blue-900 focus:outline-none" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 다음 단계 안내 */}
          <div className="mb-6 border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-[1rem] font-semibold text-amber-900">회차 생성 후 다음 단계</p>
            <ol className="mt-2 space-y-1 text-[0.9375rem] text-amber-800">
              <li>① 회차 생성 완료 → <strong>AI 검수 페이지</strong>로 자동 이동</li>
              <li>② 현장 직원이 AI 카메라로 반납 자재 수량 확인</li>
              <li>③ 현장 총책임자가 <strong>반납 서명</strong> 페이지에서 서명</li>
              <li>④ 사무실 총책임자가 <strong>입고 검수 서명</strong> 페이지에서 최종 서명 → 완료</li>
            </ol>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[1.25rem] font-semibold text-slate-800">
              총 반납 수량: <span className="text-amber-600">{totalQty}개</span>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setSelected(null); setDetails([]); }}
                className="border border-slate-300 bg-white px-7 py-4 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50">
                취소
              </button>
              <button type="button" onClick={handleSubmit}
                disabled={submitting || totalQty === 0}
                className="border border-amber-600 bg-amber-600 px-8 py-4 text-[1.125rem] font-medium text-white hover:bg-amber-700 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500">
                {submitting ? "생성 중..." : "반납 회차 생성 →"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FlowStep({ num, label, active = false }) {
  return (
    <div className={`flex flex-1 items-center gap-2 border-b-[3px] px-5 py-4 text-[0.9375rem] font-semibold ${
      active ? "border-amber-600 bg-amber-50 text-amber-700" : "border-transparent text-slate-400"
    }`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[0.8125rem] font-bold ${
        active ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-500"
      }`}>
        {num}
      </span>
      {label}
    </div>
  );
}
