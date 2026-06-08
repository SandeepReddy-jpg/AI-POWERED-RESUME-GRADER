import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../store/authStore";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  formGroup,
  labelClass,
  inputClass,
  errorClass,
  mutedText,
  linkClass,
  loadingClass,
} from "../styles/common";

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { login, currentUser, loading, error, isAuthenticated } = useAuth(
    (state) => state,
  );

  const onUserLogin = (userCredObj) => {
    login(userCredObj);
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    toast.success("Login successful!", { duration: 2000 });
    navigate("/profile");
  }, [currentUser, isAuthenticated, navigate]);

  if (loading) {
    return <p className={loadingClass}>Signing in...</p>;
  }

  return (
    <div className="bg-[#f4f1ee] min-h-screen flex items-center justify-center py-16 px-4">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#6c63ff]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#2ecc8a]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-[#e8e3dc] rounded-3xl p-10 shadow-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-block w-10 h-10 rounded-2xl bg-[#6c63ff] mb-4" />
            <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-[#9e9aa7] mt-1">
              Sign in to your ResumeAI account
            </p>
          </div>

          {/* API Error */}
          {error && <p className={`${errorClass} mb-5`}>{error}</p>}

          <form onSubmit={handleSubmit(onUserLogin)} className="flex flex-col gap-4">
            {/* EMAIL */}
            <div className={formGroup}>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={inputClass}
                {...register("email", {
                  required: "Email is required",
                  validate: (v) => v.trim().length > 0 || "Email cannot be empty",
                })}
              />
              {errors.email && (
                <p className={`${errorClass} mt-1`}>{errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className={formGroup}>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClass}
                {...register("password", {
                  required: "Password is required",
                  validate: (v) => v.trim().length > 0 || "Password cannot be empty",
                })}
              />
              {errors.password && (
                <p className={`${errorClass} mt-1`}>{errors.password.message}</p>
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full bg-[#6c63ff] text-white font-semibold py-3 rounded-xl hover:bg-[#5548e0] hover:shadow-lg hover:shadow-[#6c63ff]/25 transition-all duration-200 text-sm mt-2"
            >
              Sign In
            </button>
          </form>

          {/* FOOTER */}
          <p className={`${mutedText} text-center mt-6`}>
            Don&apos;t have an account?{" "}
            <NavLink to="/register" className={linkClass}>
              Create one
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
