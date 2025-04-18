import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review GAIA's Terms of Service to understand your rights, responsibilities, and limitations while using our AI assistant services.",
  openGraph: {
    title: "Terms of Service",
    description:
      "Review GAIA's Terms of Service to understand your rights, responsibilities, and limitations while using our AI assistant services.",
    url: "https://heygaia.io/terms",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - AI Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service",
    description:
      "Review GAIA's Terms of Service to understand your rights, responsibilities, and limitations while using our AI assistant services.",
    images: ["/landing/screenshot.webp"],
  },
  keywords: [
    "GAIA",
    "Terms of Service",
    "AI Assistant",
    "User Agreement",
    "Service Terms",
    "Legal Policy",
  ],
};

const TermsOfService = () => {
  return (
    <div className="flex w-screen flex-col items-center justify-center">
      <div className="privacy-policy max-w-(--breakpoint-xl) p-6 pt-24">
        <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
        <p className="mb-4 text-sm">Effective Date: 1st Feb 2025</p>
        <p className="mb-4">
          Welcome to GAIA (“we,” “us,” or “our”). By accessing or using our AI
          assistant services (the “Service”), you agree to comply with these
          Terms of Service. Please read them carefully.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          1. Acceptance of Terms
        </h2>
        <p className="mb-4">
          By using the Service, you agree to these Terms of Service, our Privacy
          Policy, and any additional terms provided for specific features. If
          you do not agree, do not use the Service.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">2. Eligibility</h2>
        <p className="mb-4">
          By using the Service, you confirm that you have the legal capacity to
          enter into agreements in your jurisdiction.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          3. Account Responsibilities
        </h2>
        <ul className="mb-4 ml-6 list-disc">
          <li>
            You are responsible for maintaining the confidentiality of your
            account credentials.
          </li>
          <li>
            You agree to provide accurate and complete information during
            account creation.
          </li>
          <li>
            You are responsible for all activity that occurs under your account.
          </li>
        </ul>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          4. Prohibited Activities
        </h2>
        <p className="mb-4">When using the Service, you agree not to:</p>
        <ul className="mb-4 ml-6 list-disc">
          <li>Violate any applicable laws or regulations.</li>
          <li>Submit false, offensive, or harmful content.</li>
          <li>Use the Service for unauthorized or illegal purposes.</li>
          <li>
            Attempt to disrupt the Service, including through hacking or
            introducing malicious code.
          </li>
        </ul>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          5. Features and Payments
        </h2>
        <ul className="mb-4 ml-6 list-disc">
          <li>
            Free Features: We offer certain features of the Service free of
            charge.
          </li>
          <li>
            Paid Features: Some advanced features and functionalities may
            require a paid subscription or one-time payment.
          </li>
          <li>
            By purchasing paid features, you agree to pay the applicable fees.
            Failure to pay may result in loss of access to those features.
          </li>
          <li>Refunds are subject to our discretion unless required by law.</li>
        </ul>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          6. Intellectual Property
        </h2>
        <p className="mb-4">
          All content, trademarks, and technology in the Service are owned by
          GAIA or our licensors. You may not reproduce, distribute, or create
          derivative works without our written consent.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          7. User Data and Input
        </h2>
        <p className="mb-4">
          By using the Service, you grant us a non-exclusive license to process
          and analyze your submitted data (e.g., text, files) solely for
          providing the Service. You retain ownership of your data.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">8. Termination</h2>
        <p className="mb-4">
          We reserve the right to suspend or terminate your access to the
          Service at our sole discretion, without prior notice, if you violate
          these Terms or misuse the Service.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">9. Disclaimers</h2>
        <ul className="mb-4 ml-6 list-disc">
          <li>
            The Service is provided "as is" and "as available," without
            warranties of any kind.
          </li>
          <li>
            We do not guarantee uninterrupted or error-free operation of the
            Service.
          </li>
          <li>
            We are not liable for any data loss or damages arising from your use
            of the Service.
          </li>
        </ul>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          10. Limitation of Liability
        </h2>
        <p className="mb-4">
          To the maximum extent permitted by law, GAIA is not liable for any
          indirect, incidental, or consequential damages, including loss of
          data, revenue, or profits, arising from the use of the Service.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">
          11. Modifications to the Terms
        </h2>
        <p className="mb-4">
          We reserve the right to update or modify these Terms at any time.
          Significant changes will be communicated via email or a notice on our
          website. Continued use of the Service constitutes acceptance of the
          updated Terms.
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">12. Governing Law</h2>
        <p className="mb-4">
          These Terms are governed by the laws of [Insert Jurisdiction]. Any
          disputes will be resolved exclusively in the courts of [Insert
          Jurisdiction].
        </p>

        <h2 className="mt-6 mb-2 text-xl font-semibold">13. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us:
          <br />
          Email:{" "}
          <a
            className="text-blue-500 underline"
            href="mailto:support@heygaia.so"
          >
            support@heygaia.so
          </a>
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
