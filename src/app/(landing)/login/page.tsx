import LoginSignup from "@/components/Login/LoginSignup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Access your personal AI assistant account on GAIA. Login now to manage your tasks and boost your productivity.",
  openGraph: {
    title: "Login",
    description: "Access your personal AI assistant account on GAIA.",
    url: "https://heygaia.io/login",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - Your Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login",
    description: "Access your personal AI assistant account on GAIA.",
    images: ["/landing/screenshot.webp"],
  },
};

export default function LoginPage() {
  return <LoginSignup isLogin={true} />;
}
