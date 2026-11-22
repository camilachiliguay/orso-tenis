"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";
import { getMyProfile, updateMyProfile } from "@/services/playerService";

const ROLE_LABELS = {
  admin: "Administrador",
  staff: "Staff",
  player: "Jugador",
};

// "2026-11-11 18:36:51" -> "11/11/2026"
const formatDate = (value) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : null;

const studentLabel = (isStudent) => {
  if (isStudent === 1 || isStudent === true) {
    return "Alumno";
  }

  if (isStudent === 0 || isStudent === false) {
    return "No es alumno";
  }

  return "Pendiente de verificar";
};

const CARD = "rounded-2xl border border-[#263B1C]/10 bg-white p-6 shadow-sm";
const INPUT =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C] disabled:bg-gray-100 disabled:text-gray-500";

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

// Espacio preparado para la actividad deportiva. No hay datos de torneos ni
// estadísticas en la base todavía, así que se muestra un estado vacío.
function EmptyActivity({ title, message }) {
  return (
    <div className="rounded-xl border border-dashed border-[#263B1C]/25 bg-[#F7F7F2] p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  );
}

function ProfileContent({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      const result = await getMyProfile();
      setData(result.player);
    } catch (err) {
      setError(err.message || "No se pudo cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const startEditing = () => {
    setForm({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || "",
    });
    setFormError("");
    setMessage("");
    setEditing(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError("Completá tu nombre y tu apellido.");
      return;
    }

    try {
      setSaving(true);
      await updateMyProfile(form);
      await loadProfile();
      setEditing(false);
      setMessage("Tus datos se actualizaron correctamente.");
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="py-6 text-gray-500">Cargando tu perfil...</p>;

  // Usuarios sin ficha de jugador (por ejemplo el administrador).
  if (error || !data) {
    return (
      <div className="space-y-6">
        <div
          role="alert"
          className="rounded-lg border border-[#EBCB43]/60 bg-[#EBCB43]/15 p-4 text-[#263B1C]"
        >
          {error}
        </div>

        <section className={CARD}>
          <h2 className="mb-4 text-xl font-bold">Mi cuenta</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Correo electrónico">{user.email}</Field>
            <Field label="Rol">{ROLE_LABELS[user.role] || user.role}</Field>
          </dl>
        </section>
      </div>
    );
  }

  const registeredAt = formatDate(data.created_at);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <section className="flex flex-wrap items-center gap-5 rounded-2xl bg-[#263B1C] p-6 text-white shadow-sm">
        <Avatar
          photo={data.photo}
          firstName={data.first_name}
          lastName={data.last_name}
          size="h-24 w-24 text-2xl ring-4 ring-[#EBCB43]"
          placeholderClass="bg-white/15 text-white"
        />

        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold">
            {data.first_name} {data.last_name}
          </h2>
          <p className="mt-1 truncate text-white/80">{data.email}</p>

          <span className="mt-3 inline-block rounded-full bg-[#EBCB43] px-3 py-1 text-sm font-semibold text-[#263B1C]">
            {data.category || "Sin categoría"}
          </span>
        </div>
      </section>

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
        >
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* A. Datos personales */}
        <section className={CARD} aria-labelledby="datos-personales">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="datos-personales" className="text-xl font-bold">
              Datos personales
            </h2>

            {!editing && (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg bg-[#263B1C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#65913C]"
              >
                Editar perfil
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

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
                  maxLength={50}
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  className={INPUT}
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
                  maxLength={50}
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  className={INPUT}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={data.email}
                  disabled
                  className={INPUT}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Es el correo con el que ingresás, por eso no se puede
                  modificar acá.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ej: 351 123 4567"
                  className={INPUT}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">{data.first_name}</Field>
              <Field label="Apellido">{data.last_name}</Field>
              <Field label="Correo electrónico">
                <span className="break-all">{data.email}</span>
              </Field>
              <Field label="Teléfono">
                {data.phone || (
                  <span className="font-normal text-gray-500">No cargado</span>
                )}
              </Field>
            </dl>
          )}
        </section>

        {/* B. Información deportiva */}
        <section className={CARD} aria-labelledby="info-deportiva">
          <h2 id="info-deportiva" className="mb-5 text-xl font-bold">
            Información deportiva
          </h2>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              {data.category || (
                <span className="font-normal text-gray-500">Sin categoría</span>
              )}
            </Field>
            <Field label="Condición">{studentLabel(data.is_student)}</Field>
            {registeredAt && (
              <Field label="Miembro desde">{registeredAt}</Field>
            )}
          </dl>

          <p className="mt-6 text-sm text-gray-500">
            Si algún dato deportivo no es correcto, comunicate con el club.
          </p>
        </section>
      </div>

      {/* C. Mi actividad */}
      <section className={CARD} aria-labelledby="mi-actividad">
        <h2 id="mi-actividad" className="mb-1 text-xl font-bold">
          Mi actividad
        </h2>
        <p className="mb-5 text-sm text-gray-600">
          Acá vas a ver tu actividad deportiva cuando haya información
          disponible.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <EmptyActivity
            title="Torneos inscriptos"
            message="Todavía no estás inscripto en ningún torneo."
          />
          <EmptyActivity
            title="Torneos disputados"
            message="Todavía no hay torneos disputados registrados."
          />
          <EmptyActivity
            title="Estadísticas deportivas"
            message="Aún no hay datos suficientes para mostrar estadísticas."
          />
        </div>
      </section>
    </div>
  );
}

export default function PerfilPage() {
  const { user, loading } = useAuth();

  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Mi perfil</h1>
          <p className="mt-2 text-gray-600">
            Tus datos personales y tu información deportiva.
          </p>
        </header>

        {loading ? (
          <p className="py-6 text-gray-500">Cargando...</p>
        ) : !user ? (
          <div className={CARD}>
            <p className="mb-4">Iniciá sesión para ver tu perfil.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[#263B1C] px-5 py-3 font-semibold text-white hover:bg-[#65913C]"
            >
              Ingresar
            </Link>
          </div>
        ) : (
          <ProfileContent user={user} />
        )}
      </div>
    </main>
  );
}
