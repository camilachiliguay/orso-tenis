"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { register } from "@/services/authService";

export default function RegistroPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setSaving(true);

      await register({
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      setRegistered(true);
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setSaving(false);
    }
  };

  if (registered) {
    return (
      <main className="px-4 py-10 text-[#263B1C]">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-bold">
            ¡Cuenta creada correctamente!
          </h1>

          <p className="mb-6 text-gray-600">
            Tu registro en Orso Tenis fue exitoso. Ya podés iniciar sesión.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C]"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-3xl font-bold">Crear cuenta</h1>

        <p className="mb-6 text-gray-600">
          Registrate en Orso Tenis para disfrutar de nuestros servicios.
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
            <label
              htmlFor="first_name"
              className="mb-2 block text-sm font-semibold"
            >
              Nombre
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              value={formData.first_name}
              onChange={handleChange}
              maxLength={100}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="mb-2 block text-sm font-semibold"
            >
              Apellido
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              value={formData.last_name}
              onChange={handleChange}
              maxLength={100}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              maxLength={150}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              maxLength={30}
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
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
            <p className="mt-1 text-xs text-gray-500">
              Debe tener entre 8 y 72 caracteres.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="mb-2 block text-sm font-semibold"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              value={formData.confirm_password}
              onChange={handleChange}
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          ¿Ya tenés una cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#65913C] hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
