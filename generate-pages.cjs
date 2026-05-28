const fs = require("fs");

const path = require("path");

const pages = [

  ["src/roles/officeManager/contracts/ContractList.jsx", "계약 목록", "전체 Rental 계약을 조회하고 승인 상태를 확인합니다."],

  ["src/roles/officeManager/contracts/ContractDetail.jsx", "계약 상세", "계약 기본 정보, 계약 자재, 출고/반납 회차를 확인합니다."],

  ["src/roles/officeManager/contracts/ContractMaterialSummary.jsx", "계약 자재 총괄", "계약별 자재 수량, 누적 출고, 반납, LOSS를 집계합니다."],

  ["src/roles/officeManager/movements/OutMovementList.jsx", "출고 회차 목록", "OUT Movement 목록을 조회하고 출고 처리 상태를 확인합니다."],

  ["src/roles/officeManager/movements/ReturnMovementList.jsx", "반납 회차 목록", "RETURN Movement 목록을 조회하고 반납 처리 상태를 확인합니다."],

  ["src/roles/officeManager/movements/PendingMovementList.jsx", "처리 대기 회차", "서명 또는 검수가 필요한 회차를 확인합니다."],

  ["src/roles/officeManager/documents/DispatchDocumentList.jsx", "반출증 관리", "출고 회차별 반출증을 다운로드합니다."],

  ["src/roles/officeManager/documents/InvoiceDocumentList.jsx", "출고송장 관리", "출고 회차별 출고송장을 다운로드합니다."],

  ["src/roles/officeManager/documents/ReturnConfirmDocumentList.jsx", "입고검수확인서 관리", "반납 회차별 입고검수확인서를 다운로드합니다."],

  ["src/roles/officeManager/materials/MaterialList.jsx", "자재 목록", "등록된 자재를 검색하고 상세 정보를 확인합니다."],

  ["src/roles/officeManager/materials/MaterialLossManagement.jsx", "수량/LOSS 관리", "자재별 전체 수량, LOSS, 수리, 폐기 수량을 관리합니다."],

  ["src/roles/officeManager/users/OfficeWorkerApproval.jsx", "사무실 직원 승인", "사무실 직원 가입 승인 상태를 관리합니다."],

  ["src/roles/officeManager/users/OfficeWorkerSiteAssign.jsx", "관리 현장 배정", "사무실 직원을 관리 현장에 배정합니다."],

  ["src/roles/officeWorker/contracts/EstimateContractUpload.jsx", "비계견적서 업로드", "견적서를 업로드하여 Rental 계약을 생성합니다."],

  ["src/roles/officeWorker/contracts/WorkerContractList.jsx", "계약 목록", "사무실 직원이 담당하는 계약 목록을 확인합니다."],

  ["src/roles/officeWorker/contracts/WorkerContractMaterials.jsx", "계약 자재 확인", "계약에 포함된 자재와 수량을 확인합니다."],

  ["src/roles/officeWorker/movements/CreateOutMovement.jsx", "출고 회차 생성", "계약 기준으로 OUT Movement를 생성합니다."],

  ["src/roles/officeWorker/movements/CreateReturnMovement.jsx", "반납 회차 생성", "계약 기준으로 RETURN Movement를 생성합니다."],

  ["src/roles/officeWorker/movements/WorkerOutMovementList.jsx", "출고 회차 목록", "출고 회차와 처리 상태를 확인합니다."],

  ["src/roles/officeWorker/movements/WorkerReturnMovementList.jsx", "반납 회차 목록", "반납 회차와 처리 상태를 확인합니다."],

  ["src/roles/officeWorker/inspection/AiInspection.jsx", "AI 수량 판독", "반납 입고 검수 단계에서 AI로 수량을 판독합니다."],

  ["src/roles/officeWorker/inspection/InspectionCompleteList.jsx", "검수 완료 내역", "입고 검수가 완료된 반납 회차를 확인합니다."],

  ["src/roles/officeWorker/documents/WorkerDocumentList.jsx", "문서 다운로드", "반출증, 출고송장, 입고검수확인서를 다운로드합니다."],

  ["src/roles/siteManager/users/SiteWorkerApproval.jsx", "현장 직원 승인", "현장 직원 가입 승인을 처리합니다."],

  ["src/roles/siteManager/users/SiteWorkerAssign.jsx", "현장 직원 배정", "현장 직원을 현장에 배정합니다."],

  ["src/roles/siteManager/movements/SiteReceiveApproval.jsx", "현장 수령 승인", "현장 수령 사진, 수량, 서명을 확인합니다."],

  ["src/roles/siteManager/movements/SiteReturnApproval.jsx", "현장 반납 승인", "현장 반납 사진, 수량, 서명을 확인합니다."],

  ["src/roles/siteManager/movements/SiteMovementList.jsx", "현장 회차 목록", "현장 관련 출고/반납 회차를 조회합니다."],

  ["src/roles/siteManager/reports/SiteReceiveReport.jsx", "수령 완료 내역", "현장 수령 완료 기록을 확인합니다."],

  ["src/roles/siteManager/reports/SiteReturnReport.jsx", "반납 완료 내역", "현장 반납 완료 기록을 확인합니다."],

  ["src/roles/siteManager/reports/SiteLossReport.jsx", "현장 LOSS 보고서", "현장 차이 수량과 LOSS 내역을 확인합니다."],

  ["src/roles/siteWorker/tasks/TodayTaskList.jsx", "오늘 작업", "현장 직원의 오늘 수령/반납 작업을 확인합니다."],

  ["src/roles/siteWorker/receive/ReceivePhotoUpload.jsx", "수령 사진 업로드", "현장 수령 사진과 수량을 제출합니다."],

  ["src/roles/siteWorker/receive/ReceiveSubmitHistory.jsx", "수령 제출 내역", "수령 제출 기록을 확인합니다."],

  ["src/roles/siteWorker/return/ReturnPhotoUpload.jsx", "반납 사진 업로드", "현장 반납 사진과 수량을 제출합니다."],

  ["src/roles/siteWorker/return/ReturnSubmitHistory.jsx", "반납 제출 내역", "반납 제출 기록을 확인합니다."],

];

