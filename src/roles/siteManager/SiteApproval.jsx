// src/roles/siteManager/SiteApproval.jsx
// 현장 총책임자 - 수령 서명(tab=receive) / 반납 서명(tab=return)

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/api.js";

const TAB_CONFIG = {
  receive: {
    title: "수령 서명",
    desc: "이동 중인 출고 회차를 선택해 수령 확인 사진과 서명을 제출합니다.",
    filter: (m) => m.movement_type === "OUT" && m.status === "OUT_IN_TRANSIT",
    qtyField: "site_receive_qty",
    qtyLabel: "수령 확인 수량",
    apiCall: (id, fd) => api.siteReceiveSign(id, fd),
    successMsg: (id) => `수령 서명이 완료되었습니다. (회차 #${id})`,
    color: "blue",
  },
  return: {
    title: "반납 서명",
    desc: "반납 대기 중인 회차를 선택해 반납 현장 사진과 서명을 제출합니다.",
    filter: (m) => m.movement_type === "RETURN" && m.status === "RETURN_CREATED",
    qtyField: "return_qty",
    qtyLabel: "반납 수량",
    apiCall: (id, fd) => api.siteReturnSign(id, fd),
    successMsg: (id) => `반납 서명이 완료되었습니다. (회차 #${id})`,
    color: "amber",
  },
};

function SignaturePad({ onSave, onClear, color = "blue" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const endDraw = (e) => {
    e.preventDefault();
    drawing.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  };

  const handleSave = () => {
    canvasRef.current.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  };

  const btnClass = color === "amber"
    ? "border border-amber-600 bg-amber-600 px-5 py-2 text-[0.9375rem] font-medium text-white hover:bg-amber-700"
    : "border border-blue-900 bg-blue-900 px-5 py-2 text-[0.9375rem] font-medium text-white hover:bg-blue-950";

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full cursor-crosshair border border-slate-400 bg-white"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={handleClear}
          className="border border-slate-300 bg-white px-5 py-2 text-[0.9375rem] font-medium text-slate-700 hover:bg-slate-50">
          서명 초기화
        </button>
        <button type="button" onClick={handleSave} className={btnClass}>
          서명 확인
        </button>
      </div>
    </div>
  );
}

