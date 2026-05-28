// src/roles/common/movement/MovementDetail.jsx
// 출고/반납 회차 상세 페이지 (공통)
// 사용처: officeManager, officeWorker, siteManager, siteWorker 모두 동일 컴포넌트

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, getLoginUser } from "../../../api/api.js";

const MOVEMENT_TYPE_LABEL = { OUT: "출고", RETURN: "반납" };

const MOVEMENT_STATUS_LABEL = {
  OUT_CREATED: "출고 생성",
  OUT_OFFICE_CHECKED: "사무실 확인",
  OUT_OFFICE_SIGNED: "사무실 서명완료",
  OUT_IN_TRANSIT: "이동 중",
  OUT_SITE_RECEIVED: "현장 수령확인",
  OUT_SITE_SIGNED: "현장 서명완료",
  OUT_COMPLETED: "출고 완료",
  RETURN_CREATED: "반납 생성",
  RETURN_SITE_CHECKED: "현장 확인",
  RETURN_SITE_SIGNED: "현장 서명완료",
  RETURN_IN_TRANSIT: "이동 중",
  RETURN_FACTORY_CHECKED: "검수 완료",
  RETURN_OFFICE_SIGNED: "사무실 서명완료",
  RETURN_COMPLETED: "반납 완료",
};

function getStatusStyle(status = "") {
  if (status.includes("COMPLETED")) return "border border-green-300 bg-green-50 text-green-800";
  if (status.includes("SIGNED")) return "border border-blue-300 bg-blue-50 text-blue-800";
  if (status.includes("TRANSIT")) return "border border-amber-300 bg-amber-50 text-amber-800";
  return "border border-slate-300 bg-slate-50 text-slate-700";
}

// 현재 단계에서 이 유저가 할 수 있는 액션 판단
function resolveAction(movement, role) {
  const { status, movement_type } = movement;
  if (movement_type === "OUT") {
    if (status === "OUT_CREATED" && (role === "officeManager" || role === "officeWorker"))
      return "office-out-sign";
    if (status === "OUT_IN_TRANSIT" && (role === "siteManager" || role === "siteWorker"))
      return "site-receive-sign";
  }
  if (movement_type === "RETURN") {
    if (status === "RETURN_CREATED" && (role === "siteManager" || role === "siteWorker"))
      return "site-return-sign";
    if (status === "RETURN_IN_TRANSIT" && (role === "officeManager" || role === "officeWorker"))
      return "office-in-sign";
  }
  return null;
}

