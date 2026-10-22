import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOIRÉ Eau de Parfum | Cash On Delivery in Nepal",
  description: "Discover NOIRÉ Eau de Parfum—a warm blend of bergamot, amber, and sandalwood. Order 50 ml with Cash On Delivery across Nepal.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
