const USE_MOCK = false;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL;

export const ROLE_MAP = {
  superAdmin: "SUPER_ADMIN",
  superadmin: "SUPER_ADMIN",
  super_admin: "SUPER_ADMIN",
  officeManager: "OFFICE_MANAGER",
  officeWorker: "OFFICE_WORKER",
  siteManager: "SITE_MANAGER",
  siteWorker: "SITE_WORKER",
};

export const BACKEND_ROLE_OPTIONS = [
  { value: "siteWorker", label: "현장 직원" },
  { value: "siteManager", label: "현장 총책임자" },
  { value: "officeWorker", label: "사무실 직원" },
  { value: "officeManager", label: "사무실 총책임자" },
];

export function saveLoginUser(user) {
  localStorage.setItem("gss_user", JSON.stringify(user));
}

export function getLoginUser() {
  const raw = localStorage.getItem("gss_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("gss_user");
}

function normalizeErrorMessage(data, status) {
  if (status === 404) return `API 주소를 찾을 수 없습니다. (${status})`;
  if (status >= 500) return `서버 내부 오류가 발생했습니다. (${status})`;
  if (typeof data === "string") return data;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  return `요청 처리 중 오류가 발생했습니다. (${status})`;
}

async function request(path, options = {}) {
  if (USE_MOCK) return mockRequest(path, options);

  const user = getLoginUser();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(user?.user_id ? { "X-USER-ID": user.user_id } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    console.error("API ERROR:", { status: response.status, path, data });
    throw new Error(normalizeErrorMessage(data, response.status));
  }

  return data;
}

async function aiRequest(path, options = {}) {
  if (USE_MOCK) return { detected_qty: 42 };

  const response = await fetch(`${AI_BASE_URL}${path}`, options);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) throw new Error(normalizeErrorMessage(data, response.status));
  return data;
}

function downloadFile(path) {
  if (USE_MOCK) {
    const blob = new Blob(["MOCK FILE"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return Promise.resolve(blob);
  }

  const user = getLoginUser();
  return fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { ...(user?.user_id ? { "X-USER-ID": user.user_id } : {}) },
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 404) throw new Error(`파일 다운로드 API 주소를 찾을 수 없습니다. (${response.status})`);
      if (response.status >= 500) throw new Error(`파일 다운로드 중 서버 오류가 발생했습니다. (${response.status})`);
      throw new Error(text || "파일 다운로드에 실패했습니다.");
    }
    return response.blob();
  });
}