function componentName(filePath) {

  return path.basename(filePath, ".jsx");

}

function getCode(name, title, description) {

  return `import PageTemplate from "../../../components/common/PageTemplate.jsx";

export default function ${name}() {

  return (

    <PageTemplate

      title="${title}"

      description="${description}"

    />

  );

}

`;

}

fs.mkdirSync("src/components/common", { recursive: true });

fs.writeFileSync(

  "src/components/common/PageTemplate.jsx",

  `export default function PageTemplate({ title, description = "" }) {

  return (

    <div className="min-h-full bg-slate-100 p-6">

      <section className="border border-slate-300 bg-white">

        <div className="border-b border-slate-300 bg-slate-50 px-8 py-6">

          <h1 className="text-[34px] font-semibold text-slate-900">

            {title}

          </h1>

          {description && (

            <p className="mt-2 text-[18px] text-slate-600">

              {description}

            </p>

          )}

        </div>

        <div className="px-8 py-10">

          <div className="border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

            <p className="text-[20px] font-medium text-slate-700">

              {title}

            </p>

            <p className="mt-2 text-[16px] text-slate-500">

              이 페이지의 상세 기능은 이후 API 연동에 맞춰 구현됩니다.

            </p>

          </div>

        </div>

      </section>

    </div>

  );

}

`

);

for (const [file, title, description] of pages) {

  fs.mkdirSync(path.dirname(file), { recursive: true });

  fs.writeFileSync(file, getCode(componentName(file), title, description));

}

console.log("상세 페이지 기본 코드 생성 완료");