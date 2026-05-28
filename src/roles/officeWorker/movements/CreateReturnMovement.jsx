// src/roles/officeWorker/movements/CreateReturnMovement.jsx
// [7단계] 반납 회차 생성
// UX 흐름: OUT_COMPLETED 회차 목록 → 회차 선택 → 반납 회차 생성 → 사진 촬영 화면 이동

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/api.js";

// ─────────────────────────────────────────────
// 서브 컴포넌트: 반납 가능 회차 목록
// ─────────────────────────────────────────────
function ReturnAvailableSection({ movements, onCreateReturn, submittingId }) {
  return (
    <section className="mb-7 border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
        <h2 className="text-[1.625rem] font-semibold text-slate-900">
          반납 가능 회차
        </h2>
        <p className="mt-1 text-[1rem] text-slate-500">
          출고 완료된 회차를 선택하면 반납 회차를 생성할 수 있습니다.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["출고 회차", "현장", "상태", "생성일", "처리"].map((h) => (
                <th
                  key={h}
                  className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-[1.125rem] text-slate-500"
                >
                  반납 가능한 출고 완료 회차가 없습니다.
                </td>
              </tr>
            ) : (
              movements.map((movement) => {
                const isSubmitting = submittingId === movement.id;
                return (
                  <tr key={movement.id} className="hover:bg-blue-50">
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.125rem] font-medium text-blue-900">
                      #{movement.id}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-800">
                      {movement.site_name || movement.site || "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-green-700">
                      출고 완료
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-600">
                      {movement.created_at
                        ? new Date(movement.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="border-b border-slate-200 px-5 py-5">
                      <button
                        type="button"
                        onClick={() => onCreateReturn(movement)}
                        disabled={isSubmitting || submittingId !== null}
                        className="border border-green-700 bg-green-700 px-5 py-3 text-[1.0625rem] font-medium text-white hover:bg-green-800 disabled:border-slate-400 disabled:bg-slate-400"
                      >
                        {isSubmitting ? "생성 중..." : "반납 회차 생성"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function CreateReturnMovement() {
  const navigate = useNavigate();

  const [movements, setMovements] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  // 어느 회차를 처리 중인지 추적 (null이면 미처리 중)
  const [submittingId, setSubmittingId] = useState(null);

  // OUT_COMPLETED 회차 목록 로드
  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        const data = await api.getMovements(); // 기존 API 변경 없음
        const outCompleted = (Array.isArray(data) ? data : []).filter(
          (m) => m.status === "OUT_COMPLETED"
        );
        setMovements(outCompleted);
      } catch (err) {
        setErrorMsg(err.message || "회차 목록을 불러오지 못했습니다.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  // 반납 회차 생성 → 사진 촬영 화면 이동
  const handleCreateReturn = async (movement) => {
    setErrorMsg("");
    setSubmittingId(movement.id);

    try {
      const formData = new FormData();
      formData.append("rental_id", String(movement.rental ?? movement.rental_id ?? ""));
      formData.append("movement_id", String(movement.id));
      // 수량 입력 없이 회차 단위로 생성 (기존 API 스펙 유지)
      formData.append("details", JSON.stringify([]));

      const result = await api.createReturnMovement(formData);

      // 생성된 반납 회차 ID를 가지고 사진 촬영 화면으로 이동
      // 경로는 프로젝트 라우터 설정에 맞게 조정 필요
      navigate(`/office-worker/rental/return-movement/${result.id}/photo`);
    } catch (err) {
      setErrorMsg(err.message || "반납 회차 생성에 실패했습니다.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="bg-slate-100">
      <section className="mb-6 border border-slate-300 bg-white">
        {/* 헤더 */}
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <h1 className="text-[2.125rem] font-semibold text-slate-900">
            반납 회차 생성
          </h1>
          <p className="mt-2 text-[1.1875rem] text-slate-600">
            출고 완료된 회차를 선택해 반납 회차를 생성합니다.
          </p>
        </div>

        <div className="p-7">
          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">
              {errorMsg}
            </div>
          )}

          {/* 목록 로딩 중 */}
          {pageLoading ? (
            <div className="border border-slate-300 bg-slate-50 px-5 py-8 text-center text-[1.0625rem] text-slate-500">
              회차 목록 불러오는 중...
            </div>
          ) : (
            <ReturnAvailableSection
              movements={movements}
              onCreateReturn={handleCreateReturn}
              submittingId={submittingId}
            />
          )}

          {/* 취소 버튼 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/office-worker/rental")}
              className="border border-slate-300 bg-white px-7 py-4 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}