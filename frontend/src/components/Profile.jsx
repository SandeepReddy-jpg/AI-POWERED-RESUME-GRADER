import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../store/authStore";
import {
  pageWrapper,
  divider,
  profileCard,
  avatarClass,
  tabBarClass,
  tabActiveClass,
  tabInactiveClass,
} from "../styles/common";

function Profile() {
  const currentUser = useAuth((state) => state.currentUser);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={pageWrapper}>
      {/* PROFILE HEADER */}
      <div className={profileCard}>
        {/* LEFT */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={avatarClass}>
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          {/* Name */}
          <div>
            <p className="text-sm text-[#9e9aa7]">Welcome back</p>
            <h2 className="text-xl font-semibold text-[#1a1a2e]">
              {currentUser?.name}
            </h2>
            <p className="text-xs text-[#b0aac0]">{currentUser?.email}</p>
          </div>
        </div>
        {/* LOGOUT */}
        <button
          className="bg-[#e05252] text-white text-sm px-5 py-2 rounded-full hover:bg-[#c93d3d] transition cursor-pointer"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div className={tabBarClass}>
        <NavLink
          to="resumes"
          className={({ isActive }) =>
            isActive ? tabActiveClass : tabInactiveClass
          }
        >
          My Resumes
        </NavLink>
        <NavLink
          to="upload"
          className={({ isActive }) =>
            isActive ? tabActiveClass : tabInactiveClass
          }
        >
          Upload Resume
        </NavLink>
      </div>

      <div className={divider}></div>

      {/* CONTENT */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}

export default Profile;
