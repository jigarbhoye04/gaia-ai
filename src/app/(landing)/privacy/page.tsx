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
    <div className="flex w-screen flex-col items-center justify-center">
      <div className="privacy-policy max-w-screen-xl p-6 pt-24">
        <h1 className="mb-4 text-2xl font-bold">Privacy Policy</h1>
        <p className="mb-4">
          <strong>Effective Date:</strong> 1st Feb 2025
        </p>
        <p className="mb-4">
          GAIA ("we," "us," or "our") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and protect your
          personal information when you use our AI assistant services (the
          "Service").
        </p>

        <h2 className="mb-2 mt-4 text-xl font-semibold">
          1. Information We Collect
        </h2>
        <ul className="mb-4 ml-6 list-disc">
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

        <h2 className="mb-2 mt-4 text-xl font-semibold">
          2. How We Use Your Information
        </h2>
        <ul className="mb-4 ml-6 list-disc">
          <li>Provide, maintain, and improve the Service.</li>
          <li>Personalize your experience.</li>
          <li>Process payments and manage subscriptions.</li>
          <li>Communicate with you, including support and updates.</li>
          <li>Ensure security and prevent unauthorized access.</li>
        </ul>

        <h2 className="mb-2 mt-4 text-xl font-semibold">
          3. Data Sharing and Disclosure
        </h2>
        <p className="mb-4">
          We do not sell your personal data. However, we may share data with:
        </p>
        <ul className="mb-4 ml-6 list-disc">
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

        <h2 className="mb-2 mt-4 text-xl font-semibold">4. Data Security</h2>
        <p className="mb-4">
          We use industry-standard measures to protect your data from
          unauthorized access, loss, or misuse.
        </p>

        <h2 className="mb-2 mt-4 text-xl font-semibold">5. Your Rights</h2>
        <p className="mb-4">You may have rights under applicable laws to:</p>
        <ul className="mb-4 ml-6 list-disc">
          <li>Access, update, or delete your personal data.</li>
          <li>Opt-out of communications.</li>
          <li>Restrict or object to data processing.</li>
        </ul>

        <h2 className="mb-2 mt-4 text-xl font-semibold">6. Retention</h2>
        <p className="mb-4">
          We retain your data only as long as necessary to provide the Service
          or comply with legal obligations.
        </p>

        <h2 className="mb-2 mt-4 text-xl font-semibold">
          7. Third-Party Services
        </h2>
        <p className="mb-4">
          Our Service may integrate with third-party services. Their privacy
          practices are governed by their policies.
        </p>

        <h2 className="mb-2 mt-4 text-xl font-semibold">
          8. Changes to This Privacy Policy
        </h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes by posting a notice on our website or via
          email.
        </p>

        <h2 className="mb-2 mt-4 text-xl font-semibold">9. Contact Us</h2>
        <p className="mb-4">
          If you have any questions or concerns, contact us at:
        </p>
        <p className="mb-4">Email: support@heygaia.so</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
