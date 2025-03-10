import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Review GAIA's Privacy Policy to learn how we collect, use, and protect your personal data while providing our AI assistant services.",
  openGraph: {
    title: "Privacy Policy",
    description:
      "Review GAIA's Privacy Policy to learn how we collect, use, and protect your personal data while providing our AI assistant services.",
    url: "https://heygaia.io/privacy",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - AI Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description:
      "Review GAIA's Privacy Policy to learn how we collect, use, and protect your personal data while providing our AI assistant services.",
    images: ["/landing/screenshot.webp"],
  },
  keywords: [
    "GAIA",
    "Privacy Policy",
    "AI Assistant",
    "Data Protection",
    "Personal Data",
    "Privacy",
  ],
};

const PrivacyPolicy = () => {
  return (
    <div className="flex w-screen items-center justify-center flex-col">
      <div className="privacy-policy p-6 pt-24 max-w-screen-xl ">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          <strong>Effective Date:</strong> 1st Feb 2025
        </p>
        <p className="mb-4">
          GAIA ("we," "us," or "our") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and protect your
          personal information when you use our AI assistant services (the
          "Service").
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2">
          1. Information We Collect
        </h2>
        <ul className="list-disc ml-6 mb-4">
          <li>
            <strong>Personal Information:</strong> Information you provide
            during account creation, such as name, email address, and payment
            details.
          </li>
          <li>
            <strong>Input Data:</strong> Any data you input into the Service for
            processing, including text, files, or other content.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-4 mb-2">
          2. How We Use Your Information
        </h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Provide, maintain, and improve the Service.</li>
          <li>Personalize your experience.</li>
          <li>Process payments and manage subscriptions.</li>
          <li>Communicate with you, including support and updates.</li>
          <li>Ensure security and prevent unauthorized access.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-4 mb-2">
          3. Data Sharing and Disclosure
        </h2>
        <p className="mb-4">
          We do not sell your personal data. However, we may share data with:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>
            <strong>Service Providers:</strong> Third parties who assist in
            delivering our services (e.g., payment processors, hosting
            providers).
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law or to
            protect our rights.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-4 mb-2">4. Data Security</h2>
        <p className="mb-4">
          We use industry-standard measures to protect your data from
          unauthorized access, loss, or misuse.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2">5. Your Rights</h2>
        <p className="mb-4">You may have rights under applicable laws to:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>Access, update, or delete your personal data.</li>
          <li>Opt-out of communications.</li>
          <li>Restrict or object to data processing.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-4 mb-2">6. Retention</h2>
        <p className="mb-4">
          We retain your data only as long as necessary to provide the Service
          or comply with legal obligations.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2">
          7. Third-Party Services
        </h2>
        <p className="mb-4">
          Our Service may integrate with third-party services. Their privacy
          practices are governed by their policies.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2">
          8. Changes to This Privacy Policy
        </h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes by posting a notice on our website or via
          email.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2">9. Contact Us</h2>
        <p className="mb-4">
          If you have any questions or concerns, contact us at:
        </p>
        <p className="mb-4">Email: support@heygaia.so</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
