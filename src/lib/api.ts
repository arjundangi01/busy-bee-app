import axios from "axios";
import { getStoredToken } from "@/lib/utils/session";

const DEFAULT_API_URL = "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
