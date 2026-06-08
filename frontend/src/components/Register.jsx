import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuth } from "../store/authStore";
import {
  formGroup,
  labelClass,
  inputClass,
  errorClass,
  mutedText,
  linkClass,
  loadingClass,
} from "../styles/common";

function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading, error } = useAuth((state) => state);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onUserRegister = async (userObj) => {
    try {
      const res = await registerUser({
        name: userObj.name,
        email: userObj.email,
        password: userObj.password,
      });
      if (res.status === 201) {
        toast.success("Registration successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      // error handled in store
    }
  };

  if (loading) {
    return <p className={loadingClass}>Creating account...</p>;
  }

  return (
    <div className="bg-[#f4f1ee] min-h-screen flex items-center justify-center py-16 px-4">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6c63ff]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#f0894d]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-[#e8e3dc] rounded-3xl p-10 shadow-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-block w-10 h-10 rounded-2xl bg-[#6c63ff] mb-4" />
            <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
              Create an account
            </h2>
            <p className="text-sm text-[#9e9aa7] mt-1">
              Start analyzing your resume with AI
            </p>
          </div>

          {/* API Error */}
          {error && <p className={`${errorClass} mb-5`}>{error}</p>}

          <form onSubmit={handleSubmit(onUserRegister)} className="flex flex-col gap-4">
            {/* NAME */}
            <div className={formGroup}>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={inputClass}
                {...register("name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "At least 2 characters required" },
                  validate: (v) => v.trim().length > 0 || "Cannot be empty",
                })}
              />
              {errors.name && (
                <p className={`${errorClass} mt-1`}>{errors.name.message}</p>
              )}
            </div>

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
                placeholder="Min. 6 characters"
                className={inputClass}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters required" },
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
              Create Account
            </button>
          </form>

          {/* FOOTER */}
          <p className={`${mutedText} text-center mt-6`}>
            Already have an account?{" "}
            <NavLink to="/login" className={linkClass}>
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
