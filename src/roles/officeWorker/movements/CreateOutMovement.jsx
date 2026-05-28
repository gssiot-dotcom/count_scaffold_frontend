// src/roles/officeWorker/movements/CreateOutMovement.jsx
// Step 3: 사무실 직원이 계약/수량 확인 후 출고 회차 생성 → AI 검수 페이지로 이동
// 출고 확정 서명은 사무실 총책임자가 FinalApproval(tab=out)에서 처리

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/api.js";

export default function CreateOutMovement() {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);
  const [selectedRentalId, setSelectedRentalId] = useState("");
  const [details, setDetails] = useState([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        const data = await api.getRentals();
        const active = (Array.isArray(data) ? data : []).filter((r) => r.status === "ACTIVE");
        setRentals(active);
        if (active.length > 0) setSelectedRentalId(String(active[0].id));
      } catch (err) {
        setErrorMsg(err.message || "계약 목록을 불러오지 못했습니다.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedRentalId) return;
    setErrorMsg("");
    const load = async () => {
      try {
        setDetailLoading(true);
        const data = await api.getRentalDetails();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (d) => String(d.rental) === String(selectedRentalId)
        );
        setDetails(
          filtered.map((d) => ({
            rental_detail_id: d.id,
            material_name: d.material_name || d.material || "자재",
            spec: d.material_spec || d.spec || "-",
            planned_qty: d.planned_qty || 0,
            request_qty: d.planned_qty || 0,
          }))
        );
      } catch (err) {
        setErrorMsg(err.message || "자재 목록을 불러오지 못했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedRentalId]);

  const updateQty = (index, value) => {
    setDetails((prev) =>
      prev.map((item, idx) => idx === index ? { ...item, request_qty: Math.max(0, Number(value)) } : item)
    );
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!selectedRentalId) { setErrorMsg("계약을 선택해주세요."); return; }
    if (details.every((d) => d.request_qty === 0)) { setErrorMsg("출고 수량을 1개 이상 입력해주세요."); return; }

    try {
      setSubmitting(true);
      const activeDetails = details
        .filter((d) => d.request_qty > 0)
        .map((d) => ({ rental_detail_id: d.rental_detail_id, request_qty: d.request_qty }));

      const formData = new FormData();
      formData.append("rental_id", selectedRentalId);
      formData.append("details", JSON.stringify(activeDetails));
      await api.createOutMovement(formData);

      // 회차 생성 완료 → 사무실 직원 AI 수량 검수 (Step 3)
      navigate("/office-worker/ai-inspection?step=out_office");
    } catch (err) {
      setErrorMsg(err.message || "출고 회차 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = details.reduce((sum, d) => sum + Number(d.request_qty || 0), 0);

  return (
    <div className="bg-slate-100">
      {/* 흐름 안내 배너 */}
      <div className="mb-6 flex gap-0 border border-slate-300 bg-white">
        <FlowStep num={1} label="출고 회차 생성" active />
        <FlowStep num={2} label="AI 사진 검수" />
        <FlowStep num={3} label="총책임자 출고 서명" />
      </div>

      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">출고 회차 생성</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            출고할 계약과 자재 수량을 확인하고 회차를 생성합니다. 생성 후 AI 검수를 진행합니다.
          </p>
        </div>

        <div className="p-7">
          {errorMsg && (
            <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
          )}

          {/* 계약 선택 */}
          <div className="mb-6">
            <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">계약 선택</label>
            {pageLoading ? (
              <div className="border border-slate-300 bg-slate-50 px-5 py-4 text-[1.0625rem] text-slate-500">계약 목록 불러오는 중...</div>
            ) : rentals.length === 0 ? (
              <div className="border border-amber-300 bg-amber-50 px-5 py-4 text-[1.0625rem] text-amber-700">진행 중인 계약이 없습니다.</div>
            ) : (
              <select
                value={selectedRentalId}
                onChange={(e) => setSelectedRentalId(e.target.value)}
                className="h-14 w-full border border-slate-300 bg-white px-4 text-[1.125rem] focus:border-blue-900 focus:outline-none"
              >
                {rentals.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    #{r.id} — {r.site_name || r.site || "현장"} ({r.requester_company_name || r.requester_company || "-"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 수량 테이블 */}
          {detailLoading ? (
            <div className="border border-slate-300 bg-slate-50 px-5 py-8 text-center text-[1.0625rem] text-slate-500">자재 목록 불러오는 중...</div>
          ) : details.length > 0 ? (
            <>
              <div className="mb-2 text-[1.0625rem] font-semibold text-slate-800">출고 수량 입력</div>
              <div className="mb-4 overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["자재명", "규격", "계약 수량", "출고 수량"].map((h) => (
                        <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((item, index) => (
                      <tr key={item.rental_detail_id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">{item.material_name}</td>
                        <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-600">{item.spec}</td>
                        <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] text-slate-700">{item.planned_qty}</td>
                        <td className="border-b border-slate-200 px-5 py-4">
                          <input
                            type="number" min={0} max={item.planned_qty} value={item.request_qty}
                            onChange={(e) => updateQty(index, e.target.value)}
                            className="h-11 w-32 border border-slate-400 px-3 text-[1.0625rem] focus:border-blue-900 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mb-6 text-[1.125rem] font-semibold text-slate-800">
                총 출고 수량: <span className="text-blue-900">{totalQty}개</span>
              </div>
            </>
          ) : selectedRentalId && !detailLoading ? (
            <div className="border border-slate-300 bg-slate-50 px-5 py-8 text-center text-[1.0625rem] text-slate-500">해당 계약의 자재 목록이 없습니다.</div>
          ) : null}

          {/* 다음 단계 안내 */}
          <div className="mb-6 border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-[1rem] font-semibold text-blue-900">회차 생성 후 진행 순서</p>
            <ol className="mt-2 space-y-1 text-[0.9375rem] text-blue-800">
              <li>① 회차 생성 완료 → <strong>AI 검수 페이지</strong>로 자동 이동</li>
              <li>② 사무실 직원이 AI 카메라로 출고 자재 수량 확인 후 저장</li>
              <li>③ 사무실 총책임자가 <strong>회차 서명 → 출고 확정</strong></li>
            </ol>
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => navigate("/office-worker/rental")}
              className="border border-slate-300 bg-white px-7 py-4 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedRentalId || totalQty === 0}
              className="border border-blue-900 bg-blue-900 px-10 py-4 text-[1.125rem] font-medium text-white hover:bg-blue-950 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500"
            >
              {submitting ? "생성 중..." : "출고 회차 생성 →"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FlowStep({ num, label, active = false }) {
  return (
    <div className={`flex flex-1 items-center gap-2 border-b-[3px] px-5 py-4 text-[0.9375rem] font-semibold ${
      active ? "border-blue-900 bg-blue-50 text-blue-900" : "border-transparent text-slate-400"
    }`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[0.8125rem] font-bold ${
        active ? "bg-blue-900 text-white" : "bg-slate-200 text-slate-500"
      }`}>
        {num}
      </span>
      {label}
    </div>
  );
}
