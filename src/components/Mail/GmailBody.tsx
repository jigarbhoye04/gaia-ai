import { EmailData } from "@/types/mailTypes";
import { Spinner } from "@heroui/spinner";
import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef, useState } from "react";

export const decodeBase64 = (str: string): string => {
  try {
    const decoded = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    return decodeURIComponent(escape(decoded)); // Ensures proper UTF-8 decoding
  } catch (error) {
    console.error("Error decoding Base64 string:", error);
    return "";
  }
};

export default function GmailBody({ email }: { email: EmailData | null }) {
  if (!email) return null;
  const [loading, setLoading] = useState(true);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);

  const decodedHtml = useMemo(() => {
    const htmlPart = email.payload.parts?.find(
      (p: { mimeType: string; body: { data: string } }) =>
        p.mimeType === "text/html"
    )?.body?.data;

    if (htmlPart) return decodeBase64(htmlPart);
    if (email.payload.body?.data) return decodeBase64(email.payload.body.data);
    return null;
  }, [email]);
  const sanitizedHtml = useMemo(() => {
    return decodedHtml
      ? DOMPurify.sanitize(decodedHtml, {
        ADD_ATTR: ["target"],
        ADD_TAGS: ["iframe"],
      })
      : null;
  }, [decodedHtml]);

  useEffect(() => {
    if (!sanitizedHtml) {
      setLoading(false);
      return;
    }

    if (shadowHostRef.current) {
      const shadowRoot =
        shadowHostRef.current.shadowRoot ||
        shadowHostRef.current.attachShadow({ mode: "open" });

      shadowRoot.innerHTML = "";

      const contentWrapper = document.createElement("div");
      contentWrapper.innerHTML = sanitizedHtml;

      shadowRoot.appendChild(contentWrapper);
      setLoading(false);
    }
  }, [sanitizedHtml]);

  return (
    <div className="shadow-md relative overflow-auto w-full">
      {loading && (
        <div className="h-full w-full z-10 absolute inset-0 flex justify-center items-start p-10 backdrop-blur-3xl bg-black/90">
          <Spinner color="primary" className="z-[11]" size="lg" />
        </div>
      )}
      <div ref={shadowHostRef} className="p-4 w-full bg-white text-black" />
    </div>
  );
}