export const api = {
  // ─── 인증 ───
  login: ({ email, password }) =>
    request("/login/", { method: "POST", body: JSON.stringify({ email, password }) }),

  signup: (form) =>
    request("/users/", { method: "POST", body: JSON.stringify(form) }),

  checkEmail: (email) =>
    request("/users/check-email/", { method: "POST", body: JSON.stringify({ email }) }),

  // ─── 유저 ───
  getUsers: () => request("/users/"),

  approveUser: (userId) =>
    request(`/users/${userId}/approve/`, { method: "POST" }),

  changeUserRole: (userId, role) =>
    request(`/users/${userId}/change-role/`, { method: "PATCH", body: JSON.stringify({ role }) }),

  assignSite: (userId, siteId) =>
    request(`/users/${userId}/assign-site/`, { method: "PATCH", body: JSON.stringify({ site_id: siteId }) }),

  updateMyInfo: (userId, form) =>
    request(`/users/${userId}/update-info/`, { method: "PATCH", body: JSON.stringify(form) }),

  // ─── 회사/현장 ───
  getCompanies: () => request("/companies/"),

  createCompany: (form) =>
    request("/companies/", { method: "POST", body: JSON.stringify(form) }),

  getSites: (companyId) => {
    const query = companyId ? `?company_id=${companyId}` : "";
    return request(`/sites/${query}`);
  },

  createSite: (form) =>
    request("/sites/", { method: "POST", body: JSON.stringify(form) }),

  // ─── 자재 ───
  getMaterials: () => request("/materials/"),

  createMaterial: (form) => {
    const body = form instanceof FormData ? form : (() => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      return fd;
    })();
    return request("/materials/", { method: "POST", body });
  },

  updateMaterial: (materialId, form) =>
    request(`/materials/${materialId}/update-info/`, { method: "PATCH", body: JSON.stringify(form) }),

  // ─── 계약 ───
  getRentals: () => request("/rentals/"),

  getRental: (rentalId) => request(`/rentals/${rentalId}/`),

  createRental: (formData) =>
    request("/rentals/", { method: "POST", body: formData }),

  confirmRentalDetails: (rentalId, body) =>
    request(`/rentals/${rentalId}/confirm-details/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  approveRental: (rentalId) =>
    request(`/rentals/${rentalId}/approve/`, { method: "POST" }),

  // ─── RentalDetail ───
  getRentalDetails: () => request("/rental-details/"),

  getRentalDetailsByRental: (rentalId) =>
    request(`/rental-details/?rental=${rentalId}`),

  // ─── Movement ───
  getMovements: () => request("/movements/"),

  getMovement: (movementId) => request(`/movements/${movementId}/`),

  createOutMovement: (formData) =>
    request("/movements/create-out/", { method: "POST", body: formData }),

  createReturnMovement: (formData) =>
    request("/movements/create-return/", { method: "POST", body: formData }),

  // ─── 반납 신청 ───
  getReturnRequests: () => request("/return-requests/"),

  createReturnRequest: (formData) =>
    request("/return-requests/", { method: "POST", body: formData }),

  officeOutSign: (movementId, formData) =>
    request(`/movements/${movementId}/office-out-sign/`, { method: "POST", body: formData }),

  siteReceiveSign: (movementId, formData) =>
    request(`/movements/${movementId}/site-receive-sign/`, { method: "POST", body: formData }),

  siteReturnSign: (movementId, formData) =>
    request(`/movements/${movementId}/site-return-sign/`, { method: "POST", body: formData }),

  officeInSign: (movementId, formData) =>
    request(`/movements/${movementId}/office-in-sign/`, { method: "POST", body: formData }),

  // ─── 문서 다운로드 ───
  downloadMovementDispatch: (movementId) =>
    downloadFile(`/movements/${movementId}/download-dispatch/`),

  downloadMovementInvoice: (movementId) =>
    downloadFile(`/movements/${movementId}/download-invoice/`),

  downloadMovementReturnConfirm: (movementId) =>
    downloadFile(`/movements/${movementId}/download-return-confirm/`),

  // ─── AI ───
  detect: (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return request("/detect/", { method: "POST", body: formData });
  },

  detectDirect: (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return aiRequest("/detect", { method: "POST", body: formData });
  },

  // ★ FormData로 보내되 image + movement_detail + detected_qty 모두 포함
  createAIRecognition: ({ movementDetailId, detectedQty, imageFile }) => {
    const formData = new FormData();

    // movement_detail — 선택값이지만 있으면 포함
    if (
      movementDetailId !== undefined &&
      movementDetailId !== null &&
      movementDetailId !== ""
    ) {
      formData.append("movement_detail", String(Number(movementDetailId)));
    }

    // detected_qty — 필수
    formData.append("detected_qty", String(Number(detectedQty)));

    // image — 필수 (백엔드 serializer가 요구함)
    if (imageFile) {
      formData.append("image", imageFile);
    }

    return request("/ai-recognitions/", { method: "POST", body: formData });
  },
};

export const aiApi = {
  detect: api.detect,
  detectDirect: api.detectDirect,
};

async function mockRequest(path, options = {}) {
  console.log("[MOCK API]", path, options);
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (path === "/users/check-email/") return { is_duplicate: false };
  if (path === "/detect/") return { num_detections: 42, boxes: [] };
  if (path === "/ai-recognitions/") return { id: 1, detected_qty: 42, movement_detail: null };
  if (path.includes("confirm-details")) return { message: "견적 확정 완료. 승인 대기 중입니다." };

  return { message: "mock success" };
}