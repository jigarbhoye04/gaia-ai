import axios from "axios";
import { setupCache } from "axios-cache-interceptor";

axios.defaults.timeout = 300_000;

const instance = axios.create({
  baseURL: process.env.BACKEND_URL,
});

export const apiauth = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true,
});

// export const apiauth_cache = setupCache(apiauth);
export const api = setupCache(instance);

export default api;
