// src/roles/common/movement/MovementList.jsx
// 출고/반납 회차 목록 공통 컴포넌트
// 사용처: OfficeManagerDashboard, OfficeWorkerDashboard 등

import { useNavigate } from "react-router-dom";

const MOVEMENT_TYPE_LABEL = {
  OUT: "출고",
  RETURN: "반납",
};

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

// 상태별 배지 색상
function getStatusStyle(status) {
  if (!status) return "border border-slate-300 bg-slate-50 text-slate-700";
  if (status.includes("COMPLETED"))
    return "border border-green-300 bg-green-50 text-green-800";
  if (status.includes("SIGNED"))
    return "border border-blue-300 bg-blue-50 text-blue-800";
  if (status.includes("TRANSIT"))
    return "border border-amber-300 bg-amber-50 text-amber-800";
  if (status.includes("CREATED"))
    return "border border-slate-300 bg-slate-50 text-slate-700";
  return "border border-blue-200 bg-blue-50 text-blue-700";
}

// 타입별 배지 색상
function getTypeStyle(type) {
  if (type === "OUT")
    return "border border-blue-400 bg-blue-900 text-white";
  if (type === "RETURN")
    return "border border-amber-400 bg-amber-600 text-white";
  return "border border-slate-300 bg-slate-100 text-slate-700";
}

/**
 * MovementList
 *
 * Props:
 *  - movements: Movement 배열
 *  - loading: boolean
 *  - basePath: string (예: "/office-manager", "/office-worker")
 *    → 상세 이동 경로: `${basePath}/movements/${id}`
 *  - title: string (optional, 기본: "출고/반납 회차 목록")
 *  - filterType: "OUT" | "RETURN" | null (null이면 전체)
 *  - emptyMessage: string (optional)
 */
export default function MovementList({
  movements = [],
  loading = false,
  basePath = "/office-manager",
  title = "출고/반납 회차 목록",
  filterType = null,
  emptyMessage = "표시할 회차가 없습니다.",
}) {
  const navigate = useNavigate();

  const filteredMovements = filterType
    ? movements.filter((m) => m.movement_type === filterType)
    : movements;

  return (
    <section className="border border-slate-300 bg-white">
      {/* 헤더 */}
      <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.625rem] font-semibold text-slate-900">{title}</h2>
          <div className="flex gap-2 text-[0.9375rem] text-slate-500">
            <span className="border border-blue-900 bg-blue-900 px-3 py-1 text-white">
              출고 {movements.filter((m) => m.movement_type === "OUT").length}건
            </span>
            <span className="border border-amber-600 bg-amber-600 px-3 py-1 text-white">
              반납 {movements.filter((m) => m.movement_type === "RETURN").length}건
            </span>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {[
                "유형",
                "현장",
                "상태",
                "생성일",
                "상세",
              ].map((header) => (
                <th
                  key={header}
                  className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.0625rem] font-medium text-slate-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-[1.125rem] text-slate-500"
                >
                  회차 정보를 불러오는 중입니다...
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-[1.125rem] text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredMovements.map((movement) => (
                <tr
                  key={movement.id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() =>
                    navigate(`${basePath}/movements/${movement.id}`)
                  }
                >
                  {/* 유형 */}
                  <td className="border-b border-slate-200 px-5 py-5">
                    <span
                      className={`px-3 py-1 text-[0.9375rem] font-semibold ${getTypeStyle(
                        movement.movement_type
                      )}`}
                    >
                      {MOVEMENT_TYPE_LABEL[movement.movement_type] ||
                        movement.movement_type}
                    </span>
                  </td>

                  {/* 현장 */}
                  <td className="border-b border-slate-200 px-5 py-5 text-[1.0625rem] text-slate-800">
                    {movement.site_name || movement.site || "-"}
                  </td>

                  {/* 상태 */}
                  <td className="border-b border-slate-200 px-5 py-5">
                    <span
                      className={`px-3 py-1 text-[0.9375rem] font-medium ${getStatusStyle(
                        movement.status
                      )}`}
                    >
                      {MOVEMENT_STATUS_LABEL[movement.status] ||
                        movement.status ||
                        "-"}
                    </span>
                  </td>

                  {/* 생성일 */}
                  <td className="border-b border-slate-200 px-5 py-5 text-[1rem] text-slate-600">
                    {movement.created_at
                      ? new Date(movement.created_at).toLocaleDateString(
                          "ko-KR"
                        )
                      : "-"}
                  </td>

                  {/* 상세 버튼 */}
                  <td
                    className="border-b border-slate-200 px-5 py-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`${basePath}/movements/${movement.id}`)
                      }
                      className="border border-slate-400 bg-white px-4 py-2 text-[1rem] font-medium text-slate-800 hover:bg-slate-100"
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}