import axios from "axios";
import { setupCache } from "axios-cache-interceptor";

// Ensure environment variable exists
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_API_BASE_URL");
}

axios.defaults.timeout = 300_000;

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const apiauth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// export const apiauth_cache = setupCache(apiauth);
export const api = setupCache(instance);

export default api;
