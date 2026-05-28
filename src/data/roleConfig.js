// src/data/roleConfig.js

import {
  FiBarChart2, FiPackage, FiUpload, FiMapPin, FiUsers,
  FiTruck, FiCamera, FiCheckSquare, FiFileText, FiSettings, FiRepeat,
} from "react-icons/fi";

import SuperDashboard from "../roles/superAdmin/SuperDashboard.jsx";
import CompanyManagement from "../roles/superAdmin/CompanyManagement.jsx";
import GlobalInventory from "../roles/superAdmin/GlobalInventory.jsx";
import UserManagement from "../roles/superAdmin/UserManagement.jsx";

import SiteWorkerHome from "../roles/siteWorker/SiteWorkerHome.jsx";
import PhotoCapture from "../roles/siteWorker/PhotoCapture.jsx";
import WorkerSubmitHistory from "../roles/siteWorker/WorkerSubmitHistory.jsx";

import SiteManagerDashboard from "../roles/siteManager/SiteManagerDashboard.jsx";
import SiteApproval from "../roles/siteManager/SiteApproval.jsx";
import SiteReports from "../roles/siteManager/SiteReports.jsx";
import SiteRoleAssignment from "../roles/siteManager/RoleAssignment.jsx";
import SiteCreate from "../roles/siteManager/SiteCreate.jsx";
import SiteReturnRequest from "../roles/siteManager/SiteReturnRequest.jsx";

import OfficeWorkerDashboard from "../roles/officeWorker/OfficeWorkerDashboard.jsx";
import RentalReturn from "../roles/officeWorker/RentalReturn.jsx";
import OfficeInventory from "../roles/officeWorker/OfficeInventory.jsx";
import EstimateContractUpload from "../roles/officeWorker/contracts/EstimateContractUpload.jsx";
import CreateOutMovement from "../roles/officeWorker/movements/CreateOutMovement.jsx";
import AiInspection from "../roles/officeWorker/inspection/AiInspection.jsx";

import OfficeManagerDashboard from "../roles/officeManager/OfficeManagerDashboard.jsx";
import OfficeRoleAssignment from "../roles/officeManager/RoleAssignment.jsx";
import FinalApproval from "../roles/officeManager/FinalApproval.jsx";
import ManagerReports from "../roles/officeManager/ManagerReports.jsx";
import MaterialCreate from "../roles/officeManager/MaterialCreate.jsx";
import ContractList from "../roles/officeManager/contracts/ContractList.jsx";
import ContractDetail from "../roles/officeManager/contracts/ContractDetail.jsx";

import SiteDetail from "../roles/common/SiteDetail.jsx";
import MovementDetail from "../roles/common/movement/MovementDetail.jsx";
import CreateReturnMovement from "../roles/common/CreateReturnMovement.jsx";

export const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin - GSS" },
  { value: "SITE_WORKER", label: "현장 직원" },
  { value: "SITE_MANAGER", label: "현장 총책임자" },
  { value: "OFFICE_WORKER", label: "사무실 직원" },
  { value: "OFFICE_MANAGER", label: "사무실 총책임자" },
];

