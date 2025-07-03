// Switzer font configuration
import localFont from "next/font/local";

// Switzer Variable Font
export const switzer = localFont({
  src: [
    {
      path: "./switzer/Switzer-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-switzer",
  display: "swap",
});
