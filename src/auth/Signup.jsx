import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { api } from "../api/api.js";

/* ───────────────────────────────────────────
   비밀번호 규칙 정의
─────────────────────────────────────────── */
const PW_RULES = [
  {
    id: "length",
    label: "8자 이상",
    test: (v) => v.length >= 8,
  },
  {
    id: "upper",
    label: "대문자 포함 (A–Z)",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "소문자 포함 (a–z)",
    test: (v) => /[a-z]/.test(v),
  },
  {
    id: "number",
    label: "숫자 포함 (0–9)",
    test: (v) => /[0-9]/.test(v),
  },
  {
    id: "special",
    label: "특수문자 포함 (!@#$% 등)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function validatePassword(pw) {
  return PW_RULES.every((r) => r.test(pw));
}

/* ───────────────────────────────────────────
   메인 컴포넌트
─────────────────────────────────────────── */
export default function Signup() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [form, setForm] = useState({
    company: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  // 비밀번호 필드 포커스 여부 (규칙 힌트 표시 조건)
  const [pwFocused, setPwFocused] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // 이메일 중복 확인 상태
  // null: 미확인 | "checking": 확인 중 | "available": 사용 가능 | "duplicate": 중복
  const [emailCheckStatus, setEmailCheckStatus] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setPageLoading(true);
        setErrorMsg("");
        const companyData = await api.getCompanies();
        setCompanies(companyData);
        if (companyData.length > 0) {
          setForm((prev) => ({ ...prev, company: String(companyData[0].id) }));
        }
      } catch (error) {
        setErrorMsg(error.message || "회사 목록을 불러오지 못했습니다.");
      } finally {
        setPageLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // 이메일 값이 바뀌면 중복 확인 상태 초기화
    if (name === "email") {
      setEmailCheckStatus(null);
    }
  };

  const handleCheckEmail = async () => {
    if (!form.email.trim()) {
      setErrorMsg("이메일을 입력해주세요.");
      return;
    }
    setErrorMsg("");
    setEmailChecking(true);
    setEmailCheckStatus(null);
    try {
      const data = await api.checkEmail(form.email.trim());
      setEmailCheckStatus(data.is_duplicate ? "duplicate" : "available");
    } catch (error) {
      setErrorMsg(error.message || "중복 확인 중 오류가 발생했습니다.");
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.company) return setErrorMsg("소속 회사를 선택해주세요.");
    if (!form.name.trim()) return setErrorMsg("이름을 입력해주세요.");
    if (!form.phone.trim()) return setErrorMsg("전화번호를 입력해주세요.");
    if (!form.email.trim()) return setErrorMsg("이메일을 입력해주세요.");
    if (emailCheckStatus !== "available")
      return setErrorMsg("이메일 중복 확인을 완료해주세요.");
    if (!validatePassword(form.password))
      return setErrorMsg("비밀번호가 설정 규칙을 충족하지 않습니다.");
    if (form.password !== form.passwordConfirm)
      return setErrorMsg("비밀번호가 일치하지 않습니다.");

    setLoading(true);
    try {
      await api.signup({
        company: Number(form.company),
        site: null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      alert("회원가입 요청이 완료되었습니다. 관리자 승인 및 배정 후 로그인할 수 있습니다.");
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMsg(error.message || "회원가입 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /* ── 파생 상태 ── */
  const pwRuleResults = PW_RULES.map((r) => ({ ...r, ok: r.test(form.password) }));
  const pwAllPassed = pwRuleResults.every((r) => r.ok);
  const pwMismatch =
    confirmTouched &&
    form.passwordConfirm.length > 0 &&
    form.password !== form.passwordConfirm;
  const pwMatch =
    confirmTouched &&
    form.passwordConfirm.length > 0 &&
    form.password === form.passwordConfirm;

  /* ── 비밀번호 강도 계산 ── */
  const passedCount = pwRuleResults.filter((r) => r.ok).length;
  const strengthLabel =
    passedCount <= 1 ? "매우 약함" :
    passedCount === 2 ? "약함" :
    passedCount === 3 ? "보통" :
    passedCount === 4 ? "강함" : "매우 강함";
  const strengthColor =
    passedCount <= 1 ? "bg-red-500" :
    passedCount === 2 ? "bg-orange-400" :
    passedCount === 3 ? "bg-yellow-400" :
    passedCount === 4 ? "bg-blue-500" : "bg-green-600";

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[75rem] grid-cols-[1fr_32.5rem] overflow-hidden border border-slate-300 bg-white max-lg:grid-cols-1">

        {/* 좌측 소개 */}
        <section className="flex flex-col justify-between border-r border-slate-300 bg-slate-50 p-12 max-lg:hidden">
          <div>
            <div className="text-[2.25rem] font-black tracking-tight text-blue-900">GSS</div>
            <div className="mt-1 text-[1.125rem] font-semibold text-slate-500">비계 통합관리 시스템</div>
            <h2 className="mt-16 text-[2.75rem] font-black leading-tight tracking-[-0.04em] text-slate-900">
              계정 생성 후<br />관리자 승인을 기다려주세요
            </h2>
            <p className="mt-6 max-w-[35rem] text-[1.25rem] leading-relaxed text-slate-600">
              가입 시에는 소속 회사만 선택하며, 현장과 권한은 가입 이후 관리자에게 배정됩니다.
            </p>
          </div>
        </section>

        {/* 우측 폼 */}
        <section className="flex items-center justify-center p-12 max-sm:p-7">
          <form className="w-full max-w-[27.5rem]" onSubmit={handleSignup}>
            <div className="mb-8 flex h-14 w-14 items-center justify-center border border-blue-200 bg-blue-50 text-blue-900">
              <FiShield size={26} />
            </div>

            <h1 className="text-[2.375rem] font-black tracking-[-0.04em] text-slate-900">회원가입</h1>
            <p className="mt-3 text-[1.125rem] leading-relaxed text-slate-500">
              소속 회사를 선택하고 계정 생성을 요청하세요.
            </p>

            {errorMsg && (
              <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-[1rem] font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {/* 소속 회사 */}
            <FormGroup label="소속 회사 선택" htmlFor="company">
              <div className="flex h-14 items-center border border-slate-300 bg-white px-4 focus-within:border-blue-900">
                <FiBriefcase className="mr-3 text-slate-400" size={21} />
                <select
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  disabled={pageLoading}
                  className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none"
                >
                  {pageLoading ? (
                    <option value="">회사 목록 불러오는 중...</option>
                  ) : companies.length === 0 ? (
                    <option value="">등록된 회사 없음</option>
                  ) : (
                    companies.map((company) => (
                      <option key={company.id} value={String(company.id)}>
                        {company.company_name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </FormGroup>

            {/* 이름 */}
            <FormGroup label="이름" htmlFor="name">
              <InputWithIcon
                id="name" name="name"
                icon={<FiUser size={21} />}
                placeholder="이름 입력"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </FormGroup>

            {/* 전화번호 */}
            <FormGroup label="전화번호" htmlFor="phone">
              <InputWithIcon
                id="phone" name="phone"
                icon={<FiPhone size={21} />}
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </FormGroup>

            {/* 이메일 + 중복확인 */}
            <FormGroup label="이메일" htmlFor="email">
              <div className="flex gap-2">
                {/* 입력 필드 */}
                <div
                  className={`flex h-14 flex-1 items-center border bg-white px-4 focus-within:border-blue-900 ${
                    emailCheckStatus === "duplicate"
                      ? "border-red-400"
                      : emailCheckStatus === "available"
                      ? "border-green-600"
                      : "border-slate-300"
                  }`}
                >
                  <span className="mr-3 text-slate-400"><FiMail size={21} /></span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"
                  />
                  {/* 상태 아이콘 */}
                  {emailCheckStatus === "available" && (
                    <FiCheck size={18} className="ml-2 flex-shrink-0 text-green-600" />
                  )}
                  {emailCheckStatus === "duplicate" && (
                    <FiX size={18} className="ml-2 flex-shrink-0 text-red-500" />
                  )}
                </div>

                {/* 중복확인 버튼 */}
                <button
                  type="button"
                  onClick={handleCheckEmail}
                  disabled={emailChecking || !form.email.trim()}
                  className="h-14 flex-shrink-0 border border-blue-900 px-4 text-[0.9375rem] font-bold text-blue-900 hover:bg-blue-50 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {emailChecking ? "확인 중..." : "중복확인"}
                </button>
              </div>

              {/* 중복 확인 결과 메시지 */}
              {emailCheckStatus === "available" && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-green-600">
                  <FiCheck size={14} />
                  사용 가능한 이메일입니다.
                </p>
              )}
              {emailCheckStatus === "duplicate" && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-red-600">
                  <FiX size={14} />
                  이미 사용 중인 이메일입니다.
                </p>
              )}
            </FormGroup>

            {/* 비밀번호 */}
            <FormGroup label="비밀번호" htmlFor="password">
              <div
                className={`flex h-14 items-center border bg-white px-4 focus-within:border-blue-900 ${
                  pwTouched && !pwAllPassed && form.password.length > 0
                    ? "border-red-400"
                    : pwTouched && pwAllPassed
                    ? "border-green-600"
                    : "border-slate-300"
                }`}
              >
                <span className="mr-3 text-slate-400"><FiLock size={21} /></span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => { setPwFocused(true); setPwTouched(true); }}
                  onBlur={() => setPwFocused(false)}
                  autoComplete="new-password"
                  required
                  className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"
                />
                {/* 강도 뱃지 */}
                {pwTouched && form.password.length > 0 && (
                  <span className={`ml-2 flex-shrink-0 rounded px-2 py-0.5 text-[0.6875rem] font-bold text-white ${strengthColor}`}>
                    {strengthLabel}
                  </span>
                )}
              </div>

              {/* 강도 바 */}
              {pwTouched && form.password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {PW_RULES.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                        i < passedCount ? strengthColor : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* 규칙 체크리스트 — 포커스 중이거나 미충족 시 표시 */}
              {pwTouched && (pwFocused || !pwAllPassed) && form.password.length > 0 && (
                <div className="mt-2 border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="mb-2 text-[0.8125rem] font-semibold text-slate-600">비밀번호 규칙</p>
                  <ul className="flex flex-col gap-1.5">
                    {pwRuleResults.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 text-[0.8125rem]">
                        {r.ok ? (
                          <FiCheck size={13} className="flex-shrink-0 text-green-600" />
                        ) : (
                          <FiX size={13} className="flex-shrink-0 text-red-500" />
                        )}
                        <span className={r.ok ? "text-green-700" : "text-red-600"}>
                          {r.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </FormGroup>

            {/* 비밀번호 확인 */}
            <FormGroup label="비밀번호 확인" htmlFor="passwordConfirm">
              <div
                className={`flex h-14 items-center border bg-white px-4 focus-within:border-blue-900 ${
                  pwMismatch
                    ? "border-red-400"
                    : pwMatch
                    ? "border-green-600"
                    : "border-slate-300"
                }`}
              >
                <span className="mr-3 text-slate-400"><FiLock size={21} /></span>
                <input
                  id="passwordConfirm"
                  type="password"
                  name="passwordConfirm"
                  placeholder="비밀번호 재입력"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  onBlur={() => setConfirmTouched(true)}
                  autoComplete="new-password"
                  required
                  className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"
                />
                {/* 일치 여부 아이콘 */}
                {form.passwordConfirm.length > 0 && (
                  pwMatch ? (
                    <FiCheck size={18} className="ml-2 flex-shrink-0 text-green-600" />
                  ) : pwMismatch ? (
                    <FiX size={18} className="ml-2 flex-shrink-0 text-red-500" />
                  ) : null
                )}
              </div>

              {/* 불일치 메시지 */}
              {pwMismatch && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-red-600">
                  <FiX size={14} />
                  비밀번호가 일치하지 않습니다.
                </p>
              )}
              {pwMatch && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-green-600">
                  <FiCheck size={14} />
                  비밀번호가 일치합니다.
                </p>
              )}
            </FormGroup>

            {/* 제출 */}
            <button
              type="submit"
              disabled={loading || pageLoading}
              className="mt-8 flex h-14 w-full items-center justify-center bg-blue-900 text-[1.125rem] font-bold text-white hover:bg-blue-950 disabled:bg-slate-400"
            >
              {loading ? "회원가입 요청 중..." : "회원가입 요청"}
            </button>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 text-center text-[1.0625rem]">
              <Link
                to="/login"
                className="border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                로그인
              </Link>
              <Link
                to="/company-register"
                className="border border-blue-900 bg-blue-900 px-4 py-3 font-bold text-white hover:bg-blue-950"
              >
                회사 등록
              </Link>
            </div>

            <div className="mt-4 text-center text-[0.9375rem] leading-relaxed text-slate-500">
              현장 및 권한은 가입 이후 관리자에게 배정됩니다.
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   서브 컴포넌트
─────────────────────────────────────────── */
function FormGroup({ label, htmlFor, children }) {
  return (
    <div className="mt-5">
      <label htmlFor={htmlFor} className="mb-2 block text-[1.0625rem] font-semibold text-slate-800">
        {label}
      </label>
      {children}
    </div>
  );
}

function InputWithIcon({ id, type = "text", name, icon, placeholder, value, onChange, autoComplete }) {
  return (
    <div className="flex h-14 items-center border border-slate-300 bg-white px-4 focus-within:border-blue-900">
      <span className="mr-3 text-slate-400">{icon}</span>
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"
      />
    </div>
  );
}