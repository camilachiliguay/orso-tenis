"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import CourtsManagement from "@/components/admin/CourtsManagement";

export default function AdminCourtsPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    } else if (!isAdmin) {
      router.replace("/reservas");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return <p className="p-6">Verificando acceso...</p>;
  }

  return (
    <main className="min-h-screen bg-[#F7F7F2] p-6 text-[#263B1C]">
      <div className="mx-auto max-w-6xl">
        <CourtsManagement />
      </div>
    </main>
  );
}
