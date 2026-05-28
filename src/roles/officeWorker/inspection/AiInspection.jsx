// src/roles/officeWorker/inspection/AiInspection.jsx
// AI 수량 판독 — 출고/반납 회차 모두 지원

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../../api/api.js";

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

// 단계별 필터 정의
const STEP_OPTIONS = [
  {
    key: "out_office",
    label: "출고 전 (사무실 확인)",
    type: "OUT",
    statuses: ["OUT_CREATED"],
  },
  {
    key: "out_site",
    label: "현장 수령 확인",
    type: "OUT",
    statuses: ["OUT_IN_TRANSIT"],
  },
  {
    key: "return_site",
    label: "반납 전 (현장 확인)",
    type: "RETURN",
    statuses: ["RETURN_CREATED"],
  },
  {
    key: "return_office",
    label: "사무실 입고 검수",
    type: "RETURN",
    statuses: ["RETURN_CREATED", "RETURN_IN_TRANSIT", "RETURN_FACTORY_CHECKED"],
  },
];

export default function AiInspection() {
  const [searchParams] = useSearchParams();
  const stepFromUrl = searchParams.get("step") || "out_office";
  const [selectedStep, setSelectedStep] = useState(stepFromUrl);
  const [allMovements, setAllMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [movementDetails, setMovementDetails] = useState([]);
  const [selectedDetailId, setSelectedDetailId] = useState("");

  // 이미지 / AI
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

  // 전체 회차 로드
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getMovements();
        setAllMovements(Array.isArray(data) ? data : []);
      } catch {}
    };
    load();
  }, []);

  // 단계 선택 시 해당 회차 필터링
  useEffect(() => {
    const stepConfig = STEP_OPTIONS.find((s) => s.key === selectedStep);
    if (!stepConfig) return;

    const filtered = allMovements.filter(
      (m) =>
        m.movement_type === stepConfig.type &&
        stepConfig.statuses.includes(m.status)
    );
    setFilteredMovements(filtered);
    setSelectedMovementId(filtered.length > 0 ? String(filtered[0].id) : "");
    setMovementDetails([]);
    setSelectedDetailId("");
  }, [selectedStep, allMovements]);

  // 회차 선택 시 MovementDetail 로드
  useEffect(() => {
    if (!selectedMovementId) return;
    const load = async () => {
      try {
        const data = await api.getMovement(selectedMovementId);
        const details = data?.movement_details || [];
        setMovementDetails(details);
        setSelectedDetailId(details.length > 0 ? String(details[0].id) : "");
      } catch {}
    };
    load();
  }, [selectedMovementId]);

  // 이미지 선택
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

  // AI 판독
  const handleDetect = async () => {
    if (!imageFile) { setErrorMsg("이미지를 먼저 선택해주세요."); return; }
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

  // 캔버스 클릭
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
    if (aiHit) {
      setRemovedIds((prev) => [...prev, aiHit.id]);
      return;
    }

    setManualCircles((prev) => [...prev, { cx: clickX, cy: clickY, id: Date.now() }]);
  };

  // 캔버스 렌더링
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
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          const s = r * 0.5;
          ctx.beginPath();
          ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
          ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
          ctx.stroke();
        } else {
          ctx.strokeStyle = color.stroke;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.fillStyle = color.fill;
          ctx.fill();
          ctx.fillStyle = color.stroke;
          ctx.font = `bold ${Math.max(r * 0.55, 10)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${Math.round(box.confidence * 100)}%`, cx, cy);
        }
      });

      manualCircles.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, pointerSize, 0, 2 * Math.PI);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.fillStyle = "rgba(34,197,94,0.25)";
        ctx.fill();
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2;
        const s = pointerSize * 0.45;
        ctx.beginPath();
        ctx.moveTo(c.cx, c.cy - s); ctx.lineTo(c.cx, c.cy + s);
        ctx.moveTo(c.cx - s, c.cy); ctx.lineTo(c.cx + s, c.cy);
        ctx.stroke();
      });
    };
    img.src = previewUrl;
  }, [previewUrl, aiBoxes, removedIds, manualCircles, pointerSize]);

  const handleReset = () => { setRemovedIds([]); setManualCircles([]); };

  // 저장
  const handleSave = async () => {
    if (finalQty === null) { setErrorMsg("AI 판독을 먼저 실행해주세요."); return; }
    if (!selectedDetailId) { setErrorMsg("자재를 선택해주세요."); return; }
    if (!imageFile) { setErrorMsg("이미지 파일이 없습니다. 다시 업로드해주세요."); return; }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await api.createAIRecognition({
        movementDetailId: selectedDetailId,
        detectedQty: finalQty,
        imageFile,
      });

      setSuccessMsg(`최종 수량 ${finalQty}개가 저장되었습니다. 해당 자재의 수량에 반영됩니다.`);
    } catch (err) {
      setErrorMsg(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const currentStepConfig = STEP_OPTIONS.find((s) => s.key === selectedStep);

  return (
    <div className="bg-slate-100">
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">AI 수량 판독</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            촬영 단계를 선택하고 자재를 찍으면 AI가 수량을 자동으로 판독합니다.
          </p>
        </div>

        <div className="p-7">
          {errorMsg && (
            <div className="mb-5 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="mb-5 border border-green-300 bg-green-50 px-5 py-4 text-[1.0625rem] text-green-800">{successMsg}</div>
          )}

          {/* ── 단계 선택 ── */}
          <div className="mb-7">
            <label className="mb-3 block text-[1.125rem] font-semibold text-slate-800">
              촬영 단계 선택
            </label>
            <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {STEP_OPTIONS.map((step) => {
                const isActive = selectedStep === step.key;
                const isOut = step.type === "OUT";
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setSelectedStep(step.key)}
                    className={`border px-4 py-4 text-left transition ${
                      isActive
                        ? isOut
                          ? "border-blue-900 bg-blue-900 text-white"
                          : "border-amber-600 bg-amber-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`mb-1 block text-[0.8125rem] font-semibold ${
                      isActive ? "text-white opacity-80" : isOut ? "text-blue-700" : "text-amber-600"
                    }`}>
                      {isOut ? "출고" : "반납"}
                    </span>
                    <span className="block text-[0.9375rem] font-medium leading-snug">
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 회차 + 자재 선택 ── */}
          <div className="mb-7 border border-slate-300 bg-slate-50 p-6">
            <h2 className="mb-4 text-[1.125rem] font-semibold text-slate-800">
              {currentStepConfig?.label} — 회차 및 자재 선택
            </h2>
            <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
              {/* 회차 선택 */}
              <div>
                <label className="mb-2 block text-[0.9375rem] font-medium text-slate-700">회차 선택</label>
                {filteredMovements.length === 0 ? (
                  <div className="border border-slate-300 bg-white px-4 py-3 text-[0.9375rem] text-slate-500">
                    해당 단계의 처리 대기 회차가 없습니다.
                  </div>
                ) : (
                  <select
                    value={selectedMovementId}
                    onChange={(e) => setSelectedMovementId(e.target.value)}
                    className="h-12 w-full border border-slate-300 bg-white px-4 text-[1rem] focus:border-blue-900 focus:outline-none"
                  >
                    {filteredMovements.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        #{m.id} — {m.site_name || m.site || "현장"} / 계약#{m.rental}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 자재 선택 */}
              <div>
                <label className="mb-2 block text-[0.9375rem] font-medium text-slate-700">
                  자재 선택 <span className="text-red-500">*</span>
                </label>
                {movementDetails.length === 0 ? (
                  <div className="border border-slate-300 bg-white px-4 py-3 text-[0.9375rem] text-slate-500">
                    {selectedMovementId ? "자재 목록이 없습니다." : "회차를 먼저 선택해주세요."}
                  </div>
                ) : (
                  <select
                    value={selectedDetailId}
                    onChange={(e) => setSelectedDetailId(e.target.value)}
                    className="h-12 w-full border border-slate-300 bg-white px-4 text-[1rem] focus:border-blue-900 focus:outline-none"
                  >
                    {movementDetails.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.material_name || d.material || `자재 #${d.id}`}
                        {d.request_qty ? ` — ${d.request_qty}개` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 선택 정보 표시 */}
            {selectedDetailId && movementDetails.length > 0 && (
              <div className="mt-4 border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-[0.9375rem] text-blue-800">
                  선택된 자재:{" "}
                  <strong>
                    {movementDetails.find((d) => String(d.id) === selectedDetailId)?.material_name || "-"}
                  </strong>
                  &nbsp;·&nbsp; 회차 #{selectedMovementId}
                  &nbsp;·&nbsp; MovementDetail ID: {selectedDetailId}
                </p>
              </div>
            )}
          </div>

          {/* ── 이미지 업로드 ── */}
          <div className="mb-6">
            <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">
              검수 이미지 업로드
            </label>
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
              {/* 컨트롤 패널 */}
              <div className="mb-6 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
                <div className="border border-slate-300 bg-slate-50 px-6 py-5">
                  <label className="mb-3 block text-[1.0625rem] font-semibold text-slate-800">포인터 크기</label>
                  <input
                    type="range" min={8} max={60} value={pointerSize}
                    onChange={(e) => setPointerSize(Number(e.target.value))}
                    className="w-full accent-blue-900"
                  />
                  <p className="mt-2 text-[0.9375rem] text-slate-500">현재 크기: {pointerSize}px</p>

                  <div className="mt-4 border border-slate-200 bg-white px-4 py-4">
                    <p className="mb-3 text-[0.875rem] font-semibold text-slate-700">AI 인식 정확도 색상 기준</p>
                    <div className="space-y-2">
                      {[
                        { color: "bg-blue-500 border-blue-500", label: "70% 이상 — 높은 신뢰도" },
                        { color: "bg-yellow-400 border-yellow-400", label: "60% 이상 — 보통 신뢰도" },
                        { color: "bg-red-500 border-red-500", label: "50% 이상 — 낮은 신뢰도 (확인 필요)" },
                        { color: "bg-green-500 border-green-500", label: "수동 추가" },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${color}`}></span>
                          <span className="text-[0.875rem] text-slate-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-blue-200 bg-blue-50 px-6 py-5">
                  <p className="text-[1rem] text-blue-700">최종 판독 수량</p>
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

              {/* 버튼 */}
              <div className="mb-5 flex flex-wrap gap-3">
                <button
                  type="button" onClick={handleDetect} disabled={detecting || !imageFile}
                  className="border border-blue-900 bg-blue-900 px-7 py-3 text-[1.0625rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
                >
                  {detecting ? "AI 판독 중..." : "AI 판독 실행"}
                </button>
                <button
                  type="button" onClick={handleReset}
                  className="border border-slate-400 bg-white px-7 py-3 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50"
                >
                  체크 전체 초기화
                </button>
                {finalQty !== null && (
                  <button
                    type="button" onClick={handleSave}
                    disabled={saving || !selectedDetailId}
                    className="border border-green-700 bg-green-700 px-7 py-3 text-[1.0625rem] font-medium text-white hover:bg-green-800 disabled:bg-slate-400"
                  >
                    {saving ? "저장 중..." : `최종 개수 저장 (${finalQty}개)`}
                  </button>
                )}
              </div>

              {/* 캔버스 */}
              <div className="border border-slate-300 bg-slate-50">
                <div className="border-b border-slate-200 bg-white px-5 py-3">
                  <p className="text-[0.9375rem] text-slate-600">
                    <span className="font-semibold text-blue-800">AI 원 클릭</span> → 삭제 &nbsp;|&nbsp;
                    <span className="font-semibold text-green-700">빈 곳 클릭</span> → 수동 추가 &nbsp;|&nbsp;
                    <span className="font-semibold text-green-700">초록 원 클릭</span> → 수동 삭제
                  </p>
                </div>
                <div className="p-4">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full cursor-crosshair"
                    style={{ maxHeight: "40rem", objectFit: "contain" }}
                  />
                </div>
              </div>
            </>
          )}

          {!previewUrl && (
            <div className="border border-dashed border-slate-300 bg-slate-50 py-20 text-center text-[1.0625rem] text-slate-400">
              이미지를 업로드하면 여기에 표시됩니다.
            </div>
          )}
        </div>
      </section>

      {/* 사용 안내 */}
      <section className="border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.375rem] font-semibold text-slate-900">사용 안내</h2>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-200 max-lg:grid-cols-2 max-lg:divide-x-0 max-lg:divide-y">
          {[
            { step: "1", title: "촬영 단계 선택", desc: "출고 전·현장 수령·반납 전·사무실 입고 중 해당 단계를 선택합니다." },
            { step: "2", title: "회차 + 자재 선택", desc: "해당 단계의 회차와 촬영할 자재를 선택합니다." },
            { step: "3", title: "AI 판독 + 보정", desc: "AI 원 클릭으로 삭제, 빈 곳 클릭으로 추가합니다." },
            { step: "4", title: "최종 저장", desc: "보정된 최종 수량을 저장하면 해당 자재 수량에 반영됩니다." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="px-6 py-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center bg-blue-900 text-[1.125rem] font-bold text-white">
                {step}
              </div>
              <h3 className="text-[1.1875rem] font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}