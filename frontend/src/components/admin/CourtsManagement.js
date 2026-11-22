"use client";

import { useCallback, useEffect, useState } from "react";
import { getCourts, updateCourtStatus } from "@/services/courtService";

export default function CourtsManagement() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const fetchCourts = useCallback(async () => {
    try {
      setError("");
      const data = await getCourts();
      setCourts(data);
    } catch (error) {
      setError(error.message || "No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const handleDisable = async (event) => {
    event.preventDefault();

    const finalReason = reason === "Otro" ? customReason.trim() : reason;

    if (!finalReason || !selectedCourt) return;

    try {
      setSavingId(selectedCourt.id);
      setError("");

      await updateCourtStatus(selectedCourt.id, {
        is_active: false,
        disabled_reason: finalReason,
      });

      setSelectedCourt(null);
      setReason("");
      setCustomReason("");
      await fetchCourts();
    } catch (error) {
      setError(error.message || "No se pudo deshabilitar la cancha.");
    } finally {
      setSavingId(null);
    }
  };

  const handleEnable = async (court) => {
    try {
      setSavingId(court.id);
      setError("");

      await updateCourtStatus(court.id, {
        is_active: true,
      });

      await fetchCourts();
    } catch (error) {
      setError(error.message || "No se pudo habilitar la cancha.");
    } finally {
      setSavingId(null);
    }
  };

  const activeCount = courts.filter((court) => Boolean(court.is_active)).length;

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Gestión de canchas</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administrá la disponibilidad de las canchas del club.
          </p>
        </div>

        <span className="rounded-full bg-[#65913C]/10 px-4 py-2 text-sm font-semibold text-[#263B1C]">
          {activeCount} de {courts.length} habilitadas
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Cargando canchas...</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {courts.map((court) => {
            const active = Boolean(court.is_active);

            return (
              <article
                key={court.id}
                className="rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{court.name}</h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {active ? "Habilitada" : "Deshabilitada"}
                  </span>
                </div>

                {!active && court.disabled_reason && (
                  <p className="mt-3 text-sm text-gray-500">
                    Motivo: {court.disabled_reason}
                  </p>
                )}

                {active ? (
                  <button
                    type="button"
                    disabled={savingId !== null}
                    onClick={() => {
                      setSelectedCourt(court);
                      setReason("");
                      setCustomReason("");
                    }}
                    className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Deshabilitar cancha
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={savingId !== null}
                    onClick={() => handleEnable(court)}
                    className="mt-4 w-full rounded-xl bg-[#263B1C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#65913C] disabled:opacity-50"
                  >
                    {savingId === court.id
                      ? "Procesando..."
                      : "Habilitar cancha"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleDisable}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold">
              Deshabilitar {selectedCourt.name}
            </h3>

            <label className="mt-5 block text-sm font-semibold">Motivo</label>

            <select
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 p-3"
            >
              <option value="">Seleccionar motivo</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Reparación">Reparación</option>
              <option value="Clima">Clima</option>
              <option value="Evento">Evento</option>
              <option value="Otro">Otro</option>
            </select>

            {reason === "Otro" && (
              <textarea
                required
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Escribí el motivo..."
                className="mt-3 w-full rounded-xl border border-gray-300 p-3"
              />
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={savingId !== null}
                onClick={() => setSelectedCourt(null)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  !reason ||
                  (reason === "Otro" && !customReason.trim()) ||
                  savingId !== null
                }
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingId === selectedCourt.id ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
