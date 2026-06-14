import axios from "axios";
import { store } from "../store";
import { logoutAction, setUser } from "../store/slices/auth.slice";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true, // കുക്കികൾ തനിയെ പോകാനും വരാനും ഇത് നിർബന്ധമാണ്
});

// Response Interceptor: Handle 401 logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🚨 ഫിക്സ് 1: ലോഗിൻ ചെയ്യുമ്പോഴോ, റീഫ്രഷ് ചെയ്യുമ്പോഴോ വരുന്ന 401 എററുകളെ Interceptor പിടിക്കാൻ പാടില്ല!
    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { user } = res.data;
        store.dispatch(setUser({ user }));

        // പുതിയ കുക്കി സെറ്റ് ആയി, ഒറിജിനൽ റിക്വസ്റ്റ് വീണ്ടും വിളിക്കുന്നു
        return api(originalRequest);
      } catch (refreshError) {
        // റീഫ്രഷ് പരാജയപ്പെട്ടാൽ Redux-ൽ നിന്ന് യൂസറെ പുറത്താക്കുന്നു.
        store.dispatch(logoutAction());

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
