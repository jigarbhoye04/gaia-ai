// Creato font configuration
import localFont from "next/font/local";

// Creato Display Font
export const creato = localFont({
  src: [
    {
      path: "./creato/CreatoDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./creato/CreatoDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./creato/CreatoDisplay-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-creato",
  display: "swap",
});
