// src/layouts/AppLayout.jsx

import { Navigate, Route, Routes } from "react-router-dom";

import Header from "../components/Header.jsx";

import SubSidebar from "../components/SubSidebar.jsx";

export default function AppLayout({
  role,
  setRole,
  config,
}) {
  const visibleRoutes = config.routes.filter(
    (route) => !route.hidden
  );

  const firstPath =
    visibleRoutes[0]?.path ||
    config.routes[0]?.path ||
    "/";

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        role={role}
        setRole={setRole}
        roleConfig={config}
      />

      <div className="flex min-h-[calc(100vh-5.125rem)]">
        <SubSidebar
          roleConfig={{
            ...config,
            routes: visibleRoutes,
          }}
        />

        <main className="flex-1 overflow-x-hidden bg-slate-100">
          {/* 본문 영역 최대 확장 */}
          <div className="mx-auto w-full max-w-[121.25rem] px-12 py-8">
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate to={firstPath} replace />
                }
              />

              {config.routes.map((route) => {
                const Page = route.component;

                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<Page role={role} />}
                  />
                );
              })}

              <Route
                path="*"
                element={
                  <Navigate to={firstPath} replace />
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}