// src/roles/siteManager/SiteReturnRequest.jsx
// Step 6: 현장 총책임자 - 계약/수량 선택 → AI 사진 촬영 → 서명 → 반납 신청 제출

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";

function getCircleColor(confidence) {
  if (confidence >= 0.7) return { stroke: "#3b82f6", fill: "rgba(59,130,246,0.20)" };
  if (confidence >= 0.6) return { stroke: "#eab308", fill: "rgba(234,179,8,0.20)" };
  return { stroke: "#ef4444", fill: "rgba(239,68,68,0.20)" };
}

function bboxToCircle(bbox) {
  const cx = (bbox.x1 + bbox.x2) / 2;
  const cy = (bbox.y1 + bbox.y2) / 2;
  const r = Math.max(bbox.x2 - bbox.x1, bbox.y2 - bbox.y1) / 2;
  return { cx, cy, r };
}

function SignaturePad({ onSave, onClear }) {
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

  const endDraw = (e) => { e.preventDefault(); drawing.current = false; };

  const handleClear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  };

  const handleSave = () => {
    canvasRef.current.toBlob((blob) => { if (blob) onSave(blob); }, "image/png");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full cursor-crosshair border border-slate-400 bg-white"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={handleClear}
          className="border border-slate-300 bg-white px-5 py-2 text-[0.9375rem] font-medium text-slate-700 hover:bg-slate-50">
          서명 초기화
        </button>
        <button type="button" onClick={handleSave}
          className="border border-amber-600 bg-amber-600 px-5 py-2 text-[0.9375rem] font-medium text-white hover:bg-amber-700">
          서명 확인
        </button>
      </div>
    </div>
  );
}

