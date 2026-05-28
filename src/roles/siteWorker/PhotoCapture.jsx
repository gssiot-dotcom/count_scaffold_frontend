// src/roles/siteWorker/PhotoCapture.jsx
// Step 5: 현장 직원 - A→B 전달 완료 후 수령 확인 AI 검수
// OUT_IN_TRANSIT 회차를 선택해 AI로 수령 수량 확인 후 저장
// 저장 후 현장 총책임자가 SiteApproval(tab=receive)에서 서명

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

export default function PhotoCapture() {
  const [searchParams] = useSearchParams();
  const movementIdFromUrl = searchParams.get("movement_id") || "";

  const [movements, setMovements] = useState([]);
  const [selectedMovementId, setSelectedMovementId] = useState(movementIdFromUrl);
  const [movementDetails, setMovementDetails] = useState([]);
  const [selectedDetailId, setSelectedDetailId] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiBoxes, setAiBoxes] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [manualCircles, setManualCircles] = useState([]);
  const [pointerSize, setPointerSize] = useState(20);
  const [detecting, setDetecting] = useState(false);
  const canvasRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeAiCount = aiBoxes.filter((b) => !removedIds.includes(b.id)).length;
  const finalQty = previewUrl ? activeAiCount + manualCircles.length : null;

  // 출고 전달 완료 회차 목록 로드 (OUT_IN_TRANSIT 상태 = 현장 수령 대기)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getMovements();
        const list = (Array.isArray(data) ? data : []).filter(
          (m) => m.movement_type === "OUT" && m.status === "OUT_IN_TRANSIT"
        );
        setMovements(list);

        if (movementIdFromUrl && list.find((m) => String(m.id) === movementIdFromUrl)) {
          setSelectedMovementId(movementIdFromUrl);
        } else if (list.length > 0 && !movementIdFromUrl) {
          setSelectedMovementId(String(list[0].id));
        }
      } catch {}
    };
    load();
  }, []);

  // 회차 선택 시 MovementDetail 로드
  useEffect(() => {
    if (!selectedMovementId) return;
    const load = async () => {
      try {
        const data = await api.getMovement(selectedMovementId);
        const details = data?.movement_details || [];
        setMovementDetails(details);
        setSelectedDetailId(details.length > 0 ? String(details[0].id) : "");
        resetAi();
        setSuccessMsg("");
      } catch {}
    };
    load();
  }, [selectedMovementId]);

  const resetAi = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setAiBoxes([]);
    setRemovedIds([]);
    setManualCircles([]);
    setErrorMsg("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setAiBoxes([]);
    setRemovedIds([]);
    setManualCircles([]);
    setErrorMsg("");
    setSuccessMsg("");
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
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

  const handleSave = async () => {
    if (finalQty === null) { setErrorMsg("AI 판독을 먼저 실행해주세요."); return; }
    if (!selectedDetailId) { setErrorMsg("자재를 선택해주세요."); return; }
    if (!imageFile) { setErrorMsg("이미지 파일이 없습니다. 다시 업로드해주세요."); return; }
    if (!selectedMovementId) { setErrorMsg("회차를 선택해주세요."); return; }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await api.createAIRecognition({
        movementDetailId: selectedDetailId,
        detectedQty: finalQty,
        imageFile,
      });

      setSuccessMsg(
        `수령 수량 ${finalQty}개 저장 완료. 현장 총책임자가 수령 서명을 진행해주세요.`
      );

      setMovements((prev) =>
        prev.filter((m) => String(m.id) !== String(selectedMovementId))
      );
      setSelectedMovementId("");
      setMovementDetails([]);
      resetAi();
    } catch (err) {
      setErrorMsg(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-100">
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">수령 확인 / AI 체크</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            현장에 도착한 자재를 촬영하고 AI로 수령 수량을 확인합니다.
          </p>
        </div>

        <div className="p-7">
          {errorMsg && (
            <div className="mb-5 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="mb-5 border border-green-300 bg-green-50 px-5 py-4 text-[1.0625rem] text-green-800">{successMsg}</div>
          )}

          {/* 회차 + 자재 선택 */}
          <div className="mb-7 border border-slate-300 bg-slate-50 p-6">
            <h2 className="mb-4 text-[1.25rem] font-semibold text-slate-800">수령 회차 및 자재 선택</h2>
            <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
              <div>
                <label className="mb-2 block text-[1rem] font-medium text-slate-700">수령 회차</label>
                {movements.length === 0 ? (
                  <div className="border border-slate-300 bg-white px-4 py-3 text-[1rem] text-slate-500">
                    수령 확인 대기 중인 회차가 없습니다.
                  </div>
                ) : (
                  <select
                    value={selectedMovementId}
                    onChange={(e) => setSelectedMovementId(e.target.value)}
                    className="h-12 w-full border border-slate-300 bg-white px-4 text-[1rem] focus:border-blue-900 focus:outline-none"
                  >
                    {movements.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        #{m.id} — {m.site_name || m.site || "현장"} / 계약#{m.rental}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[1rem] font-medium text-slate-700">
                  자재 선택 <span className="text-red-500">*</span>
                </label>
                {movementDetails.length === 0 ? (
                  <div className="border border-slate-300 bg-white px-4 py-3 text-[1rem] text-slate-500">
                    자재 목록이 없습니다.
                  </div>
                ) : (
                  <select
                    value={selectedDetailId}
                    onChange={(e) => { setSelectedDetailId(e.target.value); resetAi(); setSuccessMsg(""); }}
                    className="h-12 w-full border border-slate-300 bg-white px-4 text-[1rem] focus:border-blue-900 focus:outline-none"
                  >
                    {movementDetails.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.material_name || `자재 #${d.id}`}
                        {d.request_qty ? ` — 출고 ${d.request_qty}개` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="mb-6">
            <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">사진 촬영 / 업로드</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="w-full border border-slate-300 p-3 text-[1rem]"
            />
          </div>

          {previewUrl && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
                <div className="border border-slate-300 bg-slate-50 px-6 py-5">
                  <label className="mb-3 block text-[1.0625rem] font-semibold text-slate-800">포인터 크기</label>
                  <input
                    type="range" min={8} max={60} value={pointerSize}
                    onChange={(e) => setPointerSize(Number(e.target.value))}
                    className="w-full accent-blue-900"
                  />
                  <p className="mt-2 text-[0.9375rem] text-slate-500">현재 크기: {pointerSize}px</p>
                  <div className="mt-4 border border-slate-200 bg-white px-4 py-3">
                    <p className="mb-2 text-[0.875rem] font-semibold text-slate-700">AI 인식 정확도</p>
                    <div className="space-y-1">
                      {[
                        { color: "bg-blue-500", label: "70% 이상 — 높은 신뢰도" },
                        { color: "bg-yellow-400", label: "60% 이상 — 보통 신뢰도" },
                        { color: "bg-red-500", label: "50% 이상 — 낮은 신뢰도" },
                        { color: "bg-green-500", label: "수동 추가" },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className={`h-3 w-3 shrink-0 rounded-full ${color}`}></span>
                          <span className="text-[0.8125rem] text-slate-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-blue-200 bg-blue-50 px-6 py-5">
                  <p className="text-[1rem] text-blue-700">최종 수령 수량</p>
                  <p className="mt-1 text-[3.25rem] font-black text-blue-900">
                    {finalQty ?? "-"}
                    <span className="ml-2 text-[1.375rem] font-semibold">개</span>
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="border border-blue-200 bg-white px-2 py-2 text-center">
                      <p className="text-[0.75rem] text-slate-500">AI 판독</p>
                      <p className="text-[1.25rem] font-bold text-slate-900">{aiBoxes.length}</p>
                    </div>
                    <div className="border border-red-200 bg-white px-2 py-2 text-center">
                      <p className="text-[0.75rem] text-slate-500">삭제</p>
                      <p className="text-[1.25rem] font-bold text-red-600">
                        {removedIds.length > 0 ? `-${removedIds.length}` : "0"}
                      </p>
                    </div>
                    <div className="border border-green-200 bg-white px-2 py-2 text-center">
                      <p className="text-[0.75rem] text-slate-500">수동 추가</p>
                      <p className="text-[1.25rem] font-bold text-green-600">
                        {manualCircles.length > 0 ? `+${manualCircles.length}` : "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-3">
                <button
                  type="button" onClick={handleDetect} disabled={detecting || !imageFile}
                  className="border border-blue-900 bg-blue-900 px-7 py-3 text-[1.0625rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
                >
                  {detecting ? "AI 판독 중..." : "AI 판독 실행"}
                </button>
                <button
                  type="button" onClick={() => { setRemovedIds([]); setManualCircles([]); }}
                  className="border border-slate-400 bg-white px-7 py-3 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50"
                >
                  체크 초기화
                </button>
                {finalQty !== null && (
                  <button
                    type="button" onClick={handleSave}
                    disabled={saving || !selectedDetailId}
                    className="border border-green-700 bg-green-700 px-7 py-3 text-[1.0625rem] font-medium text-white hover:bg-green-800 disabled:bg-slate-400"
                  >
                    {saving ? "저장 중..." : `수령 수량 저장 (${finalQty}개)`}
                  </button>
                )}
              </div>

              <div className="border border-slate-300 bg-slate-50">
                <div className="border-b border-slate-200 bg-white px-5 py-3">
                  <p className="text-[0.9375rem] text-slate-600">
                    <span className="font-semibold text-blue-800">AI 원 클릭</span> → 삭제 &nbsp;|&nbsp;
                    <span className="font-semibold text-green-700">빈 곳 클릭</span> → 추가 &nbsp;|&nbsp;
                    <span className="font-semibold text-green-700">초록 원 클릭</span> → 삭제
                  </p>
                </div>
                <div className="p-4">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full cursor-crosshair"
                    style={{ maxHeight: "37.5rem", objectFit: "contain" }}
                  />
                </div>
              </div>
            </>
          )}

          {!previewUrl && (
            <div className="border border-dashed border-slate-300 bg-slate-50 py-20 text-center text-[1.0625rem] text-slate-400">
              사진을 선택하면 여기에 표시됩니다.
            </div>
          )}
        </div>
      </section>

      {/* 안내 */}
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.375rem] font-semibold text-slate-900">촬영 안내</h2>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-200 max-lg:grid-cols-2 max-lg:divide-x-0 max-lg:divide-y">
          {[
            { step: "1", title: "회차 + 자재 선택", desc: "수령 확인 대기 중인 출고 회차와 자재를 선택합니다." },
            { step: "2", title: "사진 촬영", desc: "도착한 자재를 정면에서 촬영하세요." },
            { step: "3", title: "AI 판독 + 보정", desc: "AI 원을 클릭해 삭제하거나 빈 곳을 클릭해 추가합니다." },
            { step: "4", title: "수량 저장", desc: "저장 후 현장 총책임자가 수령 서명을 진행합니다." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="px-6 py-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center bg-blue-900 text-[1.125rem] font-bold text-white">{step}</div>
              <h3 className="text-[1.1875rem] font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
