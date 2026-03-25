import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth_user");
  if (raw) {
    try {
      const user = JSON.parse(raw) as { userType?: number };
      if (user.userType !== undefined) {
        config.headers["x-user-type"] = String(user.userType);
      }
    } catch {
      // ignore invalid local storage shape
    }
  }
  return config;
});

export async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}
