import { Navigate, useLocation } from "react-router-dom";
import PageFrame from "../components/PageFrame.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useAuth } from "./AuthContext.jsx";

/** Gate for pages that need an account. Redirects to /connexion otherwise. */
export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <PageFrame>
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageFrame>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  return children;
}
