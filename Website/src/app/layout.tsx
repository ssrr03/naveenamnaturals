import type { Metadata } from "next";
import "@/styles/styles.scss";
import GlobalProvider from "./GlobalProvider";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PageLoaderWrapper from "@/components/Common/PageLoaderWrapper";
import LazyModals from "@/components/Common/LazyModals";

import { Toaster } from "react-hot-toast";
import GlobalBackground from "@/components/Common/GlobalBackground";
import NavigationEvents from "@/components/Common/NavigationEvents";
import { Suspense } from "react";
import BottomNav from "@/components/Header/BottomNav/BottomNav";

export const metadata: Metadata = {
  title: "Naveenam Naturals",
  description:
    "Naveenam Naturals — Pure, Natural & Handcrafted Skincare Products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GlobalProvider>
          <PageLoaderWrapper />
          <Suspense fallback={null}>
            <NavigationEvents />
          </Suspense>
          <GlobalBackground />
          {children}
          <BottomNav />
          <LazyModals />
          <ScrollToTop />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--surface)",
                color: "var(--secondary)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px var(--outline)",
              },
              success: {
                iconTheme: {
                  primary: "var(--success)",
                  secondary: "var(--surface)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--red)",
                  secondary: "var(--surface)",
                },
              },
            }}
          />
        </GlobalProvider>
      </body>
    </html>
  );
}