export default function SiteApproval() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "receive";
  const tabConfig = TAB_CONFIG[tab] || TAB_CONFIG.receive;
  const color = tabConfig.color;

  const [allMovements, setAllMovements] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selected, setSelected] = useState(null);
  const [movementDetails, setMovementDetails] = useState([]);

  // 순차 단계 상태
  const [photoUnlocked, setPhotoUnlocked] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signatureBlob, setSignatureBlob] = useState(null);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [stepError, setStepError] = useState("");

  const movements = allMovements.filter(tabConfig.filter);

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        const data = await api.getMovements();
        setAllMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorMsg(err.message || "회차 목록을 불러오지 못했습니다.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setSelected(null);
    setMovementDetails([]);
    resetSigningState();
    setSuccessMsg("");
    setStepError("");
  }, [tab]);

  useEffect(() => {
    if (!selected) { setMovementDetails([]); return; }
    const load = async () => {
      try {
        const data = await api.getMovement(selected.id);
        setMovementDetails(
          (data.movement_details || []).map((item) => ({
            movement_detail_id: item.id,
            material_name: item.material_name || "자재",
            spec: item.material_spec || item.spec || "-",
            request_qty: item.request_qty || 0,
            [tabConfig.qtyField]: item[tabConfig.qtyField] ?? item.request_qty ?? 0,
          }))
        );
      } catch (err) {
        setStepError(err.message || "자재 정보를 불러오지 못했습니다.");
      }
    };
    load();
  }, [selected]);

  const resetSigningState = () => {
    setPhotoUnlocked(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setSignatureBlob(null);
    setSignatureSaved(false);
    setStepError("");
  };

  const updateQty = (index, value) => {
    setMovementDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [tabConfig.qtyField]: Number(value) } : item
      )
    );
  };

  const handleSelectMovement = (movement) => {
    setSelected(movement);
    resetSigningState();
    setSuccessMsg("");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
    setStepError("");
  };

  const handleSignatureSave = (blob) => {
    setSignatureBlob(blob);
    setSignatureSaved(true);
    setStepError("");
  };

  const handleSignatureClear = () => {
    setSignatureBlob(null);
    setSignatureSaved(false);
  };

  const handleSubmit = async () => {
    setStepError("");
    if (!photoFile) { setStepError("사진을 촬영하거나 업로드해주세요."); return; }
    if (!signatureSaved || !signatureBlob) { setStepError("서명 후 '서명 확인' 버튼을 눌러주세요."); return; }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("signature", signatureBlob, "signature.png");
      formData.append(
        "details",
        JSON.stringify(
          movementDetails.map((d) => ({
            movement_detail_id: d.movement_detail_id,
            [tabConfig.qtyField]: d[tabConfig.qtyField],
          }))
        )
      );

      await tabConfig.apiCall(selected.id, formData);

      setSuccessMsg(tabConfig.successMsg(selected.id));
      setAllMovements((prev) => prev.filter((m) => m.id !== selected.id));
      setSelected(null);
    } catch (err) {
      setStepError(err.message || "서명 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const btnActive = color === "amber"
    ? "border border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
    : "border border-blue-900 bg-blue-900 text-white hover:bg-blue-950";
  const btnDisabled = "border border-slate-300 bg-slate-300 text-slate-500";

  const step1Done = movementDetails.length > 0;
  const step2Done = !!photoFile;
  const step3Done = signatureSaved;

  // ── 목록 화면 ──
  if (!selected) {
    return (
      <div className="bg-slate-100">
        <section className="mb-6 border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h1 className="text-[2.125rem] font-semibold text-slate-900">{tabConfig.title}</h1>
            <p className="mt-2 text-[1.1875rem] text-slate-600">{tabConfig.desc}</p>
          </div>

          <div className="p-7">
            {successMsg && (
              <div className="mb-6 border border-green-300 bg-green-50 px-5 py-4 text-[1.0625rem] text-green-800">{successMsg}</div>
            )}
            {errorMsg && (
              <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
            )}

            {pageLoading ? (
              <div className="border border-slate-300 bg-slate-50 px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</div>
            ) : (
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["회차 번호", "현장", "계약", "생성일", "처리"].map((h) => (
                        <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-[1.125rem] text-slate-500">서명 대기 중인 회차가 없습니다.</td>
                      </tr>
                    ) : (
                      movements.map((m) => (
                        <tr key={m.id} className="hover:bg-blue-50">
                          <td className="border-b border-slate-200 px-5 py-5 text-[1.125rem] font-medium text-blue-900">#{m.id}</td>
                          <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-800">{m.site_name || m.site || "-"}</td>
                          <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-600">#{m.rental || "-"}</td>
                          <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-500">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString("ko-KR") : "-"}
                          </td>
                          <td className="border-b border-slate-200 px-5 py-5">
                            <button type="button" onClick={() => handleSelectMovement(m)}
                              className={`px-5 py-3 text-[1rem] font-medium ${btnActive}`}>
                              서명하기
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ── 서명 화면 ──
  return (
    <div className="bg-slate-100">
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex items-start gap-4">
            <button type="button" onClick={() => setSelected(null)}
              className="mt-1 border border-slate-300 bg-white px-4 py-2 text-[0.9375rem] text-slate-600 hover:bg-slate-50">
              ← 목록
            </button>
            <div className="flex-1">
              <h1 className="text-[2.125rem] font-semibold text-slate-900">
                {tabConfig.title} — 회차 #{selected.id}
              </h1>
              <p className="mt-1 text-[1.125rem] text-slate-600">
                {selected.site_name || selected.site || "현장"} / 계약 #{selected.rental || "-"}
              </p>
              <div className="mt-4 flex gap-0">
                <FlowStep num={1} label="수량 확인" done={step1Done && photoUnlocked} active={!photoUnlocked} color={color} />
                <FlowStep num={2} label="현장 사진" done={step2Done} active={photoUnlocked && !step2Done} color={color} />
                <FlowStep num={3} label="서명" done={step3Done} active={step2Done && !step3Done} color={color} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-7">
          {stepError && (
            <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{stepError}</div>
          )}

          {/* STEP 1: 자재 수량 확인 */}
          {movementDetails.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge num={1} done={step1Done && photoUnlocked} color={color} />
                <h2 className="text-[1.375rem] font-semibold text-slate-900">자재 수량 확인</h2>
              </div>
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["자재명", "규격", "요청 수량", tabConfig.qtyLabel].map((h) => (
                        <th key={h} className="border-b border-slate-300 bg-slate-100 px-5 py-3 text-left text-[1rem] font-medium text-slate-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movementDetails.map((item, index) => (
                      <tr key={item.movement_detail_id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-5 py-3 text-[1.0625rem] font-medium text-slate-900">{item.material_name}</td>
                        <td className="border-b border-slate-200 px-5 py-3 text-[1rem] text-slate-600">{item.spec}</td>
                        <td className="border-b border-slate-200 px-5 py-3 text-[1.0625rem]">{item.request_qty}</td>
                        <td className="border-b border-slate-200 px-5 py-3">
                          <input type="number" min={0} value={item[tabConfig.qtyField]}
                            onChange={(e) => updateQty(index, e.target.value)}
                            className="h-10 w-28 border border-slate-400 px-3 text-[1rem] focus:border-blue-900 focus:outline-none" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Step 1 → Step 2 진행 버튼 */}
              {!photoUnlocked && (
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setPhotoUnlocked(true)}
                    className={`px-8 py-4 text-[1.0625rem] font-medium ${btnActive}`}>
                    다음: 현장 사진 촬영 →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: 현장 사진 (photoUnlocked 이후) */}
          {photoUnlocked && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge num={2} done={step2Done} color={color} />
                <h2 className="text-[1.375rem] font-semibold text-slate-900">현장 사진</h2>
              </div>
              <input type="file" accept="image/*" capture="environment"
                onChange={handlePhotoChange}
                className="w-full border border-slate-300 p-3 text-[1rem]" />
              {photoPreview && (
                <div className="mt-4 border border-slate-300">
                  <img src={photoPreview} alt="현장 사진 미리보기" className="max-h-64 w-full object-contain" />
                </div>
              )}
              {!photoFile && (
                <p className="mt-3 text-[0.9375rem] text-slate-500">사진을 촬영하거나 업로드하면 서명 단계가 활성화됩니다.</p>
              )}
            </div>
          )}

          {/* STEP 3: 서명 (사진 업로드 후 자동 활성화) */}
          {photoFile && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge num={3} done={step3Done} color={color} />
                <h2 className="text-[1.375rem] font-semibold text-slate-900">현장 총책임자 서명</h2>
              </div>
              {step3Done && (
                <div className="mb-3 border border-green-300 bg-green-50 px-4 py-3 text-[1rem] text-green-800">
                  ✓ 서명이 저장되었습니다.
                </div>
              )}
              <SignaturePad onSave={handleSignatureSave} onClear={handleSignatureClear} color={color} />
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <button type="button" onClick={() => setSelected(null)}
              className="border border-slate-300 bg-white px-7 py-4 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50">
              취소
            </button>
            <button type="button" onClick={handleSubmit}
              disabled={submitting || !step2Done || !step3Done}
              className={`px-10 py-4 text-[1.125rem] font-medium ${submitting || !step2Done || !step3Done ? btnDisabled : btnActive}`}>
              {submitting ? "서명 제출 중..." : `${tabConfig.title} 완료`}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepBadge({ num, done, color = "blue" }) {
  if (done) {
    return <div className="flex h-9 w-9 items-center justify-center bg-green-600 text-[1rem] font-bold text-white">✓</div>;
  }
  const bg = color === "amber" ? "bg-amber-600" : "bg-blue-900";
  return <div className={`flex h-9 w-9 items-center justify-center ${bg} text-[1rem] font-bold text-white`}>{num}</div>;
}

function FlowStep({ num, label, done, active, color = "blue" }) {
  const activeBorder = color === "amber" ? "border-amber-600 text-amber-700" : "border-blue-900 text-blue-900";
  const activeDot = color === "amber" ? "bg-amber-600 text-white" : "bg-blue-900 text-white";
  return (
    <div className={`flex flex-1 items-center gap-2 border-b-[3px] px-4 py-3 text-[0.9375rem] font-semibold ${
      done ? "border-green-500 text-green-700"
      : active ? activeBorder
      : "border-transparent text-slate-400"
    }`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[0.8125rem] font-bold ${
        done ? "bg-green-500 text-white"
        : active ? activeDot
        : "bg-slate-200 text-slate-500"
      }`}>
        {done ? "✓" : num}
      </span>
      {label}
    </div>
  );
}
