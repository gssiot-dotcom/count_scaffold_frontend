import { NavLink, useLocation } from "react-router-dom";

export default function SubSidebar({ roleConfig }) {

  const location = useLocation();

  const visibleRoutes = roleConfig.routes.filter((route) => !route.hidden);

  const currentRoute =

  visibleRoutes.find((route) => {

    if (route.path === location.pathname) return true;

    if (route.children?.some((child) => child.path === location.pathname)) {

      return true;

    }

    return location.pathname.startsWith(route.path);

  }) || visibleRoutes[0];

  const subMenus = currentRoute?.children || [];

  return (

    <aside className="w-[17.8125rem] shrink-0 border-r border-slate-300 bg-white">

      <div className="border-b border-slate-300 px-7 py-8">

        <h2 className="text-[1.5625rem] font-semibold text-slate-900">

          {roleConfig.label}

        </h2>

        <p className="mt-3 text-[1rem] leading-relaxed text-slate-600">

          {roleConfig.desc}

        </p>

      </div>

      <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">

        <p className="text-[0.9375rem] font-normal text-slate-500">

          현재 선택 메뉴

        </p>

        <strong className="mt-1 block text-[1.375rem] font-semibold text-blue-900">

          {currentRoute?.label}

        </strong>

      </div>

      <nav className="px-5 py-5">
      {subMenus.map((menu, index) => {

  const isStringMenu = typeof menu === "string";

  const label = isStringMenu ? menu : menu.label;

  const path = isStringMenu ? currentRoute.path : menu.path;

  return (

    <NavLink

      key={`${label}-${path}-${index}`}

      to={path}

      className={({ isActive }) =>

        `mb-2 flex w-full items-center border-l-4 px-4 py-4 text-left text-[1.125rem] font-medium transition ${

          isActive

            ? "border-blue-900 bg-blue-50 text-blue-900"

            : "border-transparent text-slate-700 hover:bg-slate-100"

        }`

      }

    >

      {label}

    </NavLink>

  );

})}

      </nav>

    </aside>

  );

}