export const ROLE_CONFIG = {
  SUPER_ADMIN: {
    label: "Super Admin - GSS",
    desc: "전체 회사, 현장, 사용자, 재고를 통합 관리합니다.",
    basePath: "/super",
    routes: [
      {
        path: "/super/dashboard",
        label: "전체 대시보드",
        icon: FiBarChart2,
        component: SuperDashboard,
        children: [
          { label: "통합 현황", path: "/super/dashboard" },
        ],
      },
      {
        path: "/super/companies",
        label: "회사/현장 관리",
        icon: FiSettings,
        component: CompanyManagement,
        children: [
          { label: "회사 목록", path: "/super/companies?tab=companies" },
          { label: "현장 목록", path: "/super/companies?tab=sites" },
        ],
      },
      {
        path: "/super/users",
        label: "전체 사용자 관리",
        icon: FiUsers,
        component: UserManagement,
        children: [
          { label: "전체 직원", path: "/super/users?tab=all" },
          { label: "승인 대기", path: "/super/users?tab=pending" },
          { label: "사무실 총책임자", path: "/super/users?tab=officeManager" },
          { label: "현장 총책임자", path: "/super/users?tab=siteManager" },
        ],
      },
      {
        path: "/super/inventory",
        label: "전체 재고 현황",
        icon: FiPackage,
        component: GlobalInventory,
        children: [
          { label: "전체 재고 현황", path: "/super/inventory" },
        ],
      },
    ],
  },

  SITE_WORKER: {
    label: "현장 직원",
    desc: "사진 촬영 및 AI 수량 확인 업무를 수행합니다.",
    basePath: "/site-worker",
    routes: [
      {
        path: "/site-worker/home",
        label: "오늘 작업",
        icon: FiMapPin,
        component: SiteWorkerHome,
        children: [
          { label: "수령 확인 대기", path: "/site-worker/home" },
          { label: "반납 처리 대기", path: "/site-worker/home" },
        ],
      },
      {
        path: "/site-worker/capture",
        label: "수령 확인 / AI 체크",
        icon: FiCamera,
        component: PhotoCapture,
        children: [
          { label: "수령 AI 수량 확인", path: "/site-worker/capture" },
        ],
      },
      {
        path: "/site-worker/history",
        label: "제출 내역",
        icon: FiFileText,
        component: WorkerSubmitHistory,
        children: [
          { label: "전체 제출", path: "/site-worker/history?tab=all" },
          { label: "출고 내역", path: "/site-worker/history?tab=OUT" },
          { label: "반납 내역", path: "/site-worker/history?tab=RETURN" },
        ],
      },
      {
        path: "/site-worker/movements/:movementId",
        label: "회차 상세",
        icon: FiRepeat,
        component: MovementDetail,
        hidden: true,
      },
    ],
  },

  SITE_MANAGER: {
    label: "현장 총책임자",
    desc: "현장 직원 승인, 수령/반납 서명을 관리합니다.",
    basePath: "/site-manager",
    routes: [
      {
        path: "/site-manager/dashboard",
        label: "현장 대시보드",
        icon: FiBarChart2,
        component: SiteManagerDashboard,
        children: [
          { label: "현장 현황", path: "/site-manager/dashboard" },
        ],
      },
      {
        path: "/site-manager/roles",
        label: "현장 직원 승인/배정",
        icon: FiUsers,
        component: SiteRoleAssignment,
        children: [
          { label: "승인 대기", path: "/site-manager/roles?tab=pending" },
          { label: "전체 직원", path: "/site-manager/roles?tab=all" },
        ],
      },
      {
        path: "/site-manager/approval",
        label: "서명 승인",
        icon: FiCheckSquare,
        component: SiteApproval,
        children: [
          { label: "수령 서명 대기", path: "/site-manager/approval?tab=receive" },
        ],
      },
      {
        path: "/site-manager/reports",
        label: "현장 보고서",
        icon: FiFileText,
        component: SiteReports,
        children: [
          { label: "전체 회차", path: "/site-manager/reports?tab=all" },
          { label: "출고 회차", path: "/site-manager/reports?tab=OUT" },
          { label: "반납 회차", path: "/site-manager/reports?tab=RETURN" },
        ],
      },
      {
        path: "/site-manager/return-request",
        label: "반납 신청",
        icon: FiRepeat,
        component: SiteReturnRequest,
        children: [
          { label: "반납 신청 제출", path: "/site-manager/return-request" },
        ],
      },
      {
        path: "/site-manager/site-create",
        label: "현장 등록",
        icon: FiMapPin,
        component: SiteCreate,
        children: [
          { label: "현장 등록", path: "/site-manager/site-create" },
        ],
      },
      {
        path: "/site-manager/movements/:movementId",
        label: "회차 상세",
        icon: FiRepeat,
        component: MovementDetail,
        hidden: true,
      },
    ],
  },

  OFFICE_WORKER: {
    label: "사무실 직원",
    desc: "계약 생성, 견적서 업로드, 출고 회차 생성 및 AI 재고 검수를 담당합니다.",
    basePath: "/office-worker",
    routes: [
      {
        path: "/office-worker/dashboard",
        label: "업무 대시보드",
        icon: FiBarChart2,
        component: OfficeWorkerDashboard,
        children: [
          { label: "업무 대시보드", path: "/office-worker/dashboard" },
        ],
      },
      {
        path: "/office-worker/estimate",
        label: "견적서 업로드",
        icon: FiUpload,
        component: EstimateContractUpload,
        children: [
          { label: "견적서 업로드", path: "/office-worker/estimate" },
        ],
      },
      {
        path: "/office-worker/rental",
        label: "계약/회차 처리",
        icon: FiTruck,
        component: RentalReturn,
        children: [
          { label: "계약 목록", path: "/office-worker/rental?tab=contracts" },
          { label: "출고 회차", path: "/office-worker/rental?tab=out" },
          { label: "반납 회차", path: "/office-worker/rental?tab=return" },
        ],
      },
      {
        path: "/office-worker/create-out",
        label: "출고 회차 생성",
        icon: FiTruck,
        component: CreateOutMovement,
        children: [
          { label: "출고 회차 생성", path: "/office-worker/create-out" },
        ],
      },
      {
        path: "/office-worker/inventory",
        label: "담당 재고관리",
        icon: FiPackage,
        component: OfficeInventory,
        children: [
          { label: "재고 현황", path: "/office-worker/inventory" },
        ],
      },
      {
        path: "/office-worker/ai-inspection",
        label: "AI 수량 검수",
        icon: FiCamera,
        component: AiInspection,
        children: [
          { label: "출고 전 AI 검수 (사무실)", path: "/office-worker/ai-inspection?step=out_office" },
          { label: "사무실 입고 검수 (반납)", path: "/office-worker/ai-inspection?step=return_office" },
        ],
      },
      {
        path: "/office-worker/sites/:siteId",
        label: "현장 상세",
        icon: FiMapPin,
        component: SiteDetail,
        hidden: true,
      },
      {
        path: "/office-worker/movements/:movementId",
        label: "회차 상세",
        icon: FiRepeat,
        component: MovementDetail,
        hidden: true,
      },
    ],
  },

  OFFICE_MANAGER: {
    label: "사무실 총책임자",
    desc: "계약 승인, 출고/반납 회차 생성 및 최종 검수를 관리합니다.",
    basePath: "/office-manager",
    routes: [
      {
        path: "/office-manager/dashboard",
        label: "총책임자 대시보드",
        icon: FiBarChart2,
        component: OfficeManagerDashboard,
        children: [
          { label: "총책임자 대시보드", path: "/office-manager/dashboard" },
        ],
      },
      {
        path: "/office-manager/contracts",
        label: "계약 관리",
        icon: FiFileText,
        component: ContractList,
        children: [
          { label: "전체 계약", path: "/office-manager/contracts?tab=all" },
          { label: "승인 대기 계약", path: "/office-manager/contracts?tab=REQUESTED" },
          { label: "진행 중 계약", path: "/office-manager/contracts?tab=ACTIVE" },
          { label: "종료된 계약", path: "/office-manager/contracts?tab=CLOSED" },
        ],
      },
      {
        path: "/office-manager/create-return",
        label: "반납 회차 생성",
        icon: FiRepeat,
        component: CreateReturnMovement,
        children: [
          { label: "반납 회차 생성", path: "/office-manager/create-return" },
        ],
      },
      {
        path: "/office-manager/roles",
        label: "직원 승인/배정",
        icon: FiUsers,
        component: OfficeRoleAssignment,
        children: [
          { label: "승인 대기", path: "/office-manager/roles?tab=pending" },
          { label: "전체 직원", path: "/office-manager/roles?tab=all" },
        ],
      },
      {
        path: "/office-manager/approval",
        label: "회차 서명",
        icon: FiCheckSquare,
        component: FinalApproval,
        children: [
          { label: "출고 확정 서명", path: "/office-manager/approval?tab=out" },
          { label: "입고 검수 / 거래 완료", path: "/office-manager/approval?tab=in" },
        ],
      },
      {
        path: "/office-manager/reports",
        label: "문서 관리",
        icon: FiFileText,
        component: ManagerReports,
        children: [
          { label: "반출증", path: "/office-manager/reports?tab=dispatch" },
          { label: "출고송장", path: "/office-manager/reports?tab=invoice" },
          { label: "입고검수확인서", path: "/office-manager/reports?tab=returnConfirm" },
        ],
      },
      {
        path: "/office-manager/materials/create",
        label: "자재 등록",
        icon: FiPackage,
        component: MaterialCreate,
        children: [
          { label: "자재 등록", path: "/office-manager/materials/create" },
        ],
      },
      {
        path: "/office-manager/ai-inspection",
        label: "AI 수량 검수",
        icon: FiCamera,
        component: AiInspection,
        children: [
          { label: "출고 전 AI 검수 (사무실)", path: "/office-manager/ai-inspection?step=out_office" },
          { label: "사무실 입고 검수 (반납)", path: "/office-manager/ai-inspection?step=return_office" },
        ],
      },
      {
        path: "/office-manager/contracts/:rentalId",
        label: "계약 상세",
        icon: FiFileText,
        component: ContractDetail,
        hidden: true,
      },
      {
        path: "/office-manager/movements/:movementId",
        label: "회차 상세",
        icon: FiRepeat,
        component: MovementDetail,
        hidden: true,
      },
      {
        path: "/office-manager/sites/:siteId",
        label: "현장 상세",
        icon: FiMapPin,
        component: SiteDetail,
        hidden: true,
      },
    ],
  },
};