import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../../api/api.js";

import MovementList from "../common/movement/MovementList.jsx";

const RENTAL_STATUS_LABEL = {

  REQUESTED: "승인 대기",

  APPROVED: "승인 완료",

  ACTIVE: "진행 중",

  CLOSED: "종료",

  CANCELLED: "취소",

};

export default function OfficeManagerDashboard() {

  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);

  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {

    try {

      setLoading(true);

      setErrorMsg("");

      const [rentalData, movementData] = await Promise.all([

        api.getRentals(),

        api.getMovements(),

      ]);

      setRentals(Array.isArray(rentalData) ? rentalData : []);

      setMovements(Array.isArray(movementData) ? movementData : []);

    } catch (error) {

      setErrorMsg(error.message || "대시보드 정보를 불러오지 못했습니다.");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadData();

  }, []);

  const stats = useMemo(() => {

    const activeContracts = rentals.filter(

      (rental) => rental.status === "ACTIVE"

    ).length;

    const requestedContracts = rentals.filter(

      (rental) => rental.status === "REQUESTED"

    ).length;

    const approvedContracts = rentals.filter(

      (rental) => rental.status === "APPROVED"

    ).length;

    const outMovements = movements.filter(

      (movement) => movement.movement_type === "OUT"

    ).length;

    const returnMovements = movements.filter(

      (movement) => movement.movement_type === "RETURN"

    ).length;

    const waitingMovements = movements.filter(

      (movement) => !String(movement.status || "").includes("COMPLETED")

    ).length;

    return {

      activeContracts,

      requestedContracts,

      approvedContracts,

      outMovements,

      returnMovements,

      waitingMovements,

    };

  }, [rentals, movements]);

  return (

    <div className="bg-slate-100">

      <section className="mb-7 border border-slate-300 bg-white">

        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h1 className="text-[2.125rem] font-semibold text-slate-900">

                사무실 총책임자 대시보드

              </h1>

              <p className="mt-2 text-[1.1875rem] font-normal text-slate-600">

                계약별 출고/반납 회차, 서명, 검수, 문서 발행 상태를 관리합니다.

              </p>

            </div>

            <div className="flex gap-3">

              <button

                type="button"

                onClick={() => navigate("/office-manager/approval")}

                className="border border-blue-900 bg-blue-900 px-6 py-3 text-[1.0625rem] font-medium text-white hover:bg-blue-950"

              >

                승인/서명 처리

              </button>

              <button

                type="button"

                onClick={() => navigate("/office-manager/reports")}

                className="border border-slate-400 bg-white px-6 py-3 text-[1.0625rem] font-medium text-slate-800 hover:bg-slate-100"

              >

                문서 관리

              </button>

            </div>

          </div>

        </div>

        <table className="w-full border-collapse">

          <tbody>

            <tr>

              <StatusCell

                title="진행 중 계약"

                value={`${stats.activeContracts}건`}

              />

              <StatusCell

                title="승인 대기 계약"

                value={`${stats.requestedContracts}건`}

                warning

              />

              <StatusCell

                title="승인 완료 계약"

                value={`${stats.approvedContracts}건`}

              />

              <StatusCell

                title="출고 회차"

                value={`${stats.outMovements}건`}

              />

              <StatusCell

                title="반납 회차"

                value={`${stats.returnMovements}건`}

              />

              <StatusCell

                title="처리 대기 회차"

                value={`${stats.waitingMovements}건`}

                warning

              />

            </tr>

          </tbody>

        </table>

      </section>

      {errorMsg && (

        <div className="mb-6 border border-red-300 bg-red-50 px-6 py-4 text-[1.125rem] text-red-700">

          {errorMsg}

        </div>

      )}
      <ContractTable

  loading={loading}

  rentals={rentals}

  onRowClick={(rental) =>

    navigate(`/office-manager/contracts/${rental.id}`)

  }

/>

      <div className="mt-7">

        <MovementList

          loading={loading}

          movements={movements}

          basePath="/office-manager"

        />

      </div>

    </div>

  );

}

function StatusCell({ title, value, warning }) {

  return (

    <td className="border-r border-slate-300 px-7 py-6 last:border-r-0">

      <span className="block text-[1.0625rem] font-normal text-slate-500">

        {title}

      </span>

      <strong

        className={`mt-2 block text-[2rem] font-semibold ${

          warning ? "text-amber-600" : "text-slate-900"

        }`}

      >

        {value}

      </strong>

    </td>

  );

}

function ContractTable({ loading, rentals, onRowClick }) {

  return (

    <section className="border border-slate-300 bg-white">

      <div className="border-b border-slate-300 bg-slate-50 px-7 py-4">

        <h2 className="text-[1.625rem] font-semibold text-slate-900">

          진행 중 계약 목록

        </h2>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full border-collapse">

          <thead>

            <tr>

              {["현장", "요청 회사", "제공 회사", "상태", "상세"].map(

                (header) => (

                  <th

                    key={header}

                    className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1.125rem] font-medium text-slate-700"

                  >

                    {header}

                  </th>

                )

              )}

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td

                  colSpan={6}

                  className="px-5 py-8 text-center text-[1.1875rem] text-slate-500"

                >

                  계약 정보를 불러오는 중입니다.

                </td>

              </tr>

            ) : rentals.length === 0 ? (

              <tr>

                <td

                  colSpan={6}

                  className="px-5 py-8 text-center text-[1.1875rem] text-slate-500"

                >

                  표시할 계약이 없습니다.

                </td>

              </tr>

            ) : (

              rentals.map((rental) => (

                <tr key={rental.id} className="hover:bg-blue-50">

                  <td className="border-b border-slate-200 px-5 py-5 text-[1.1875rem] font-medium text-blue-900">

                    #{rental.id}

                  </td>

                  <td className="border-b border-slate-200 px-5 py-5 text-[1.1875rem] text-slate-800">

                    {rental.site_name || rental.site || "-"}

                  </td>

                  <td className="border-b border-slate-200 px-5 py-5 text-[1.1875rem] text-slate-800">

                    {rental.requester_company_name ||

                      rental.requester_company ||

                      "-"}

                  </td>

                  <td className="border-b border-slate-200 px-5 py-5 text-[1.1875rem] text-slate-800">

                    {rental.provider_company_name ||

                      rental.provider_company ||

                      "-"}

                  </td>

                  <td className="border-b border-slate-200 px-5 py-5">

                    <span className="border border-blue-300 bg-blue-50 px-4 py-2 text-[1.0625rem] font-medium text-blue-800">

                      {RENTAL_STATUS_LABEL[rental.status] || rental.status}

                    </span>

                  </td>

                  <td className="border-b border-slate-200 px-5 py-5">

                    <button

                      type="button"

                      onClick={() => onRowClick(rental)}

                      className="border border-slate-400 bg-white px-5 py-3 text-[1.0625rem] font-medium text-slate-800 hover:bg-slate-100"

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