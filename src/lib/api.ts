import axios from "axios";

const DEFAULT_API_URL = "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
