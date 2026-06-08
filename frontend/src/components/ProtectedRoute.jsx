import { useAuth } from "../store/authStore";
import { Navigate } from "react-router";
import toast from "react-hot-toast";
import { loadingClass } from "../styles/common";

function ProtectedRoute({ children }) {
  //get user login status from store
  const { loading, isAuthenticated } = useAuth();
  //loading state
  if (loading) {
    return <p className={loadingClass}>Loading...</p>;
  }
  //if user not logged in
  if (!isAuthenticated) {
    toast.error("Please login first");
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
