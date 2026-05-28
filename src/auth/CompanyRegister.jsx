import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { FiBriefcase, FiPhone, FiMapPin, FiUser, FiShield } from "react-icons/fi";

import { api } from "../api/api.js";

export default function CompanyRegister() {

  const navigate = useNavigate();

  const [form, setForm] = useState({

    company_name: "",

    ceo_name: "",

    company_contact: "",

    company_address: "",

  });

  const [errorMsg, setErrorMsg] = useState("");

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

    setErrorMsg("");

    if (!form.company_name.trim()) {

      setErrorMsg("회사명을 입력해주세요.");

      return;

    }

    try {

      setLoading(true);

      await api.createCompany({

        company_name: form.company_name.trim(),

        ceo_name: form.ceo_name.trim(),

        company_contact: form.company_contact.trim(),

        company_address: form.company_address.trim(),

      });

      alert("회사 등록이 완료되었습니다. 이제 회원가입을 진행해주세요.");

      navigate("/signup", { replace: true });

    } catch (error) {

      setErrorMsg(error.message || "회사 등록에 실패했습니다.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-slate-100 p-8">

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[75rem] grid-cols-[1fr_32.5rem] overflow-hidden border border-slate-300 bg-white max-lg:grid-cols-1">

        <section className="flex flex-col justify-between border-r border-slate-300 bg-slate-50 p-12 max-lg:hidden">

          <div>

            <div className="text-[2.25rem] font-black tracking-tight text-blue-900">

              GSS

            </div>

            <div className="mt-1 text-[1.125rem] font-semibold text-slate-500">

              비계 통합관리 시스템

            </div>

            <h2 className="mt-16 text-[2.75rem] font-black leading-tight tracking-[-0.04em] text-slate-900">

              회사 등록 후

              <br />

              계정을 생성하세요

            </h2>

            <p className="mt-6 max-w-[35rem] text-[1.25rem] leading-relaxed text-slate-600">

              회사 정보를 먼저 등록한 뒤, 해당 회사를 선택하여 회원가입을 진행합니다.

            </p>

          </div>

          <div className="grid grid-cols-3 gap-3">

            <InfoBox title="회사" desc="정보 등록" />

            <InfoBox title="계정" desc="회원가입" />

            <InfoBox title="승인" desc="관리자 확인" />

          </div>

        </section>

        <section className="flex items-center justify-center p-12 max-sm:p-7">

          <form className="w-full max-w-[27.5rem]" onSubmit={handleSubmit}>

            <div className="mb-8 flex h-14 w-14 items-center justify-center border border-blue-200 bg-blue-50 text-blue-900">

              <FiShield size={26} />

            </div>

            <h1 className="text-[2.375rem] font-black tracking-[-0.04em] text-slate-900">

              회사 등록

            </h1>

            <p className="mt-3 text-[1.125rem] leading-relaxed text-slate-500">

              회원가입 전 소속 회사를 먼저 등록합니다.

            </p>

            {errorMsg && (

              <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-[1rem] font-medium text-red-700">

                {errorMsg}

              </div>

            )}

            <FormGroup label="회사명" htmlFor="company_name">

              <InputWithIcon

                id="company_name"

                name="company_name"

                icon={<FiBriefcase size={21} />}

                placeholder="예: 에이엔티시스템"

                value={form.company_name}

                onChange={handleChange}

              />

            </FormGroup>

            <FormGroup label="대표자명" htmlFor="ceo_name">

              <InputWithIcon

                id="ceo_name"

                name="ceo_name"

                icon={<FiUser size={21} />}

                placeholder="예: 홍길동"

                value={form.ceo_name}

                onChange={handleChange}

              />

            </FormGroup>

            <FormGroup label="회사 연락처" htmlFor="company_contact">

              <InputWithIcon

                id="company_contact"

                name="company_contact"

                icon={<FiPhone size={21} />}

                placeholder="예: 02-0000-0000"

                value={form.company_contact}

                onChange={handleChange}

              />

            </FormGroup>

            <FormGroup label="회사 주소" htmlFor="company_address">

              <InputWithIcon

                id="company_address"

                name="company_address"

                icon={<FiMapPin size={21} />}

                placeholder="예: 서울특별시 강남구"

                value={form.company_address}

                onChange={handleChange}

              />

            </FormGroup>

            <button

              type="submit"

              disabled={loading}

              className="mt-8 flex h-14 w-full items-center justify-center bg-blue-900 text-[1.125rem] font-bold text-white hover:bg-blue-950 disabled:bg-slate-400"

            >

              {loading ? "등록 중..." : "회사 등록"}

            </button>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 text-center text-[1.0625rem]">

              <Link

                to="/login"

                className="border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"

              >

                로그인

              </Link>

              <Link

                to="/signup"

                className="border border-blue-900 bg-blue-900 px-4 py-3 font-bold text-white hover:bg-blue-950"

              >

                회원가입

              </Link>

            </div>

          </form>

        </section>

      </div>

    </div>

  );

}

function FormGroup({ label, htmlFor, children }) {

  return (

    <div className="mt-5">

      <label

        htmlFor={htmlFor}

        className="mb-2 block text-[1.0625rem] font-semibold text-slate-800"

      >

        {label}

      </label>

      {children}

    </div>

  );

}

function InputWithIcon({ id, name, icon, placeholder, value, onChange }) {

  return (

    <div className="flex h-14 items-center border border-slate-300 bg-white px-4 focus-within:border-blue-900">

      <span className="mr-3 text-slate-400">{icon}</span>

      <input

        id={id}

        name={name}

        placeholder={placeholder}

        value={value}

        onChange={onChange}

        className="h-full w-full border-0 bg-transparent text-[1.125rem] outline-none placeholder:text-slate-400"

      />

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