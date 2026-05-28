import { useNavigate } from "react-router-dom";

export default function Home() {

  const navigate = useNavigate();

  return (

    <div className="min-h-screen bg-slate-100 text-slate-900">

      <header className="border-b border-slate-300 bg-white">

        <div className="mx-auto flex h-[5.125rem] max-w-[80rem] items-center justify-between px-8">

          <div>

            <div className="text-[1.875rem] font-semibold text-blue-900">GSS</div>

            <div className="text-[0.9375rem] text-slate-500">비계 자재 통합관리 시스템</div>

          </div>

          <nav className="hidden items-center gap-8 text-[1.125rem] text-slate-700 md:flex">

            <a href="#features">주요 기능</a>

            <a href="#roles">권한별 기능</a>

            <a href="#process">업무 흐름</a>

          </nav>

          <button

            type="button"

            onClick={() => navigate("/login")}

            className="border border-blue-900 bg-blue-900 px-6 py-3 text-[1.125rem] font-medium text-white"

          >

            로그인

          </button>

        </div>

      </header>

      <main>

        <section className="border-b border-slate-300 bg-white">

          <div className="mx-auto grid max-w-[80rem] grid-cols-[1.1fr_0.9fr] gap-10 px-8 py-20 max-lg:grid-cols-1">

            <div>

              <p className="mb-5 inline-block border border-blue-300 bg-blue-50 px-4 py-2 text-[1.125rem] text-blue-900">

                AI 기반 비계 출고 · 반납 · LOSS 관리

              </p>

              <h1 className="text-[3.25rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">

                비계 자재의 출고, 반납, 손실 현황을

                <br />

                하나의 시스템에서 관리합니다.

              </h1>

              <p className="mt-6 max-w-[47.5rem] text-[1.375rem] leading-relaxed text-slate-600">

                현장 사진 촬영과 AI 수량 인식을 기반으로 비계 파이프, 발판,

                부품의 수량을 확인하고 승인, 서명, 보고서까지 연결하는 업무용

                관리 시스템입니다.

              </p>

              <div className="mt-10 flex flex-wrap gap-3">

                <button

                  type="button"

                  onClick={() => navigate("/login")}

                  className="border border-blue-900 bg-blue-900 px-8 py-4 text-[1.25rem] font-medium text-white"

                >

                  시스템 로그인

                </button>

                <a

                  href="#process"

                  className="border border-slate-400 bg-white px-8 py-4 text-[1.25rem] font-medium text-slate-800"

                >

                  업무 흐름 보기

                </a>

              </div>

            </div>

            <div className="border border-slate-300 bg-slate-50 p-6">

              <div className="border border-slate-300 bg-white">

                <div className="border-b border-slate-300 bg-slate-100 px-5 py-4">

                  <h2 className="text-[1.5rem] font-semibold">운영 현황판 예시</h2>

                </div>

                <table className="w-full border-collapse">

                  <tbody>

                    <InfoRow title="전체 재고" value="52,940개" />

                    <InfoRow title="임대 중" value="18,420개" />

                    <InfoRow title="승인 대기" value="11건" />

                    <InfoRow title="누적 LOSS" value="926개" danger />

                  </tbody>

                </table>

              </div>

              <div className="mt-5 border border-slate-300 bg-white p-5">

                <div className="mb-4 text-[1.3125rem] font-semibold">최근 처리 현황</div>

                {[

                  ["강남 푸르지오 3차", "반납 검수중"],

                  ["은평 래미안 2차", "서명 대기"],

                  ["마포 자이 현장", "출고 승인 완료"],

                ].map(([site, status]) => (

                  <div

                    key={site}

                    className="flex justify-between border-t border-slate-200 py-4 text-[1.125rem]"

                  >

                    <span>{site}</span>

                    <span className="font-medium text-blue-900">{status}</span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </section>

        <section id="features" className="mx-auto max-w-[80rem] px-8 py-16">

          <h2 className="mb-8 text-[2.25rem] font-semibold">주요 기능</h2>

          <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">

            <Feature title="AI 수량 인식" desc="사진 업로드 후 파이프 구멍 기준으로 수량을 자동 확인합니다." />

            <Feature title="출고/반납 관리" desc="출고 전, 반납 전, 입고 후 단계별 촬영과 기록을 남깁니다." />

            <Feature title="서명 승인" desc="현장 총책임자와 사무실 총책임자의 서명 승인 흐름을 관리합니다." />

            <Feature title="LOSS 추적" desc="분실, 파손, 수리, 폐기 수량을 기간별로 확인합니다." />

          </div>

        </section>

        <section id="roles" className="border-y border-slate-300 bg-white">

          <div className="mx-auto max-w-[80rem] px-8 py-16">

            <h2 className="mb-8 text-[2.25rem] font-semibold">권한별 업무 화면</h2>

            <div className="overflow-x-auto border border-slate-300">

              <table className="w-full border-collapse">

                <thead>

                  <tr>

                    {["권한", "주요 업무", "화면 구성"].map((header) => (

                      <th

                        key={header}

                        className="border-b border-slate-300 bg-slate-100 px-6 py-5 text-left text-[1.1875rem] font-medium text-slate-700"

                      >

                        {header}

                      </th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  <RoleRow role="현장 직원" work="사진 촬영, AI 수량 확인, 제출" page="오늘 작업, 사진 촬영, 제출 내역" />

                  <RoleRow role="현장 총책임자" work="현장 제출 내역 검토 및 서명 승인" page="현장 대시보드, 서명 승인, 보고서" />

                  <RoleRow role="사무실 직원" work="견적서 업로드, 임대/반납 처리, 담당 재고관리" page="업무 대시보드, 견적서, 재고관리" />

                  <RoleRow role="사무실 총책임자" work="직원 권한 배정, 최종 승인, 전체 보고서" page="총책임자 대시보드, 권한 배정, 최종 승인" />

                  <RoleRow role="Super Admin" work="회사, 현장, 사용자, 전체 재고 통합 관리" page="전체 대시보드, 회사/현장 관리, 전체 재고" />

                </tbody>

              </table>

            </div>

          </div>

        </section>

        <section id="process" className="mx-auto max-w-[80rem] px-8 py-16">

          <h2 className="mb-8 text-[2.25rem] font-semibold">업무 흐름</h2>

          <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">

            {[

              ["1", "견적서 업로드", "임대 자재와 예정 수량을 전산 등록"],

              ["2", "출고 전 촬영", "사무실에서 현장으로 보내기 전 사진 기록"],

              ["3", "현장 반납 전 촬영", "사용 후 현장에서 반납 전 수량 확인"],

              ["4", "사무실 입고 검수", "최종 입고 수량과 LOSS 확인"],

              ["5", "보고서 저장", "사진, 수량, 서명 이력을 보고서로 보관"],

            ].map(([num, title, desc]) => (

              <div key={num} className="border border-slate-300 bg-white p-6">

                <div className="mb-5 flex h-11 w-11 items-center justify-center bg-blue-900 text-[1.25rem] font-semibold text-white">

                  {num}

                </div>

                <h3 className="text-[1.4375rem] font-semibold">{title}</h3>

                <p className="mt-3 text-[1.125rem] leading-relaxed text-slate-600">{desc}</p>

              </div>

            ))}

          </div>

        </section>

      </main>

      <footer className="border-t border-slate-300 bg-white px-8 py-8">

        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 text-[1.0625rem] text-slate-500">

          <span>GSS 비계 통합관리 시스템</span>

          <span>AI 기반 출고 · 반납 · 재고 · 보고서 관리</span>

        </div>

      </footer>

    </div>

  );

}

function InfoRow({ title, value, danger }) {

  return (

    <tr>

      <th className="w-[45%] border-b border-r border-slate-300 bg-slate-50 px-5 py-5 text-left text-[1.125rem] font-medium text-slate-700">

        {title}

      </th>

      <td

        className={`border-b border-slate-300 px-5 py-5 text-[1.5rem] font-semibold ${

          danger ? "text-red-600" : "text-slate-900"

        }`}

      >

        {value}

      </td>

    </tr>

  );

}

function Feature({ title, desc }) {

  return (

    <div className="border border-slate-300 bg-white p-6">

      <h3 className="text-[1.5rem] font-semibold text-slate-900">{title}</h3>

      <p className="mt-4 text-[1.125rem] leading-relaxed text-slate-600">{desc}</p>

    </div>

  );

}

function RoleRow({ role, work, page }) {

  return (

    <tr className="hover:bg-slate-50">

      <td className="border-b border-slate-200 px-6 py-5 text-[1.1875rem] font-medium text-slate-900">

        {role}

      </td>

      <td className="border-b border-slate-200 px-6 py-5 text-[1.1875rem] text-slate-700">

        {work}

      </td>

      <td className="border-b border-slate-200 px-6 py-5 text-[1.1875rem] text-slate-700">

        {page}

      </td>

    </tr>

  );

}