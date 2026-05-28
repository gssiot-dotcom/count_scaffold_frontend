// src/pages/MyPage.jsx

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { FiArrowLeft } from "react-icons/fi";

import { api, getLoginUser, saveLoginUser } from "../api/api.js";

export default function MyPage() {

  const navigate = useNavigate();

  const loginUser = getLoginUser();

  const [form, setForm] = useState({

    name: loginUser?.name || "",

    phone: loginUser?.phone || "",

    password: "",

    passwordConfirm: "",

  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({

      ...prev,

      [name]: value,

    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!loginUser?.user_id) {

      alert("로그인 정보가 없습니다.");

      return;

    }

    if (form.password && form.password !== form.passwordConfirm) {

      alert("비밀번호가 일치하지 않습니다.");

      return;

    }

    const payload = {

      name: form.name,

      phone: form.phone,

    };

    if (form.password) {

      payload.password = form.password;

    }

    try {

      setLoading(true);

      const result = await api.updateMyInfo(loginUser.user_id, payload);

      const updatedUser = {

        ...loginUser,

        name: result.user?.name || form.name,

        phone: result.user?.phone || form.phone,

      };

      saveLoginUser(updatedUser);

      alert("내 정보가 수정되었습니다.");

      setForm((prev) => ({

        ...prev,

        password: "",

        passwordConfirm: "",

      }));

    } catch (error) {

      alert(error.message || "정보 수정에 실패했습니다.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="bg-slate-100">

      <section className="border border-slate-300 bg-white">

        {/* 상단 헤더 */}

        <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">

          <div className="mb-4">

            <button

              type="button"

              onClick={() => navigate(-1)}

              className="flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-[1rem] font-medium text-slate-700 hover:bg-slate-100"

            >

              <FiArrowLeft className="text-[1.125rem]" />

              뒤로 가기

            </button>

          </div>

          <h1 className="text-[2.125rem] font-semibold text-slate-900">

            마이페이지

          </h1>

          <p className="mt-2 text-[1.1875rem] text-slate-600">

            내 계정 정보와 연락처, 비밀번호를 수정합니다.

          </p>

        </div>

        {/* 폼 */}

        <form onSubmit={handleSubmit} className="max-w-[45rem] p-7">

          <Info label="이메일" value={loginUser?.email || "-"} />

          <Info label="권한" value={loginUser?.role || "-"} />

          <Info

            label="회사"

            value={

              loginUser?.company_name ||

              `회사 ID ${loginUser?.company_id || "-"}`

            }

          />

          <label className="mb-2 mt-6 block text-[1.125rem] font-medium">

            이름

          </label>

          <input

            name="name"

            value={form.name}

            onChange={handleChange}

            className="mb-5 w-full border border-slate-400 px-4 py-4 text-[1.125rem]"

            placeholder="이름 입력"

          />

          <label className="mb-2 block text-[1.125rem] font-medium">

            연락처

          </label>

          <input

            name="phone"

            value={form.phone}

            onChange={handleChange}

            className="mb-5 w-full border border-slate-400 px-4 py-4 text-[1.125rem]"

            placeholder="010-0000-0000"

          />

          <label className="mb-2 block text-[1.125rem] font-medium">

            새 비밀번호

          </label>

          <input

            type="password"

            name="password"

            value={form.password}

            onChange={handleChange}

            className="mb-5 w-full border border-slate-400 px-4 py-4 text-[1.125rem]"

            placeholder="변경할 경우에만 입력"

          />

          <label className="mb-2 block text-[1.125rem] font-medium">

            새 비밀번호 확인

          </label>

          <input

            type="password"

            name="passwordConfirm"

            value={form.passwordConfirm}

            onChange={handleChange}

            className="mb-7 w-full border border-slate-400 px-4 py-4 text-[1.125rem]"

            placeholder="비밀번호 재입력"

          />

          <button

            type="submit"

            disabled={loading}

            className="border border-blue-900 bg-blue-900 px-7 py-4 text-[1.125rem] text-white disabled:bg-slate-400"

          >

            {loading ? "저장 중..." : "정보 수정"}

          </button>

        </form>

      </section>

    </div>

  );

}

function Info({ label, value }) {

  return (

    <div className="mb-4 border border-slate-300 bg-slate-50 px-5 py-4">

      <div className="text-[1rem] text-slate-500">{label}</div>

      <div className="mt-1 text-[1.25rem] font-medium text-slate-900">

        {value}

      </div>

    </div>

  );

}