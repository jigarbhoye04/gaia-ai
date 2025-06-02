import EmailComposeCard from "@/features/mail/components/EmailComposeCard";
import { EmailComposeData } from "@/types/features/convoTypes";

export default function EmailComposeSection({
  email_compose_data,
}: {
  email_compose_data: EmailComposeData;
}) {
  if (!email_compose_data.subject || !email_compose_data.body) {
    return (
      <div className="p-3 text-red-500">
        Error: Could not create email. Please try again later.
      </div>
    );
  }

  const handleEmailSent = () => {
    // Optional: Add any post-send logic here
    console.log("Email sent from chat bubble");
  };

  return (
    <div className="mt-3">
      <EmailComposeCard
        emailData={email_compose_data}
        onSent={handleEmailSent}
      />
    </div>
  );
}
