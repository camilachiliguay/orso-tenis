"use client";

import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
import { changePassword } from "@/services/authService";

const EMPTY_FORM = { current: "", next: "", confirm: "" };
const INPUT =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]";

export default function CambiarPasswordPage() {
  const { user, loading } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (form.next !== form.confirm) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    try {
      setSaving(true);
      await changePassword(form.current, form.next);
      setForm(EMPTY_FORM);
      setSuccess("Tu contraseña se actualizó correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-3xl font-bold">Cambiar contraseña</h1>
        <p className="mb-6 text-gray-600">
          Ingresá tu contraseña actual y elegí una nueva de al menos 8
          caracteres.
        </p>

        {loading ? (
          <p className="py-6 text-gray-500">Cargando...</p>
        ) : !user ? (
          <div className="rounded-2xl border border-[#263B1C]/10 bg-white p-6 shadow-sm">
            <p className="mb-4">Iniciá sesión para cambiar tu contraseña.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[#263B1C] px-5 py-3 font-semibold text-white hover:bg-[#65913C]"
            >
              Ingresar
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
              >
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-[#263B1C]/10 bg-white p-6 shadow-sm"
            >
              <div>
                <label
                  htmlFor="current"
                  className="mb-2 block text-sm font-semibold"
                >
                  Contraseña actual
                </label>
                <input
                  id="current"
                  name="current"
                  type="password"
                  autoComplete="current-password"
                  value={form.current}
                  onChange={handleChange}
                  required
                  className={INPUT}
                />
              </div>

              <div>
                <label
                  htmlFor="next"
                  className="mb-2 block text-sm font-semibold"
                >
                  Nueva contraseña
                </label>
                <input
                  id="next"
                  name="next"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  value={form.next}
                  onChange={handleChange}
                  required
                  className={INPUT}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="mb-2 block text-sm font-semibold"
                >
                  Repetir nueva contraseña
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  className={INPUT}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </form>

            <p className="mt-4 text-sm">
              <Link
                href="/perfil"
                className="font-semibold text-[#65913C] hover:underline"
              >
                &larr; Volver a mi perfil
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
