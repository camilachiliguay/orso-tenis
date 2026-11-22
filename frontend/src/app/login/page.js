"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setSaving(true);

      const loggedUser = await login(email, password);

      if (loggedUser.role === "admin") {
        router.push("/admin/dashboard");
      } else if (loggedUser.role === "staff") {
        router.push("/");
      } else {
        router.push("/reservas");
      }
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-3xl font-bold">Ingresar</h1>
        <p className="mb-6 text-gray-600">
          Iniciá sesión para reservar canchas o administrar jugadores.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          Usuarios de prueba: <strong>admin@orsotenis.com</strong> / admin123
          (administrador) y <strong>juan@gmail.com</strong> / player123
          (jugador).
        </p>
      </div>
    </main>
  );
}
