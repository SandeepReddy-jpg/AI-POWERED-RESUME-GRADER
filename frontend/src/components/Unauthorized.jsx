import { useEffect } from "react";
import { useNavigate } from "react-router";

const Unauthorized = ({ delay = 4000 }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, delay);
    return () => clearTimeout(timer);
  }, [navigate, delay]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f4f1ee]">
      <h1 className="text-4xl font-bold text-[#e05252] mb-4 tracking-tight">
        401 — Unauthorized
      </h1>
      <p className="text-[#5c5470] mb-2">Please login to access this page.</p>
      <p className="text-sm text-[#b0aac0]">Redirecting to login...</p>
    </div>
  );
};

export default Unauthorized;