export default function MovementDetail() {
  const { movementId } = useParams();
  const navigate = useNavigate();
  const me = getLoginUser();

  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 서명 폼 상태
  const [photoFile, setPhotoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [details, setDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadMovement = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await api.getMovement(movementId);
      setMovement(data);

      // 수량 입력 초기값 세팅
      const mapped = (data.movement_details || []).map((item) => ({
        movement_detail_id: item.id,
        material_name: item.material_name || item.material || "자재",
        spec: item.spec || "-",
        planned_qty: item.planned_qty || 0,
        request_qty: item.request_qty || 0,
        office_out_qty: item.office_out_qty || item.request_qty || 0,
        site_receive_qty: item.site_receive_qty || item.office_out_qty || item.request_qty || 0,
        return_qty: item.return_qty || item.site_request_return_qty || 0,
        final_in_qty: item.final_in_qty || 0,
        loss_qty: item.loss_qty || 0,
        broken_qty: item.broken_qty || 0,
        discarded_qty: item.discarded_qty || 0,
      }));
      setDetails(mapped);
    } catch (err) {
      setErrorMsg(err.message || "회차 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movementId) loadMovement();
  }, [movementId]);

  const updateDetail = (index, field, value) => {
    setDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: Number(value) } : item
      )
    );
  };

  const handleSign = async () => {
    if (!signatureFile) {
      alert("서명 파일을 첨부해주세요.");
      return;
    }
    const action = resolveAction(movement, me?.role);
    if (!action) {
      alert("현재 단계에서 처리할 수 있는 서명이 없습니다.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (photoFile) formData.append("photo", photoFile);
      formData.append("signature", signatureFile);

      // 액션별 detail 키 매핑
      const detailKey = {
        "office-out-sign": (d) => ({ movement_detail_id: d.movement_detail_id, office_out_qty: d.office_out_qty }),
        "site-receive-sign": (d) => ({ movement_detail_id: d.movement_detail_id, site_receive_qty: d.site_receive_qty }),
        "site-return-sign": (d) => ({ movement_detail_id: d.movement_detail_id, return_qty: d.return_qty }),
        "office-in-sign": (d) => ({
          movement_detail_id: d.movement_detail_id,
          final_in_qty: d.final_in_qty,
          loss_qty: d.loss_qty,
          broken_qty: d.broken_qty,
          discarded_qty: d.discarded_qty,
        }),
      };

      formData.append("details", JSON.stringify(details.map(detailKey[action])));

      const apiMap = {
        "office-out-sign": () => api.officeOutSign(movement.id, formData),
        "site-receive-sign": () => api.siteReceiveSign(movement.id, formData),
        "site-return-sign": () => api.siteReturnSign(movement.id, formData),
        "office-in-sign": () => api.officeInSign(movement.id, formData),
      };

      await apiMap[action]();
      alert("서명이 완료되었습니다.");
      setPhotoFile(null);
      setSignatureFile(null);
      await loadMovement();
    } catch (err) {
      alert(err.message || "서명 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 문서 다운로드
  const handleDownload = async (type) => {
    try {
      const blobMap = {
        dispatch: () => api.downloadMovementDispatch(movement.id),
        invoice: () => api.downloadMovementInvoice(movement.id),
        returnConfirm: () => api.downloadMovementReturnConfirm(movement.id),
      };
      const blob = await blobMap[type]();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const nameMap = {
        dispatch: `Rental${movement.rental}_OUT${movement.id}_반출증.xlsx`,
        invoice: `Rental${movement.rental}_OUT${movement.id}_출고송장.xlsx`,
        returnConfirm: `Rental${movement.rental}_RETURN${movement.id}_입고검수확인서.xlsx`,
      };
      a.download = nameMap[type];
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "다운로드에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-100 p-8">
        <div className="border border-slate-300 bg-white px-8 py-16 text-center text-[1.25rem] text-slate-500">
          회차 정보를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (errorMsg || !movement) {
    return (
      <div className="bg-slate-100 p-8">
        <div className="border border-red-300 bg-red-50 px-8 py-10 text-[1.125rem] text-red-700">
          {errorMsg || "회차를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  const action = resolveAction(movement, me?.role);
  const isOut = movement.movement_type === "OUT";
  const isReturn = movement.movement_type === "RETURN";
  const isCompleted =
    movement.status === "OUT_COMPLETED" || movement.status === "RETURN_COMPLETED";

  return (
    <div className="bg-slate-100">

      {/* 뒤로가기 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-slate-300 bg-white px-5 py-2 text-[1rem] text-slate-700 hover:bg-slate-50"
        >
          ← 목록으로
        </button>
      </div>

      {/* 기본 정보 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">
                회차 #{movement.id}&nbsp;
                <span className={`ml-2 px-3 py-1 text-[1.25rem] ${isOut ? "bg-blue-900 text-white" : "bg-amber-600 text-white"}`}>
                  {MOVEMENT_TYPE_LABEL[movement.movement_type]}
                </span>
              </h1>
              <p className="mt-2 text-[1.125rem] text-slate-600">
                계약 #{movement.rental || "-"} &nbsp;|&nbsp; 현장:{" "}
                {movement.site_name || movement.site || "-"}
              </p>
            </div>
            <span className={`px-4 py-2 text-[1.0625rem] font-medium ${getStatusStyle(movement.status)}`}>
              {MOVEMENT_STATUS_LABEL[movement.status] || movement.status}
            </span>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 max-lg:grid-cols-2">
          <MetaCell label="생성자" value={movement.created_by_name || movement.created_by || "-"} />
          <MetaCell label="생성일" value={movement.created_at ? new Date(movement.created_at).toLocaleDateString("ko-KR") : "-"} />
          <MetaCell label="사무실 서명" value={movement.office_out_signed_by_name || movement.office_in_signed_by_name || "-"} />
          <MetaCell label="현장 서명" value={movement.site_receive_signed_by_name || movement.site_return_signed_by_name || "-"} />
        </div>
      </section>

      {/* 자재 수량 테이블 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.5rem] font-semibold text-slate-900">자재 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {isOut ? (
                  <>
                    <Th>자재명</Th>
                    <Th>규격</Th>
                    <Th>요청 수량</Th>
                    <Th>사무실 출고 수량</Th>
                    <Th>현장 수령 수량</Th>
                    <Th>차이</Th>
                  </>
                ) : (
                  <>
                    <Th>자재명</Th>
                    <Th>규격</Th>
                    <Th>반납 요청 수량</Th>
                    <Th>최종 입고 수량</Th>
                    <Th>LOSS</Th>
                    <Th>파손</Th>
                    <Th>폐기</Th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[1.0625rem] text-slate-500">
                    자재 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                details.map((item, index) => (
                  <tr key={item.movement_detail_id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-medium text-slate-900">
                      {item.material_name}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-600">
                      {item.spec}
                    </td>
                    {isOut ? (
                      <>
                        <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">
                          {item.request_qty}
                        </td>
                        <td className="border-b border-slate-200 px-5 py-4">
                          {action === "office-out-sign" ? (
                            <input
                              type="number"
                              value={item.office_out_qty}
                              onChange={(e) => updateDetail(index, "office_out_qty", e.target.value)}
                              className="h-10 w-28 border border-slate-400 px-3 text-[1rem]"
                            />
                          ) : (
                            <span className="text-[1.0625rem]">{item.office_out_qty}</span>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-5 py-4">
                          {action === "site-receive-sign" ? (
                            <input
                              type="number"
                              value={item.site_receive_qty}
                              onChange={(e) => updateDetail(index, "site_receive_qty", e.target.value)}
                              className="h-10 w-28 border border-slate-400 px-3 text-[1rem]"
                            />
                          ) : (
                            <span className="text-[1.0625rem]">{item.site_receive_qty}</span>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">
                          <span className={item.office_out_qty - item.site_receive_qty !== 0 ? "text-red-600 font-semibold" : "text-slate-500"}>
                            {item.office_out_qty - item.site_receive_qty !== 0
                              ? `${item.office_out_qty - item.site_receive_qty > 0 ? "+" : ""}${item.office_out_qty - item.site_receive_qty}`
                              : "0"}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem]">
                          {item.return_qty}
                        </td>
                        {["final_in_qty", "loss_qty", "broken_qty", "discarded_qty"].map((field) => (
                          <td key={field} className="border-b border-slate-200 px-5 py-4">
                            {action === "office-in-sign" ? (
                              <input
                                type="number"
                                value={item[field]}
                                onChange={(e) => updateDetail(index, field, e.target.value)}
                                className="h-10 w-24 border border-slate-400 px-3 text-[1rem]"
                              />
                            ) : (
                              <span className={`text-[1.0625rem] ${field !== "final_in_qty" && item[field] > 0 ? "text-red-600 font-semibold" : ""}`}>
                                {item[field]}
                              </span>
                            )}
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 서명/사진 섹션 - 처리할 액션이 있을 때만 */}
      {action && (
        <section className="mb-6 border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
            <h2 className="text-[1.5rem] font-semibold text-slate-900">서명 처리</h2>
            <p className="mt-1 text-[1rem] text-slate-600">
              사진과 서명 파일을 첨부한 후 확인 버튼을 눌러주세요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 p-7 max-lg:grid-cols-1">
            <FileBox
              title="사진"
              file={photoFile}
              setFile={setPhotoFile}
              accept="image/*"
            />
            <FileBox
              title="서명"
              required
              file={signatureFile}
              setFile={setSignatureFile}
              accept="image/*"
            />
          </div>
          <div className="flex justify-end border-t border-slate-200 px-7 py-5">
            <button
              type="button"
              onClick={handleSign}
              disabled={submitting}
              className="border border-blue-900 bg-blue-900 px-8 py-4 text-[1.125rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
            >
              {submitting ? "처리 중..." : "서명 완료"}
            </button>
          </div>
        </section>
      )}

      {/* 문서 다운로드 */}
      {isCompleted && (
        <section className="mb-6 border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
            <h2 className="text-[1.5rem] font-semibold text-slate-900">문서 다운로드</h2>
          </div>
          <div className="flex flex-wrap gap-4 p-7">
            {isOut && (
              <>
                <DownloadButton label="반출증 다운로드" onClick={() => handleDownload("dispatch")} />
                <DownloadButton label="출고송장 다운로드" onClick={() => handleDownload("invoice")} />
              </>
            )}
            {isReturn && (
              <DownloadButton label="입고검수확인서 다운로드" onClick={() => handleDownload("returnConfirm")} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="px-6 py-5">
      <span className="block text-[0.9375rem] text-slate-500">{label}</span>
      <strong className="mt-1 block text-[1.1875rem] font-medium text-slate-900">{value}</strong>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">
      {children}
    </th>
  );
}

function FileBox({ title, required, file, setFile, accept }) {
  return (
    <div className="border border-slate-300 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h3 className="text-[1.25rem] font-semibold text-slate-800">
          {title}
          {required && <span className="ml-2 text-red-600">*</span>}
        </h3>
      </div>
      <div className="p-5">
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border border-slate-300 p-3 text-[1rem]"
        />
        {file && (
          <p className="mt-3 text-[0.9375rem] text-blue-800">선택된 파일: {file.name}</p>
        )}
      </div>
    </div>
  );
}

function DownloadButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-blue-900 bg-white px-6 py-3 text-[1.0625rem] font-medium text-blue-900 hover:bg-blue-50"
    >
      ⬇ {label}
    </button>
  );
}