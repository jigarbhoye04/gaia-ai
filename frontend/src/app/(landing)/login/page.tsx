import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { apiauth } from "@/lib";

// import LoginForm from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "login",
  description:
    "Access your personal AI assistant account on GAIA. login now to manage your tasks and boost your productivity.",
  openGraph: {
    title: "login",
    description: "Access your personal AI assistant account on GAIA.",
    url: "https://heygaia.io/login",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - Your Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "login",
    description: "Access your personal AI assistant account on GAIA.",
    images: ["/landing/screenshot.webp"],
  },
};

// Redirect to the OAuth login endpoint directly
export default function LoginPage() {
  redirect(`${apiauth.getUri()}oauth/login/workos`);
  // return <LoginForm />;
}
