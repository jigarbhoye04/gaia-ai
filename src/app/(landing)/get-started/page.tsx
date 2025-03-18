import type { Metadata } from "next";

import LoginSignup from "@/components/Login/LoginSignup";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your GAIA account today and unlock the power of your personal AI assistant. Get started now!",
  openGraph: {
    title: "Sign Up",
    description: "Create your GAIA account today and unlock the power of AI.",
    url: "https://heygaia.io/signup",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - Your Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up",
    description: "Create your GAIA account today and unlock the power of AI.",
    images: ["/landing/screenshot.webp"],
  },
};

export default function SignupPage() {
  return <LoginSignup isLogin={false} />;
}
