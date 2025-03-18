import { apiauth } from "@/utils/apiaxios";

export const handleGoogleLogin = () => {
  window.location.href = `${apiauth.getUri()}oauth/login/google`;
};
