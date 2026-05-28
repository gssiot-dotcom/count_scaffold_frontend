import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";

import { ROLE_CONFIG } from "../data/roleConfig.js";

import { api, ROLE_MAP, saveLoginUser } from "../api/api.js";

export default function Login({ setRole }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    setErrorMsg("");

    if (!email.trim() || !password.trim()) {

      setErrorMsg("이메일과 비밀번호를 입력해주세요.");

      return;

    }

    setLoading(true);

    try {

      const result = await api.login({

        email: email.trim(),

        password,

      });

      const frontendRole = ROLE_MAP[result.role];

      if (!frontendRole || !ROLE_CONFIG[frontendRole]) {

        throw new Error("알 수 없는 권한입니다. 관리자에게 문의해주세요.");

      }

      const loginUser = {

        user_id: result.user_id,

        role: result.role,

        frontend_role: frontendRole,

        company_id: result.company_id,

        name: result.name || "사용자",

        email: email.trim(),

        company_name: result.company_name || "소속 회사",

      };

      saveLoginUser(loginUser);

      setRole(frontendRole);

      const firstPath = ROLE_CONFIG[frontendRole].routes[0].path;

      navigate(firstPath, { replace: true });

    } catch (error) {

      setErrorMsg(error.message || "로그인에 실패했습니다.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[75rem] grid-cols-[1fr_30rem] overflow-hidden border border-slate-300 bg-white max-lg:grid-cols-1">

        <section className="flex flex-col justify-between border-r border-slate-300 bg-slate-50 p-12 max-lg:hidden">

          <div>

            <div className="text-[2.25rem] font-black tracking-tight text-blue-900">

              GSS

            </div>

            <div className="mt-1 text-[1.125rem] font-semibold text-slate-500">

              비계 통합관리 시스템

            </div>

            <h2 className="mt-16 text-[2.75rem] font-black leading-tight tracking-[-0.04em] text-slate-900">

              현장과 사무실을 연결하는

              <br />

              통합 관리 플랫폼

            </h2>

          </div>

        </section>

        <section className="flex items-center justify-center p-12 max-sm:p-7">

          <form className="w-full max-w-[26.25rem]" onSubmit={handleLogin}>

            <div className="mb-8 flex h-14 w-14 items-center justify-center border border-blue-200 bg-blue-50 text-blue-900">

              <FiShield size={26} />

            </div>

            <h1 className="text-[2.375rem] font-black tracking-[-0.04em] text-slate-900">

              로그인

            </h1>

            <p className="mt-3 text-[1.125rem] leading-relaxed text-slate-500">

              등록된 계정으로 GSS 시스템에 접속하세요.

            </p>

            {errorMsg && (

              <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-[1rem] font-medium text-red-700">

                {errorMsg}

              </div>

            )}

            <div className="mt-8">

              <label

                htmlFor="email"

                className="mb-2 block text-[1.0625rem] font-semibold text-slate-800"

              >

                이메일

              </label>

              <div className="flex h-14 items-center border border-slate-300 bg-white px-4 focus-within:border-blue-900">

                <FiMail className="mr-3 text-slate-400" size={21} />

                <input

                  id="email"

                  type="email"

                  placeholder="이메일 입력"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  autoComplete="email"

                  required

                  className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"

                />

              </div>

            </div>

            <div className="mt-5">

              <label

                htmlFor="password"

                className="mb-2 block text-[1.0625rem] font-semibold text-slate-800"

              >

                비밀번호

              </label>

              <div className="flex h-14 items-center border border-slate-300 bg-white px-4 focus-within:border-blue-900">

                <FiLock className="mr-3 text-slate-400" size={21} />

                <input

                  id="password"

                  type={showPassword ? "text" : "password"}

                  placeholder="비밀번호 입력"

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  autoComplete="current-password"

                  required

                  className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"

                />

                <button

                  type="button"

                  onClick={() => setShowPassword((prev) => !prev)}

                  className="ml-3 flex h-9 w-9 min-w-0 items-center justify-center border-0 bg-transparent p-0 text-slate-500 hover:bg-transparent hover:text-slate-900"

                >

                  {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}

                </button>

              </div>

            </div>

            <button

              type="submit"

              disabled={loading}

              className="mt-8 flex h-14 w-full items-center justify-center bg-blue-900 text-[1.125rem] font-bold text-white hover:bg-blue-950 disabled:bg-slate-400"

            >

              {loading ? "로그인 중..." : "로그인"}

            </button>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-[1.0625rem] text-slate-600">

              계정이 없나요?{" "}

              <Link to="/signup" className="font-bold text-blue-900 underline">

                회원가입

              </Link>

            </div>

            <div className="mt-4 text-center text-[0.9375rem] leading-relaxed text-slate-500">

              가입 후 관리자의 승인이 완료되어야 로그인할 수 있습니다.

            </div>

          </form>

        </section>

      </div>

    </div>

  );

}

function InfoBox({ title, desc }) {

  return (

    <div className="border border-slate-300 bg-white p-5">

      <strong className="block text-[1.375rem] font-black text-slate-900">

        {title}

      </strong>

      <span className="mt-1 block text-[0.9375rem] font-medium text-slate-500">

        {desc}

      </span>

    </div>

  );

}
