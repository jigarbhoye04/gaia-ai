// SF Pro Display and SF Pro Text font configurations
import localFont from "next/font/local";

// SF Pro Display Variable Font
export const sfProDisplay = localFont({
  src: [
    {
      path: "./sf/SF Pro Display Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Regular Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Display Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Medium Italic.woff",
      weight: "500",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Display Semibold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Bold Italic.woff",
      weight: "700",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Display Black.woff",
      weight: "900",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Black Italic.woff",
      weight: "900",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Display Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Light Italic.woff",
      weight: "300",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Display Thin.woff",
      weight: "100",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Thin Italic.woff",
      weight: "100",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Display Ultralight.woff",
      weight: "200",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Heavy.woff",
      weight: "800",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Display Heavy Italic.woff",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-sf-pro-display",
  display: "swap",
});

// SF Pro Text Variable Font
export const sfProText = localFont({
  src: [
    {
      path: "./sf/SF Pro Text Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Text Regular Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Text RegularItalic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Text Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Text Medium Italic.woff",
      weight: "500",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Text Semibold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Text Semibold Italic.woff",
      weight: "600",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Text Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Text Bold Italic.woff",
      weight: "700",
      style: "italic",
    },
    {
      path: "./sf/SF Pro Text Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "./sf/SF Pro Text Light Italic.woff",
      weight: "300",
      style: "italic",
    },
  ],
  variable: "--font-sf-pro-text",
  display: "swap",
});
