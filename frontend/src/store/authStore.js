import { create } from "zustand";
import axios from "axios";
import BASE_URL from "../config/api";

export const useAuth = create((set) => ({
  currentUser: null,
  loading: false,
  isAuthenticated: false,
  error: null,

  //register user
  register: async (userObj) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${BASE_URL}/auth/register`, userObj);
      set({ loading: false });
      return res;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || "Registration failed",
      });
      throw err;
    }
  },

  //login user
  login: async (userCred) => {
    try {
      set({ loading: true, currentUser: null, isAuthenticated: false, error: null });
      const res = await axios.post(`${BASE_URL}/auth/login`, userCred);
      if (res.status === 200) {
        //store token in localStorage
        localStorage.setItem("token", res.data.token);
        set({
          currentUser: res.data?.payload,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed";
      const hint = err.response?.status === 401 ? " - Check email and password, or register if you don't have an account" : "";
      set({
        loading: false,
        isAuthenticated: false,
        currentUser: null,
        error: errorMsg + hint,
      });
    }
  },

  //logout user
  logout: () => {
    localStorage.removeItem("token");
    set({ currentUser: null, isAuthenticated: false, error: null, loading: false });
  },

  //restore login on page refresh
  checkAuth: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ currentUser: null, isAuthenticated: false, loading: false });
        return;
      }
      set({ loading: true });
      const res = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status < 500,
      });
      if (res.status === 200) {
        set({
          currentUser: res.data.payload,
          isAuthenticated: true,
          loading: false,
        });
        return;
      }
      //token invalid
      localStorage.removeItem("token");
      set({ currentUser: null, isAuthenticated: false, loading: false });
    } catch (err) {
      console.error("Auth check failed:", err);
      set({ loading: false });
    }
  },
}));
