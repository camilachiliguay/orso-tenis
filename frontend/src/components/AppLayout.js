"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppLayout({ children }) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  // El panel administrativo tiene su propio diseño y navegación.
  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />

      <main className="w-full flex-1">{children}</main>

      <Footer />
    </div>
  );
}
