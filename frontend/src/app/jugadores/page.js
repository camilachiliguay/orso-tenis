"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";
import {
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "@/services/playerService";

// Tiene que coincidir con la lista CATEGORIES del backend (playerController.js).
const CATEGORIES = ["Principiante", "Intermedio", "Avanzado"];

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  category: "",
  photo: "",
  is_student: "null",
};
// Achica la foto a 300 px (JPEG) para que pese poco antes de enviarla.
const resizeImage = (file, maxSize = 300) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(new Error("El archivo no es una imagen válida."));
      image.onload = () => {
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });

/* ====================================================================
   VISTA DEL ADMIN / STAFF: listado completo y alta, edición y baja
   ==================================================================== */
function ManagePlayers() {
  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // LEER: obtener el listado
  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPlayers();
      setPlayers(data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los jugadores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
    setMessage("");
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const photo = await resizeImage(file);
      setFormData((previous) => ({ ...previous, photo }));
      setError("");
    } catch (err) {
      setError(err.message || "No se pudo procesar la foto.");
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    resetForm();
    setError("");
    setMessage("");
  };

  // ESCRIBIR / MODIFICAR
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError("Completá el nombre y el apellido.");
      return;
    }

    const wasEditing = Boolean(editingId);
    const playerData = {
      ...formData,
      is_student:
        formData.is_student === "null" ? null : Number(formData.is_student),
    };
    try {
      setSaving(true);

      if (wasEditing) {
        await updatePlayer(editingId, playerData);
      } else {
        await createPlayer(playerData);
      }

      resetForm();
      setMessage(
        wasEditing
          ? "Jugador actualizado correctamente."
          : "Jugador creado correctamente.",
      );

      await loadPlayers();
    } catch (err) {
      setError(err.message || "No se pudo guardar el jugador.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (player) => {
    setEditingId(player.id);

    setFormData({
      first_name: player.first_name,
      last_name: player.last_name,
      category: player.category || "",
      photo: player.photo || "",
      is_student:
        player.is_student === null ? "null" : String(player.is_student),
    });

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ELIMINAR
  const handleDelete = async (player) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `¿Eliminar a ${player.first_name} ${player.last_name}? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(player.id);
      setError("");
      setMessage("");

      await deletePlayer(player.id);

      if (editingId === player.id) resetForm();

      setMessage("Jugador eliminado correctamente.");
      await loadPlayers();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el jugador.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
        >
          {message}
        </div>
      )}

      {/* Formulario */}
      <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            {editingId ? "Editar jugador" : "Nuevo jugador"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
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
                value={formData.first_name}
                onChange={handleChange}
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
                maxLength={50}
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold"
              >
                Categoría
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#65913C]"
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="is_student"
                className="mb-2 block text-sm font-semibold"
              >
                Condición de alumno
              </label>

              <select
                id="is_student"
                name="is_student"
                value={formData.is_student}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#65913C]"
              >
                <option value="null">Pendiente de verificar</option>
                <option value="1">Alumno</option>
                <option value="0">No es alumno</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              photo={formData.photo}
              firstName={formData.first_name}
              lastName={formData.last_name}
              size="h-16 w-16"
            />

            <div>
              <label
                htmlFor="photo"
                className="mb-2 block text-sm font-semibold"
              >
                Foto
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block text-sm"
              />
            </div>

            {formData.photo && (
              <button
                type="button"
                onClick={() =>
                  setFormData((previous) => ({ ...previous, photo: "" }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Quitar foto
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : editingId
                  ? "Actualizar jugador"
                  : "Agregar jugador"}
            </button>
          </div>
        </form>
      </section>

      {/* Listado */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Jugadores registrados</h2>

          <button
            type="button"
            onClick={loadPlayers}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Actualizar listado
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-gray-500">Cargando jugadores...</p>
        ) : players.length === 0 ? (
          <p className="py-6 text-gray-500">
            Todavía no hay jugadores registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-3">Foto</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Apellido</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3">Reservas</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {players.map((player) => {
                  const hasReservations = player.reservations_count > 0;

                  return (
                    <tr key={player.id} className="border-b border-gray-100">
                      <td className="px-3 py-3">
                        <Avatar
                          photo={player.photo}
                          firstName={player.first_name}
                          lastName={player.last_name}
                        />
                      </td>
                      <td className="px-3 py-4">{player.first_name}</td>
                      <td className="px-3 py-4">{player.last_name}</td>
                      <td className="px-3 py-4">{player.category || "-"}</td>
                      <td className="px-3 py-4">{player.reservations_count}</td>

                      <td className="px-3 py-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(player)}
                            className="font-semibold text-[#65913C] hover:underline"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(player)}
                            disabled={hasReservations || deletingId !== null}
                            title={
                              hasReservations
                                ? "No se puede eliminar: tiene reservas registradas"
                                : undefined
                            }
                            className="font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
                          >
                            {deletingId === player.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ====================================================================
   PÁGINA (solo administradores y staff)
   ==================================================================== */
export default function JugadoresPage() {
  const { user, loading, canManage } = useAuth();

  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Jugadores</h1>

          <p className="mt-2 text-gray-600">
            Agregá, modificá o eliminá los jugadores del club.
          </p>
        </header>

        {loading ? (
          <p className="py-6 text-gray-500">Cargando...</p>
        ) : !user ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4">Iniciá sesión para acceder a esta sección.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[#263B1C] px-5 py-3 font-semibold text-white hover:bg-[#65913C]"
            >
              Ingresar
            </Link>
          </div>
        ) : canManage ? (
          <ManagePlayers />
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4">
              Esta sección es solo para el personal del club. Tus datos los
              encontrás en tu perfil.
            </p>
            <Link
              href="/perfil"
              className="inline-block rounded-lg bg-[#263B1C] px-5 py-3 font-semibold text-white hover:bg-[#65913C]"
            >
              Ir a mi perfil
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
