import { NavLink } from "react-router";
import { useAuth } from "../store/authStore";
import {
  navbarClass,
  navContainerClass,
  navBrandClass,
  navLinksClass,
  navLinkClass,
  navLinkActiveClass,
} from "../styles/common";

function Header() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const logout = useAuth((state) => state.logout);

  const onLogout = () => {
    logout();
  };

  return (
    <nav className={navbarClass}>
      <div className={navContainerClass}>
        {/* LOGO */}
        <NavLink to="/" className={navBrandClass}>
          ResumeAI
        </NavLink>

        <ul className={navLinksClass}>
          {/* HOME */}
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? navLinkActiveClass : navLinkClass
              }
            >
              Home
            </NavLink>
          </li>

          {/* NOT LOGGED IN */}
          {!isAuthenticated && (
            <>
              <li>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive ? navLinkActiveClass : navLinkClass
                  }
                >
                  Register
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/login"
                  className="text-sm bg-[#6c63ff] text-white font-semibold px-5 py-2 rounded-lg hover:bg-[#5548e0] transition-all duration-200"
                >
                  Login
                </NavLink>
              </li>
            </>
          )}

          {/* LOGGED IN */}
          {isAuthenticated && (
            <>
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    isActive ? navLinkActiveClass : navLinkClass
                  }
                >
                  Profile
                </NavLink>
              </li>
              <li>
                <button
                  onClick={onLogout}
                  className="text-sm text-[#e05252] hover:text-[#c93d3d] transition-colors font-medium cursor-pointer"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Header;
