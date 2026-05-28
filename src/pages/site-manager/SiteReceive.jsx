import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/api.js";

export default function SiteReceive() {
  const [movements, setMovements] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [movement, setMovement] = useState(null);
  const [details, setDetails] = useState([]);

  const [photoFile, setPhotoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureCanvas, setSignatureCanvas] = useState(null); // Canvas 서명

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await api.getMovements();
      const list = (data || []).filter(
        (m) => m.movement_type === "OUT" && m.status === "OUT_IN_TRANSIT"
      );
      setMovements(list);

      if (list.length > 0) {
        setSelectedId(String(list[0].id));
      } else {
        setSelectedId("");
        setMovement(null);
        setDetails([]);
      }
    } catch (error) {
      alert(error.message || "출고 이동 중 회차를 불러오지 못했습니다.");
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

      const mapped = (data.movement_details || []).map((item) => ({
        movement_detail_id: item.id,
        material_name: item.material_name || "자재",
        office_out_qty: Number(item.office_out_qty || item.request_qty || 0),
        site_receive_qty: Number(
          item.site_receive_qty || item.office_out_qty || item.request_qty || 0
        ),
      }));

      setDetails(mapped);
    } catch (error) {
      alert(error.message || "회차 상세를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMovement(selectedId);
    }
  }, [selectedId]);

  const totalQty = useMemo(
    () => details.reduce((sum, item) => sum + Number(item.site_receive_qty || 0), 0),
    [details]
  );

  const updateQty = (index, value) => {
    setDetails((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, site_receive_qty: Number(value || 0) }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!movement) {
      alert("회차를 선택해주세요.");
      return;
    }

    // 서명은 Canvas 또는 파일 중 하나 필수
    if (!signatureCanvas && !signatureFile) {
      alert("서명을 작성하거나 파일을 첨부해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      if (photoFile) formData.append("photo", photoFile);

      // Canvas 서명이 있으면 Blob으로 변환해서 전송
      if (signatureCanvas) {
        const blob = await new Promise((resolve) =>
          signatureCanvas.toBlob(resolve, "image/png")
        );
        formData.append("signature", blob, "signature.png");
      } else if (signatureFile) {
        formData.append("signature", signatureFile);
      }

      formData.append(
        "details",
        JSON.stringify(
          details.map((item) => ({
            movement_detail_id: item.movement_detail_id,
            site_receive_qty: Number(item.site_receive_qty || 0),
          }))
        )
      );

      await api.siteReceiveSign(movement.id, formData);

      alert("현장 수령 확인이 완료되었습니다.");

      setPhotoFile(null);
      setSignatureFile(null);
      setSignatureCanvas(null);
      await loadMovements();
    } catch (error) {
      alert(error.message || "현장 수령 확인 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkflowPage
      title="현장 수령 서명"
      movements={movements}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      movement={movement}
      details={details}
      qtyKey="site_receive_qty"
      onQtyChange={updateQty}
      totalQty={totalQty}
      photoFile={photoFile}
      setPhotoFile={setPhotoFile}
      signatureFile={signatureFile}
      setSignatureFile={setSignatureFile}
      signatureCanvas={signatureCanvas}
      setSignatureCanvas={setSignatureCanvas}
      loading={loading}
      submitting={submitting}
      submitText="현장 수령 완료"
      onSubmit={handleSubmit}
    />
  );
}

function WorkflowPage(props) {
  return <BaseWorkflowPage {...props} />;
}

function BaseWorkflowPage({
  title,
  movements,
  selectedId,
  setSelectedId,
  movement,
  details,
  qtyKey,
  onQtyChange,
  totalQty,
  photoFile,
  setPhotoFile,
  signatureFile,
  setSignatureFile,
  signatureCanvas,
  setSignatureCanvas,
  loading,
  submitting,
  submitText,
  onSubmit,
}) {
  return (
    <div className="bg-slate-100">
      <section className="mb-7 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            선택한 회차의 수량을 확인하고 서명합니다.
          </p>
        </div>
        <div className="p-7">
          {loading ? (
            <p>불러오는 중...</p>
          ) : movements.length === 0 ? (
            <p>처리 가능한 회차가 없습니다.</p>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-12 w-full border border-slate-400 px-4"
            >
              {movements.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  #{item.id} / {item.site_name || "현장"}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {movement && (
        <>
          <section className="mb-7 border border-slate-300 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b bg-slate-100 px-5 py-4 text-left">자재명</th>
                    <th className="border-b bg-slate-100 px-5 py-4 text-left">수량</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((item, index) => (
                    <tr key={item.movement_detail_id}>
                      <td className="border-b px-5 py-4">{item.material_name}</td>
                      <td className="border-b px-5 py-4">
                        <input
                          type="number"
                          value={item[qtyKey]}
                          onChange={(e) => onQtyChange(index, e.target.value)}
                          className="h-11 w-32 border border-slate-400 px-3"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-7 grid grid-cols-2 gap-6 max-xl:grid-cols-1">
            <FileBox title="사진" file={photoFile} setFile={setPhotoFile} />
            <SignatureBox
              signatureCanvas={signatureCanvas}
              setSignatureCanvas={setSignatureCanvas}
              signatureFile={signatureFile}
              setSignatureFile={setSignatureFile}
            />
          </section>

          <div className="flex justify-between items-center">
            <div className="text-[1.375rem] font-semibold">총 수량: {totalQty}개</div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="border border-blue-900 bg-blue-900 px-8 py-4 text-white disabled:bg-slate-300"
            >
              {submitting ? "처리 중..." : submitText}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FileBox({ title, file, setFile }) {
  return (
    <section className="border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
        <h2 className="text-[1.5rem] font-semibold">{title}</h2>
      </div>
      <div className="p-7">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border border-slate-400 p-4"
        />
        {file && <p className="mt-3 text-blue-800">선택된 파일: {file.name}</p>}
      </div>
    </section>
  );
}

function SignatureBox({
  signatureCanvas,
  setSignatureCanvas,
  signatureFile,
  setSignatureFile,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState("draw"); // 'draw' | 'upload'

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    setSignatureCanvas(canvasRef.current);
    setSignatureFile(null); // Canvas 그리면 파일 첨부 무효화
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureCanvas(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0] || null;
    setSignatureFile(file);
    if (file) {
      clearCanvas(); // 파일 첨부하면 Canvas 초기화
    }
  };

  return (
    <section className="border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
        <h2 className="text-[1.5rem] font-semibold">
          서명 <span className="ml-2 text-red-600">*</span>
        </h2>
      </div>

      <div className="p-7">
        {/* 모드 선택 */}
        <div className="mb-4 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`flex-1 border py-3 text-[1rem] font-medium transition-colors ${
              mode === "draw"
                ? "border-blue-900 bg-blue-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            ✍️ 직접 그리기
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 border py-3 text-[1rem] font-medium transition-colors ${
              mode === "upload"
                ? "border-blue-900 bg-blue-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            📎 파일 첨부
          </button>
        </div>

        {mode === "draw" ? (
          <>
            {/* Canvas 서명 패드 */}
            <div className="relative mb-4 border-2 border-slate-300 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!signatureCanvas && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400">
                  여기에 서명하세요
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={clearCanvas}
              className="w-full border border-slate-400 bg-white py-3 text-[0.9375rem] text-slate-700 hover:bg-slate-50"
            >
              서명 지우기
            </button>

            {signatureCanvas && (
              <p className="mt-3 text-[0.875rem] text-green-700">
                ✓ 서명이 작성되었습니다.
              </p>
            )}
          </>
        ) : (
          <>
            {/* 파일 첨부 */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full border border-slate-400 p-4"
            />
            {signatureFile && (
              <p className="mt-3 text-blue-800">
                선택된 파일: {signatureFile.name}
              </p>
            )}
            <p className="mt-3 text-[0.8125rem] text-slate-500">
              * 그리기가 어려운 경우 서명 이미지를 파일로 첨부하세요.
            </p>
          </>
        )}
      </div>
    </section>
  );
}