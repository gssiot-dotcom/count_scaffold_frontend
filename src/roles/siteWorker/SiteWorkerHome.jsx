// src/roles/siteWorker/SiteWorkerHome.jsx
// 현장 직원 홈 - 오늘 작업 목록

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";

export default function SiteWorkerHome() {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getMovements();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorMsg(err.message || "작업 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const receiveWaiting = movements.filter(
    (m) => m.movement_type === "OUT" && m.status === "OUT_IN_TRANSIT"
  );
  const returnWaiting = movements.filter(
    (m) => m.movement_type === "RETURN" && m.status === "RETURN_CREATED"
  );

  return (
    <div className="bg-slate-100">
      {/* 헤더 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[2.125rem] font-semibold text-slate-900">오늘 작업</h1>
              <p className="mt-2 text-[1.1875rem] text-slate-600">
                수령 확인 및 반납 처리가 필요한 회차 목록입니다.
              </p>
            </div>
            {/* ★ 반납 회차 생성 버튼 */}
            <button
              type="button"
              onClick={() => navigate("/site-worker/create-return")}
              className="border border-amber-600 bg-amber-600 px-6 py-3 text-[1.0625rem] font-medium text-white hover:bg-amber-700"
            >
              + 반납 회차 생성
            </button>
          </div>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <StatusCell title="수령 확인 대기" value={`${receiveWaiting.length}건`} warning />
              <StatusCell title="반납 처리 대기" value={`${returnWaiting.length}건`} warning />
              <StatusCell title="전체 회차" value={`${movements.length}건`} />
            </tr>
          </tbody>
        </table>
      </section>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.0625rem] text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 수령 대기 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <h2 className="text-[1.5rem] font-semibold text-slate-900">
            수령 확인 대기
            {receiveWaiting.length > 0 && (
              <span className="ml-3 border border-amber-300 bg-amber-50 px-3 py-1 text-[1rem] font-medium text-amber-800">
                {receiveWaiting.length}건
              </span>
            )}
          </h2>
        </div>
        {loading ? (
          <div className="px-7 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</div>
        ) : receiveWaiting.length === 0 ? (
          <div className="px-7 py-8 text-[1.0625rem] text-slate-500">수령 확인 대기 작업이 없습니다.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {receiveWaiting.map((m) => (
              <WorkCard
                key={m.id}
                movement={m}
                label="수령 확인"
                color="blue"
                onClick={() => navigate(`/site-worker/capture?movement_id=${m.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 반납 대기 */}
      <section className="mb-6 border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.5rem] font-semibold text-slate-900">
              반납 AI 촬영 대기
              {returnWaiting.length > 0 && (
                <span className="ml-3 border border-amber-300 bg-amber-50 px-3 py-1 text-[1rem] font-medium text-amber-800">
                  {returnWaiting.length}건
                </span>
              )}
            </h2>
            {returnWaiting.length > 0 && (
              <button
                type="button"
                onClick={() => navigate("/site-worker/capture")}
                className="border border-blue-900 bg-blue-900 px-5 py-2 text-[0.9375rem] font-medium text-white hover:bg-blue-950"
              >
                사진 촬영하기
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="px-7 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</div>
        ) : returnWaiting.length === 0 ? (
          <div className="px-7 py-8 text-[1.0625rem] text-slate-500">반납 처리 대기 작업이 없습니다.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {returnWaiting.map((m) => (
              <WorkCard
                key={m.id}
                movement={m}
                label="반납 촬영"
                color="amber"
                onClick={() => navigate("/site-worker/capture")}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkCard({ movement, label, color, onClick }) {
  const isBlue = color === "blue";
  return (
    <div className="flex items-center justify-between px-7 py-5 hover:bg-slate-50">
      <div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-[0.875rem] font-semibold ${isBlue ? "bg-blue-900 text-white" : "bg-amber-600 text-white"}`}>
            {label}
          </span>
          <span className="text-[1.125rem] font-semibold text-slate-900">회차 #{movement.id}</span>
        </div>
        <p className="mt-2 text-[1rem] text-slate-600">
          현장: {movement.site_name || movement.site || "-"} &nbsp;|&nbsp; 계약 #{movement.rental || "-"}
        </p>
        <p className="mt-1 text-[0.875rem] text-slate-400">
          {movement.created_at ? new Date(movement.created_at).toLocaleDateString("ko-KR") : "-"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`border px-6 py-3 text-[1rem] font-medium ${
          isBlue
            ? "border-blue-900 bg-blue-900 text-white hover:bg-blue-950"
            : "border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
        }`}
      >
        처리하기
      </button>
    </div>
  );
}

function StatusCell({ title, value, warning }) {
  return (
    <td className="border-r border-slate-300 px-7 py-6 last:border-r-0">
      <span className="block text-[1.0625rem] text-slate-500">{title}</span>
      <strong className={`mt-2 block text-[1.875rem] font-semibold ${warning ? "text-amber-600" : "text-slate-900"}`}>
        {value}
      </strong>
    </td>
  );
}