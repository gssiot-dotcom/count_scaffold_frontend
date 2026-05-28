// src/roles/officeManager/FinalApproval.jsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/api.js";

const TABS = [
  { key: "out", label: "출고 확정 서명" },
  { key: "in", label: "입고 검수 / 거래 완료" },
];

export default function FinalApproval() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "out";

  const [tab, setTab] = useState(tabFromUrl);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [movement, setMovement] = useState(null);
  const [details, setDetails] = useState([]);

  // 순차 단계 상태
  const [filesUnlocked, setFilesUnlocked] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedMovementId, setSignedMovementId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { setTab(tabFromUrl); }, [tabFromUrl]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await api.getMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || "회차 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMovements(); }, []);

  const outPending = movements.filter((m) => m.movement_type === "OUT" && m.status === "OUT_CREATED");
  // RETURN_CREATED: 반납 회차 생성 직후 (siteReturnSign 아직 안 됨)
  // RETURN_IN_TRANSIT: siteReturnSign 완료 후
  const inPending = movements.filter(
    (m) => m.movement_type === "RETURN" &&
      (m.status === "RETURN_CREATED" || m.status === "RETURN_IN_TRANSIT")
  );
  const pendingList = tab === "out" ? outPending : inPending;

  const loadMovementDetail = async (id) => {
    if (!id) return;
    try {
      const data = await api.getMovement(id);
      setMovement(data);
      setDetails((data.movement_details || []).map((item) => ({
        movement_detail_id: item.id,
        material_name: item.material_name || "자재",
        spec: item.material_spec || item.spec || "-",
        request_qty: item.request_qty || 0,
        office_out_qty: item.office_out_qty || item.request_qty || 0,
        return_qty: item.return_qty || item.site_request_return_qty || 0,
        final_in_qty: item.final_in_qty || item.site_request_return_qty || 0,
        loss_qty: item.loss_qty || 0,
        broken_qty: item.broken_qty || 0,
        discarded_qty: item.discarded_qty || 0,
      })));
    } catch (err) {
      alert(err.message || "회차 상세를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    if (selectedId) {
      setFilesUnlocked(false);
      setPhotoFile(null);
      setSignatureFile(null);
      loadMovementDetail(selectedId);
    } else {
      setMovement(null);
      setDetails([]);
      setFilesUnlocked(false);
    }
  }, [selectedId]);

  useEffect(() => {
    setSelectedId("");
    setMovement(null);
    setDetails([]);
    setFilesUnlocked(false);
    setPhotoFile(null);
    setSignatureFile(null);
    setSignedMovementId(null);
  }, [tab]);

  const updateDetail = (index, field, value) => {
    setDetails((prev) => prev.map((item, idx) => idx === index ? { ...item, [field]: Number(value) } : item));
  };

  const handleSign = async () => {
    if (!signatureFile) { alert("서명 파일을 첨부해주세요."); return; }
    if (!movement) { alert("회차를 선택해주세요."); return; }
    try {
      setSubmitting(true);
      const formData = new FormData();
      if (photoFile) formData.append("photo", photoFile);
      formData.append("signature", signatureFile);

      if (tab === "out") {
        formData.append("details", JSON.stringify(details.map((d) => ({
          movement_detail_id: d.movement_detail_id, office_out_qty: d.office_out_qty,
        }))));
        await api.officeOutSign(movement.id, formData);
        setSignedMovementId(movement.id);
        alert("출고 서명이 완료되었습니다. 반출증을 다운로드하세요.");
      } else {
        // RETURN_CREATED 상태면 siteReturnSign 먼저 자동 처리 후 officeInSign
        if (movement.status === "RETURN_CREATED") {
          const siteFD = new FormData();
          if (photoFile) siteFD.append("photo", photoFile);
          siteFD.append("signature", signatureFile);
          siteFD.append("details", JSON.stringify(details.map((d) => ({
            movement_detail_id: d.movement_detail_id,
            return_qty: d.return_qty || d.final_in_qty || 0,
          }))));
          await api.siteReturnSign(movement.id, siteFD);
        }

        formData.append("details", JSON.stringify(details.map((d) => ({
          movement_detail_id: d.movement_detail_id,
          final_in_qty: d.final_in_qty, loss_qty: d.loss_qty,
          broken_qty: d.broken_qty, discarded_qty: d.discarded_qty,
        }))));
        await api.officeInSign(movement.id, formData);
        alert("입고 검수 서명이 완료되었습니다. 재고가 복구됩니다.");
        setSignedMovementId(null);
      }

      setSelectedId("");
      setPhotoFile(null);
      setSignatureFile(null);
      setFilesUnlocked(false);
      await loadMovements();
    } catch (err) {
      alert(err.message || "서명 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDispatch = async () => {
    if (!signedMovementId) return;
    try {
      setDownloading(true);
      const blob = await api.downloadMovementDispatch(signedMovementId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Rental_OUT${signedMovementId}_반출증.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "반출증 다운로드에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  const step1Done = movement && details.length > 0;
  const step2Done = filesUnlocked; // photo is optional
  const step3Done = !!signatureFile;

  return (
    <div className="bg-slate-100">
      {/* 반출증 다운로드 배너 */}
      {signedMovementId && tab === "out" && (
        <section className="mb-6 border border-green-300 bg-green-50">
          <div className="flex flex-wrap items-center justify-between gap-4 px-7 py-5">
            <div>
              <p className="text-[1.25rem] font-semibold text-green-800">✓ 출고 서명이 완료되었습니다!</p>
              <p className="mt-1 text-[1rem] text-green-700">회차 #{signedMovementId} — 반출증을 다운로드하여 현장으로 전달하세요.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleDownloadDispatch} disabled={downloading}
                className="border border-green-700 bg-green-700 px-7 py-4 text-[1.0625rem] font-medium text-white hover:bg-green-800 disabled:bg-slate-400">
                {downloading ? "다운로드 중..." : "⬇ 반출증 다운로드"}
              </button>
              <button type="button" onClick={() => setSignedMovementId(null)}
                className="border border-slate-300 bg-white px-5 py-4 text-[0.9375rem] text-slate-600 hover:bg-slate-50">
                닫기
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">회차 서명</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            출고 확정 서명(사무실 직원 AI 검수 후) · 입고 검수 최종 서명(거래 완료)을 처리합니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-slate-300">
          {TABS.map((t) => {
            const count = t.key === "out" ? outPending.length : inPending.length;
            return (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`px-7 py-4 text-[1.0625rem] font-medium transition-colors ${
                  tab === t.key ? "border-b-[3px] border-blue-900 bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50"
                }`}>
                {t.label}
                {count > 0 && (
                  <span className="ml-2 border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.8125rem] font-semibold text-amber-700">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-7">
          {errorMsg && (
            <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
          )}

          {/* 회차 선택 */}
          <div className="mb-6">
            <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">
              {tab === "out" ? "출고 서명 대기 회차 선택" : "입고 검수 대기 회차 선택"}
            </label>
            {loading ? (
              <div className="border border-slate-300 bg-slate-50 px-5 py-4 text-[1.0625rem] text-slate-500">불러오는 중...</div>
            ) : pendingList.length === 0 ? (
              <div className="border border-slate-200 bg-slate-50 px-5 py-5 text-[1.0625rem] text-slate-500">처리 대기 중인 회차가 없습니다.</div>
            ) : (
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                className="h-14 w-full border border-slate-300 bg-white px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none">
                <option value="">회차를 선택하세요</option>
                {pendingList.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    #{m.id} — {m.site_name || m.site || "현장"} / 계약#{m.rental} / {m.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 회차가 선택된 경우 순차 단계 표시 */}
          {movement && details.length > 0 && (
            <>
              {/* 진행 표시줄 */}
              <div className="mb-6 flex gap-0">
                <FlowStep num={1} label="수량 확인" done={step1Done && filesUnlocked} active={!filesUnlocked} />
                <FlowStep num={2} label="사진 첨부" done={step2Done} active={filesUnlocked && !step2Done} />
                <FlowStep num={3} label="서명 첨부" done={step3Done} active={step2Done && !step3Done} />
              </div>

              {/* STEP 1: 수량 테이블 */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <StepBadge num={1} done={step1Done && filesUnlocked} />
                  <h2 className="text-[1.25rem] font-semibold text-slate-900">수량 확인</h2>
                </div>
                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {tab === "out" ? (
                          <><Th>자재명</Th><Th>규격</Th><Th>요청 수량</Th><Th>출고 확정 수량</Th></>
                        ) : (
                          <><Th>자재명</Th><Th>규격</Th><Th>반납 수량</Th><Th>최종 입고</Th><Th>LOSS</Th><Th>파손</Th><Th>폐기</Th></>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((item, index) => (
                        <tr key={item.movement_detail_id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">{item.material_name}</td>
                          <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{item.spec}</td>
                          {tab === "out" ? (
                            <>
                              <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">{item.request_qty}</td>
                              <td className="border-b border-slate-200 px-5 py-4">
                                <input type="number" min={0} value={item.office_out_qty}
                                  onChange={(e) => updateDetail(index, "office_out_qty", e.target.value)}
                                  className="h-10 w-28 border border-slate-400 px-3 text-[1rem] focus:border-blue-900 focus:outline-none" />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">{item.return_qty}</td>
                              {["final_in_qty", "loss_qty", "broken_qty", "discarded_qty"].map((field) => (
                                <td key={field} className="border-b border-slate-200 px-5 py-4">
                                  <input type="number" min={0} value={item[field]}
                                    onChange={(e) => updateDetail(index, field, e.target.value)}
                                    className="h-10 w-24 border border-slate-400 px-3 text-[1rem] focus:border-blue-900 focus:outline-none" />
                                </td>
                              ))}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Step 1 → Step 2 진행 버튼 */}
                {!filesUnlocked && (
                  <div className="mt-5 flex justify-end">
                    <button type="button" onClick={() => setFilesUnlocked(true)}
                      className="border border-blue-900 bg-blue-900 px-8 py-4 text-[1.0625rem] font-medium text-white hover:bg-blue-950">
                      다음: 사진/서명 첨부 →
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: 사진 첨부 (filesUnlocked 이후, 선택 사항) */}
              {filesUnlocked && (
                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <StepBadge num={2} done={step2Done} />
                    <h2 className="text-[1.25rem] font-semibold text-slate-900">사진 첨부 (선택)</h2>
                  </div>
                  <FileBox title="사진 (선택)" file={photoFile} setFile={setPhotoFile} required={false} />
                </div>
              )}

              {/* STEP 3: 서명 첨부 (수량 확인 후 활성화) */}
              {filesUnlocked && (
                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <StepBadge num={3} done={step3Done} />
                    <h2 className="text-[1.25rem] font-semibold text-slate-900">서명 첨부</h2>
                  </div>
                  <FileBox title="서명" file={signatureFile} setFile={setSignatureFile} required />
                </div>
              )}

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <button type="button" onClick={() => navigate(`/office-manager/movements/${movement.id}`)}
                  className="border border-slate-300 bg-white px-6 py-3 text-[1rem] text-slate-700 hover:bg-slate-50">
                  회차 상세 보기
                </button>
                <button type="button" onClick={handleSign}
                  disabled={submitting || !step3Done}
                  className={`px-8 py-4 text-[1.125rem] font-medium ${submitting || !step3Done ? "border border-slate-300 bg-slate-300 text-slate-500" : "border border-blue-900 bg-blue-900 text-white hover:bg-blue-950"}`}>
                  {submitting ? "처리 중..." : tab === "out" ? "출고 확정 서명 →" : "거래 완료 →"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Th({ children }) {
  return <th className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">{children}</th>;
}

function FileBox({ title, required, file, setFile }) {
  return (
    <div className="border border-slate-300 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h3 className="text-[1.1875rem] font-semibold text-slate-800">
          {title}{required && <span className="ml-1 text-red-600">*</span>}
        </h3>
      </div>
      <div className="p-5">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border border-slate-300 p-3 text-[1rem]" />
        {file && <p className="mt-2 text-[0.9375rem] text-blue-800">선택: {file.name}</p>}
      </div>
    </div>
  );
}

function StepBadge({ num, done }) {
  if (done) {
    return <div className="flex h-9 w-9 items-center justify-center bg-green-600 text-[1rem] font-bold text-white">✓</div>;
  }
  return <div className="flex h-9 w-9 items-center justify-center bg-blue-900 text-[1rem] font-bold text-white">{num}</div>;
}

function FlowStep({ num, label, done, active }) {
  return (
    <div className={`flex flex-1 items-center gap-2 border-b-[3px] px-4 py-3 text-[0.9375rem] font-semibold ${
      done ? "border-green-500 text-green-700"
      : active ? "border-blue-900 text-blue-900"
      : "border-transparent text-slate-400"
    }`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[0.8125rem] font-bold ${
        done ? "bg-green-500 text-white"
        : active ? "bg-blue-900 text-white"
        : "bg-slate-200 text-slate-500"
      }`}>
        {done ? "✓" : num}
      </span>
      {label}
    </div>
  );
}
