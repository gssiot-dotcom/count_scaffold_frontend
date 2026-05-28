// src/components/Header.jsx

import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { getLoginUser, logout } from "../api/api.js";

export default function Header({ roleConfig }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = getLoginUser();
  const userName = user?.name || "사용자";
  const companyName = user?.company_name || `회사 ID ${user?.company_id || "-"}`;
  const roleLabel = roleConfig?.label || "사용자";

  // 로고 클릭 → 첫 번째 visible route로 이동
  const handleLogoClick = () => {
    const firstRoute = roleConfig?.routes?.find((r) => !r.hidden);
    if (firstRoute) navigate(firstRoute.path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 드롭다운 외부 클릭 시 닫힘
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const visibleRoutes = roleConfig?.routes?.filter((r) => !r.hidden) || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-[5.75rem] items-center justify-between px-6">

        {/* 좌측: 로고 + 네비 */}
        <div className="flex min-w-0 items-center">

          {/* 로고 */}
          <div
            onClick={handleLogoClick}
            className="mr-12 cursor-pointer select-none shrink-0"
          >
            <div className="text-[2.375rem] font-extrabold tracking-[-1px] text-blue-900">
              GSS
            </div>
            <div className="mt-[-4px] text-[0.8125rem] font-semibold tracking-wide text-slate-500">
              비계 통합관리 시스템
            </div>
          </div>

          {/* 네비 메뉴 */}
          <nav className="flex h-[5.75rem] items-center overflow-x-auto">
            {visibleRoutes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `flex h-full shrink-0 items-center border-b-[4px] px-5 text-[1.1875rem] font-bold tracking-[-0.2px] transition-all whitespace-nowrap ${
                    isActive
                      ? "border-blue-900 bg-blue-50 text-blue-900"
                      : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-blue-900"
                  }`
                }
              >
                {route.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 우측: 회사 정보 + 사용자 드롭다운 */}
        <div className="ml-6 flex shrink-0 items-center gap-4">

          {/* 회사 정보 */}
          <div className="border border-slate-200 bg-slate-50 px-5 py-3 text-right">
            <div className="text-[0.8125rem] font-semibold text-slate-500">현재 회사</div>
            <div className="mt-0.5 text-[1.25rem] font-bold text-slate-900">{companyName}</div>
          </div>

          {/* 사용자 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex min-w-[13.75rem] items-center justify-between border border-slate-300 bg-white px-5 py-3 transition hover:bg-slate-50"
            >
              <div className="text-left">
                <div className="text-[1.25rem] font-bold text-slate-900">{userName}</div>
                <div className="mt-0.5 text-[0.875rem] font-semibold text-slate-500">{roleLabel}</div>
              </div>
              <FiChevronDown
                size={22}
                className={`ml-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-[4.5rem] z-50 w-[13.75rem] overflow-hidden border border-slate-200 bg-white shadow-2xl">
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate("/mypage"); }}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left text-[1.0625rem] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <FiUser size={19} />
                  마이페이지
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t border-slate-200 px-5 py-4 text-left text-[1.0625rem] font-semibold text-red-600 hover:bg-red-50"
                >
                  <FiLogOut size={19} />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}