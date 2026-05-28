import { Navigate } from "react-router-dom";

import { getLoginUser, ROLE_MAP } from "../api/api.js";

export default function ProtectedRoute({ children, role }) {

  const user = getLoginUser();

  if (!user?.user_id) {

    return <Navigate to="/" replace />;

  }

  const frontendRole = ROLE_MAP[user.role];

  if (role && frontendRole !== role) {

    return <Navigate to="/" replace />;

  }

  return children;

}