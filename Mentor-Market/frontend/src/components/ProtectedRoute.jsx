import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { roleHome } from "../utils/roleHome.js";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="center-page"><LoadingSpinner label="Checking your session" /></main>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}
