import axios from "axios";

import { tokenStorageKey } from "./storage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL });
export const publicApi = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const token = window.localStorage.getItem(tokenStorageKey);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
