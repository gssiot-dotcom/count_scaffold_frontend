import {

  BrowserRouter,

  Navigate,

  Route,

  Routes,

} from "react-router-dom";

import { useState } from "react";

import Login from "./auth/Login.jsx";

import Signup from "./auth/Signup.jsx";

import CompanyRegister from "./auth/CompanyRegister.jsx";

import Home from "./pages/Home.jsx";

import MyPage from "./pages/MyPage.jsx";

import AppLayout from "./layouts/AppLayout.jsx";

import { ROLE_CONFIG } from "./data/roleConfig.js";

import { getLoginUser, ROLE_MAP } from "./api/api.js";

function getInitialRole() {

  const user = getLoginUser();

  // 로그인 정보가 없으면 기본값은 SUPER_ADMIN

  if (!user) {

    return "SUPER_ADMIN";

  }

  // frontend_role이 있으면 우선 사용

  if (user.frontend_role) {

    return user.frontend_role;

  }

  // backend role → frontend role 매핑

  return ROLE_MAP[user.role] || "SUPER_ADMIN";

}

function PrivateRoute({ children }) {

  const user = getLoginUser();

  if (!user?.user_id) {

    return <Navigate to="/login" replace />;

  }

  return children;

}

export default function App() {

  const [role, setRole] = useState(getInitialRole);

  const config =

    ROLE_CONFIG[role] || ROLE_CONFIG.SUPER_ADMIN;

  return (

    <BrowserRouter>

      <Routes>

        {/* 공개 페이지 */}

        <Route path="/" element={<Home />} />

        <Route

          path="/login"

          element={

            <Login

              role={role}

              setRole={setRole}

            />

          }

        />

        <Route

          path="/signup"

          element={<Signup />}

        />

        <Route

          path="/company-register"

          element={<CompanyRegister />}

        />

        {/* 마이페이지 */}

        <Route

          path="/mypage"

          element={

            <PrivateRoute>

              <MyPage />

            </PrivateRoute>

          }

        />

        {/* 역할별 전체 앱 영역 */}

        <Route

          path="/*"

          element={

            <PrivateRoute>

              <AppLayout

                role={role}

                setRole={setRole}

                config={config}

              />

            </PrivateRoute>

          }

        />

      </Routes>

    </BrowserRouter>

  );

}