import axios from "axios";
import { forceLogout, isAccountLockMessage } from "../utils/authSession";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || "";

    if (
      url.includes("/users/me/profile") &&
      response.data &&
      response.data.compte_actif === false
    ) {
      forceLogout("account-disabled");
    }

    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (status === 401) {
      forceLogout("unauthorized");
    } else if (status === 403 && isAccountLockMessage(message)) {
      forceLogout(message);
    }

    return Promise.reject(error);
  },
);

export default api;