export default function SiteReturnRequest() {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);
  const [selectedRentalId, setSelectedRentalId] = useState("");
  const [details, setDetails] = useState([]);

  // 단계 진행
  const [aiUnlocked, setAiUnlocked] = useState(false);
  const [signUnlocked, setSignUnlocked] = useState(false);

  // AI 사진 (Step 2 - 현장 직원)
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiBoxes, setAiBoxes] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [manualCircles, setManualCircles] = useState([]);
  const [pointerSize, setPointerSize] = useState(20);
  const [detecting, setDetecting] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const canvasRef = useRef(null);

  // 서명 (Step 3 - 현장 총책임자)
  const [signatureBlob, setSignatureBlob] = useState(null);
  const [signatureSaved, setSignatureSaved] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeAiCount = aiBoxes.filter((b) => !removedIds.includes(b.id)).length;
  const finalQty = previewUrl ? activeAiCount + manualCircles.length : null;

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
    setAiUnlocked(false);
    setSignUnlocked(false);
    resetAi();
    setSignatureBlob(null);
    setSignatureSaved(false);
    setAiSaved(false);
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
            request_qty: "0",
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

  const resetAi = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setAiBoxes([]);
    setRemovedIds([]);
    setManualCircles([]);
  };

  const updateQty = (index, value) => {
    setDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, request_qty: Math.max(0, Number(value)).toString() } : item
      )
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setAiBoxes([]);
    setRemovedIds([]);
    setManualCircles([]);
    setAiSaved(false);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setErrorMsg("");
  };

  const handleDetect = async () => {
    if (!imageFile) { setErrorMsg("사진을 먼저 선택해주세요."); return; }
    try {
      setDetecting(true);
      setErrorMsg("");
      setRemovedIds([]);
      setManualCircles([]);
      const result = await api.detect(imageFile);
      setAiBoxes(result?.boxes || []);
    } catch (err) {
      setErrorMsg(err.message || "AI 판독에 실패했습니다.");
    } finally {
      setDetecting(false);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const manualHit = manualCircles.findIndex((c) => {
      const dx = c.cx - clickX, dy = c.cy - clickY;
      return Math.sqrt(dx * dx + dy * dy) < pointerSize;
    });
    if (manualHit !== -1) {
      setManualCircles((prev) => prev.filter((_, i) => i !== manualHit));
      return;
    }

    const activeBoxes = aiBoxes.filter((b) => !removedIds.includes(b.id));
    const aiHit = activeBoxes.find((b) => {
      const { cx, cy, r } = bboxToCircle(b.bbox);
      const dx = cx - clickX, dy = cy - clickY;
      return Math.sqrt(dx * dx + dy * dy) < r * 1.2;
    });
    if (aiHit) { setRemovedIds((prev) => [...prev, aiHit.id]); return; }
    setManualCircles((prev) => [...prev, { cx: clickX, cy: clickY, id: Date.now() }]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl) return;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      aiBoxes.forEach((box) => {
        const isRemoved = removedIds.includes(box.id);
        const { cx, cy, r } = bboxToCircle(box.bbox);
        const color = getCircleColor(box.confidence);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        if (isRemoved) {
          ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
          ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
          const s = r * 0.5;
          ctx.beginPath();
          ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
          ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
          ctx.stroke();
        } else {
          ctx.strokeStyle = color.stroke; ctx.lineWidth = 2.5; ctx.setLineDash([]);
          ctx.stroke(); ctx.fillStyle = color.fill; ctx.fill();
          ctx.fillStyle = color.stroke;
          ctx.font = `bold ${Math.max(r * 0.55, 10)}px sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(`${Math.round(box.confidence * 100)}%`, cx, cy);
        }
      });

      manualCircles.forEach((c) => {
        ctx.beginPath(); ctx.arc(c.cx, c.cy, pointerSize, 0, 2 * Math.PI);
        ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2.5; ctx.setLineDash([]);
        ctx.stroke(); ctx.fillStyle = "rgba(34,197,94,0.25)"; ctx.fill();
        ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 2;
        const s = pointerSize * 0.45;
        ctx.beginPath();
        ctx.moveTo(c.cx, c.cy - s); ctx.lineTo(c.cx, c.cy + s);
        ctx.moveTo(c.cx - s, c.cy); ctx.lineTo(c.cx + s, c.cy);
        ctx.stroke();
      });
    };
    img.src = previewUrl;
  }, [previewUrl, aiBoxes, removedIds, manualCircles, pointerSize]);

  // AI 수량 확인 완료 → 수량 자동 업데이트 후 서명 단계로
  const handleAiConfirm = () => {
    if (finalQty === null) { setErrorMsg("AI 판독을 먼저 실행해주세요."); return; }
    if (!imageFile) { setErrorMsg("사진을 먼저 촬영해주세요."); return; }
    // 총 수량을 각 자재에 균등 분배하거나 첫 번째 자재에 전체 수량 입력
    if (details.length === 1) {
      setDetails((prev) => prev.map((item, idx) => idx === 0 ? { ...item, request_qty: String(finalQty) } : item));
    }
    setAiSaved(true);
    setSignUnlocked(true);
    setErrorMsg("");
  };

  const handleSignatureSave = (blob) => { setSignatureBlob(blob); setSignatureSaved(true); setErrorMsg(""); };
  const handleSignatureClear = () => { setSignatureBlob(null); setSignatureSaved(false); };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!selectedRentalId) { setErrorMsg("계약을 선택해주세요."); return; }
    if (details.every((d) => Number(d.request_qty) === 0)) {
      setErrorMsg("반납 신청 수량을 1개 이상 입력해주세요.");
      return;
    }
    if (!imageFile) { setErrorMsg("AI 사진 검수를 완료해주세요."); return; }
    if (!signatureSaved || !signatureBlob) {
      setErrorMsg("서명 후 '서명 확인' 버튼을 눌러주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("rental_id", selectedRentalId);
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
      formData.append("photo", imageFile);
      formData.append("signature", signatureBlob, "signature.png");

      await api.createReturnRequest(formData);
      navigate("/site-manager/reports");
    } catch (err) {
      setErrorMsg(err.message || "반납 신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = details.reduce((sum, d) => sum + Number(d.request_qty || 0), 0);
  const step1Done = !!selectedRentalId && totalQty > 0;

  return (
    <div className="bg-slate-100">
      {/* 흐름 안내 배너 */}
      <div className="mb-6 flex gap-0 border border-slate-300 bg-white">
        <FlowStep num={1} label="계약/수량" active={!aiUnlocked} done={step1Done && aiUnlocked} />
        <FlowStep num={2} label="AI 사진 검수" active={aiUnlocked && !signUnlocked} done={aiSaved} />
        <FlowStep num={3} label="총책임자 서명" active={signUnlocked && !signatureSaved} done={signatureSaved} />
      </div>

      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">반납 신청</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            반납 수량 입력 → 현장 직원 AI 사진 검수 → 현장 총책임자 서명 순으로 진행하세요.
          </p>
        </div>

        <div className="p-7">
          {errorMsg && (
            <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
          )}

          {/* STEP 1: 계약 + 반납 수량 */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge num={1} done={step1Done && aiUnlocked} />
              <h2 className="text-[1.375rem] font-semibold text-slate-900">계약 선택 및 반납 수량 입력</h2>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">계약 선택</label>
              {pageLoading ? (
                <div className="border border-slate-300 bg-slate-50 px-5 py-4 text-[1.0625rem] text-slate-500">계약 목록 불러오는 중...</div>
              ) : rentals.length === 0 ? (
                <div className="border border-amber-300 bg-amber-50 px-5 py-4 text-[1.0625rem] text-amber-700">진행 중인 계약이 없습니다.</div>
              ) : (
                <select
                  value={selectedRentalId}
                  onChange={(e) => setSelectedRentalId(e.target.value)}
                  disabled={aiUnlocked}
                  className="h-14 w-full border border-slate-300 bg-white px-4 text-[1.125rem] focus:border-amber-600 focus:outline-none disabled:bg-slate-100"
                >
                  {rentals.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      #{r.id} — {r.site_name || r.site || "현장"} ({r.requester_company_name || r.requester_company || "-"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {detailLoading ? (
              <div className="border border-slate-300 bg-slate-50 px-5 py-8 text-center text-[1.0625rem] text-slate-500">자재 목록 불러오는 중...</div>
            ) : details.length > 0 ? (
              <>
                <div className="mb-3 text-[1.0625rem] font-semibold text-slate-700">반납 신청 수량 입력</div>
                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {["자재명", "규격", "계약 수량", "반납 신청 수량"].map((h) => (
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
                              disabled={aiUnlocked}
                              className="h-11 w-32 border border-slate-400 px-3 text-[1.0625rem] focus:border-amber-600 focus:outline-none disabled:bg-slate-100"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-[1.125rem] font-semibold text-slate-800">
                  총 반납 신청 수량: <span className="text-amber-600">{totalQty}개</span>
                </div>
              </>
            ) : selectedRentalId && !detailLoading ? (
              <div className="border border-slate-300 bg-slate-50 px-5 py-8 text-center text-[1.0625rem] text-slate-500">해당 계약의 자재 목록이 없습니다.</div>
            ) : null}

            {!aiUnlocked && (
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setAiUnlocked(true)}
                  disabled={!step1Done}
                  className="border border-amber-600 bg-amber-600 px-8 py-4 text-[1.0625rem] font-medium text-white hover:bg-amber-700 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500">
                  다음: AI 사진 검수 →
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: AI 사진 검수 (현장 직원) */}
          {aiUnlocked && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge num={2} done={aiSaved} />
                <div>
                  <h2 className="text-[1.375rem] font-semibold text-slate-900">AI 사진 검수</h2>
                  <p className="text-[0.9375rem] text-slate-500">반납 자재를 촬영하고 AI로 수량을 확인합니다.</p>
                </div>
              </div>

              {aiSaved ? (
                <div className="mb-4 border border-green-300 bg-green-50 px-5 py-4 text-[1.0625rem] text-green-800">
                  ✓ AI 수량 확인 완료 ({finalQty}개) — 서명 단계로 진행하세요.
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block text-[1rem] font-medium text-slate-700">사진 촬영 / 업로드</label>
                    <input
                      type="file" accept="image/*" capture="environment"
                      onChange={handleImageChange}
                      className="w-full border border-slate-300 p-3 text-[1rem]"
                    />
                  </div>

                  {previewUrl && (
                    <>
                      <div className="mb-4 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
                        <div className="border border-slate-300 bg-slate-50 px-5 py-4">
                          <label className="mb-2 block text-[0.9375rem] font-semibold text-slate-800">포인터 크기</label>
                          <input type="range" min={8} max={60} value={pointerSize}
                            onChange={(e) => setPointerSize(Number(e.target.value))}
                            className="w-full accent-amber-600" />
                          <p className="mt-1 text-[0.875rem] text-slate-500">현재 크기: {pointerSize}px</p>
                        </div>
                        <div className="border border-amber-200 bg-amber-50 px-5 py-4">
                          <p className="text-[0.9375rem] text-amber-700">AI 판독 수량</p>
                          <p className="mt-1 text-[2.5rem] font-black text-amber-900">
                            {finalQty ?? "-"}
                            <span className="ml-2 text-[1.125rem] font-semibold">개</span>
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-1">
                            <div className="border border-amber-200 bg-white px-1 py-1 text-center">
                              <p className="text-[0.6875rem] text-slate-500">AI</p>
                              <p className="text-[1rem] font-bold text-slate-900">{aiBoxes.length}</p>
                            </div>
                            <div className="border border-red-200 bg-white px-1 py-1 text-center">
                              <p className="text-[0.6875rem] text-slate-500">삭제</p>
                              <p className="text-[1rem] font-bold text-red-600">{removedIds.length > 0 ? `-${removedIds.length}` : "0"}</p>
                            </div>
                            <div className="border border-green-200 bg-white px-1 py-1 text-center">
                              <p className="text-[0.6875rem] text-slate-500">추가</p>
                              <p className="text-[1rem] font-bold text-green-600">{manualCircles.length > 0 ? `+${manualCircles.length}` : "0"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-3">
                        <button type="button" onClick={handleDetect} disabled={detecting}
                          className="border border-amber-600 bg-amber-600 px-6 py-3 text-[1rem] font-medium text-white hover:bg-amber-700 disabled:bg-slate-400">
                          {detecting ? "AI 판독 중..." : "AI 판독 실행"}
                        </button>
                        <button type="button" onClick={() => { setRemovedIds([]); setManualCircles([]); }}
                          className="border border-slate-400 bg-white px-6 py-3 text-[1rem] font-medium text-slate-700 hover:bg-slate-50">
                          체크 초기화
                        </button>
                        {finalQty !== null && (
                          <button type="button" onClick={handleAiConfirm}
                            className="border border-green-700 bg-green-700 px-6 py-3 text-[1rem] font-medium text-white hover:bg-green-800">
                            수량 확인 완료 ({finalQty}개) →
                          </button>
                        )}
                      </div>

                      <div className="border border-slate-300 bg-slate-50">
                        <div className="border-b border-slate-200 bg-white px-5 py-3">
                          <p className="text-[0.875rem] text-slate-600">
                            <span className="font-semibold text-amber-700">AI 원 클릭</span> → 삭제 &nbsp;|&nbsp;
                            <span className="font-semibold text-green-700">빈 곳 클릭</span> → 추가
                          </p>
                        </div>
                        <div className="p-4">
                          <canvas
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className="w-full cursor-crosshair"
                            style={{ maxHeight: "30rem", objectFit: "contain" }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {!previewUrl && (
                    <div className="border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-[1.0625rem] text-slate-400">
                      사진을 선택하면 여기에 표시됩니다.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3: 현장 총책임자 서명 */}
          {signUnlocked && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <StepBadge num={3} done={signatureSaved} />
                <h2 className="text-[1.375rem] font-semibold text-slate-900">현장 총책임자 서명</h2>
              </div>
              {signatureSaved && (
                <div className="mb-3 border border-green-300 bg-green-50 px-4 py-3 text-[1rem] text-green-800">
                  ✓ 서명이 저장되었습니다.
                </div>
              )}
              <SignaturePad onSave={handleSignatureSave} onClear={handleSignatureClear} />
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <button type="button" onClick={() => navigate("/site-manager/reports")}
              className="border border-slate-300 bg-white px-7 py-4 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50">
              취소
            </button>
            <button type="button" onClick={handleSubmit}
              disabled={submitting || !step1Done || !aiSaved || !signatureSaved}
              className="border border-amber-600 bg-amber-600 px-10 py-4 text-[1.125rem] font-medium text-white hover:bg-amber-700 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500">
              {submitting ? "제출 중..." : "반납 신청 제출"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepBadge({ num, done }) {
  if (done) return <div className="flex h-9 w-9 items-center justify-center bg-green-600 text-[1rem] font-bold text-white">✓</div>;
  return <div className="flex h-9 w-9 items-center justify-center bg-amber-600 text-[1rem] font-bold text-white">{num}</div>;
}

function FlowStep({ num, label, done = false, active = false }) {
  return (
    <div className={`flex flex-1 items-center gap-2 border-b-[3px] px-5 py-4 text-[0.9375rem] font-semibold ${
      done ? "border-green-500 text-green-700"
      : active ? "border-amber-600 bg-amber-50 text-amber-700"
      : "border-transparent text-slate-400"
    }`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[0.8125rem] font-bold ${
        done ? "bg-green-500 text-white"
        : active ? "bg-amber-600 text-white"
        : "bg-slate-200 text-slate-500"
      }`}>
        {done ? "✓" : num}
      </span>
      {label}
    </div>
  );
}
