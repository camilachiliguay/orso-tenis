"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Link from "next/link";
import {
  getReservations,
  getAvailableSlots,
  getAvailableDates,
  getReservationPrice,
  createReservation,
  updateReservation,
  cancelReservation,
  getReceiptUrl,
  deleteReservation,
} from "@/services/reservationService";
import { getPlayers } from "@/services/playerService";

const DEFAULT_COURT_ID = "1";
const DATES_RANGE_DAYS = 90;

// Devuelve la fecha actual de Argentina (YYYY-MM-DD).
// Se ejecuta solamente desde el navegador, dentro de useEffect.
const getToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const createInitialFormData = (date = "") => ({
  player_id: "",
  court_id: DEFAULT_COURT_ID,
  reservation_date: date,
  start_time: "",
  end_time: "",
  uses_lights: "0",
});

// Formatear la fecha para mostrarla en pantalla.
// OJO: si la API devuelve un ISO con hora UTC, confirmá que no haya corrimiento de día.
const formatDate = (date) => {
  if (!date) return "";

  const dateString = String(date).slice(0, 10);
  const [year, month, day] = dateString.split("-");

  return `${day}/${month}/${year}`;
};

// Formatear la hora para mostrarla.
const formatTime = (time) => String(time || "").slice(0, 5);

export default function ReservasPage() {
  // ---------------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------------
  const [today, setToday] = useState("");

  const [reservations, setReservations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  const [formData, setFormData] = useState(createInitialFormData());
  const [reservationPrice, setReservationPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { isAdmin } = useAuth();
  const [editingId, setEditingId] = useState(null);
  // Datos originales de la reserva que se está editando.
  const [originalReservation, setOriginalReservation] = useState(null);

  const [error, setError] = useState("");
  const [datesError, setDatesError] = useState("");
  const [slotsError, setSlotsError] = useState("");
  const [message, setMessage] = useState("");

  // Se incrementa para forzar la recarga de fechas y horarios
  // (después de crear, editar o cancelar una reserva).
  const [refreshKey, setRefreshKey] = useState(0);

  // Ref para que el efecto de fechas sepa si hay una edición en curso
  // sin tener que volver a ejecutarse cuando cambia editingId.
  const editingIdRef = useRef(null);

  const availabilityError = datesError || slotsError;
  useEffect(() => {
    if (!formData.player_id) {
      setReservationPrice(null);
      setPriceError("");
      setLoadingPrice(false);
      return;
    }

    let cancelled = false;

    const loadPrice = async () => {
      try {
        setLoadingPrice(true);
        setPriceError("");
        setReservationPrice(null);

        const data = await getReservationPrice(
          formData.player_id,
          formData.uses_lights,
        );

        if (!cancelled) {
          setReservationPrice(data.price_applied);
        }
      } catch (error) {
        if (!cancelled) {
          setPriceError(error.message);
          setReservationPrice(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPrice(false);
        }
      }
    };

    loadPrice();

    return () => {
      cancelled = true;
    };
  }, [formData.player_id, formData.uses_lights]);
  // ---------------------------------------------------------------------
  // Efectos
  // ---------------------------------------------------------------------

  // Obtener la fecha actual después del montaje del componente.
  // La fecha seleccionada la define el efecto de fechas disponibles.
  useEffect(() => {
    setToday(getToday());
  }, []);

  // Obtener todas las reservas.
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getReservations();
      setReservations(data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Obtener los jugadores para el selector.
  const loadPlayers = useCallback(async () => {
    try {
      const data = await getPlayers();
      setPlayers(data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los jugadores");
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Obtener las fechas habilitadas según la cancha.
  useEffect(() => {
    if (!today || !formData.court_id) return;

    let cancelled = false;

    const loadAvailableDates = async () => {
      try {
        setLoadingDates(true);
        setDatesError("");

        const data = await getAvailableDates(
          today,
          formData.court_id,
          DATES_RANGE_DAYS,
        );

        if (cancelled) return;

        const dates = data?.dates || [];
        setAvailableDates(dates);

        // Mientras se edita no se pisa la fecha elegida.
        if (editingIdRef.current) return;

        // Si la fecha elegida no está habilitada, seleccionar la primera.
        setFormData((previous) => {
          if (dates.includes(previous.reservation_date)) return previous;

          return {
            ...previous,
            reservation_date: dates[0] || "",
            start_time: "",
            end_time: "",
          };
        });
      } catch (err) {
        if (cancelled) return;
        setAvailableDates([]);
        setDatesError(err.message || "No se pudieron cargar las fechas");
      } finally {
        if (!cancelled) setLoadingDates(false);
      }
    };

    loadAvailableDates();

    return () => {
      cancelled = true;
    };
  }, [today, formData.court_id, refreshKey]);

  // Obtener los horarios disponibles según la fecha y la cancha.
  useEffect(() => {
    if (!formData.reservation_date || !formData.court_id) {
      setAvailableSlots([]);
      setSlotsError("");
      return;
    }

    let cancelled = false;

    const loadAvailableSlots = async () => {
      try {
        setLoadingSlots(true);
        setSlotsError("");

        // El tercer parámetro permite al backend excluir la reserva
        // que se está editando (si lo soporta).
        const data = await getAvailableSlots(
          formData.reservation_date,
          formData.court_id,
          editingId,
        );

        if (!cancelled) setAvailableSlots(data?.slots || []);
      } catch (err) {
        if (cancelled) return;
        setAvailableSlots([]);
        setSlotsError(err.message || "No se pudieron cargar los horarios");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };

    loadAvailableSlots();

    return () => {
      cancelled = true;
    };
  }, [formData.reservation_date, formData.court_id, editingId, refreshKey]);

  // ---------------------------------------------------------------------
  // Datos derivados
  // ---------------------------------------------------------------------

  // Fechas que muestra el calendario. Al editar se incluye la fecha original
  // de la reserva aunque ya no figure como habilitada.
  const calendarDates = useMemo(() => {
    const dates = new Set(availableDates);

    if (
      originalReservation &&
      String(originalReservation.court_id) === String(formData.court_id)
    ) {
      dates.add(originalReservation.reservation_date);
    }

    return [...dates].sort();
  }, [availableDates, originalReservation, formData.court_id]);

  // Horarios del selector. Al editar se conserva el horario actual de la
  // reserva (si coincide fecha y cancha) para poder volver a elegirlo.
  const slotOptions = useMemo(() => {
    const options = [...availableSlots];

    if (
      originalReservation &&
      String(originalReservation.court_id) === String(formData.court_id) &&
      originalReservation.reservation_date === formData.reservation_date &&
      !options.some(
        (slot) => slot.slot_start === originalReservation.start_time,
      )
    ) {
      options.push({
        id: "current",
        slot_start: originalReservation.start_time,
        slot_end: originalReservation.end_time,
        isCurrent: true,
      });
      options.sort((a, b) => String(a.slot_start).localeCompare(b.slot_start));
    }

    return options;
  }, [
    availableSlots,
    originalReservation,
    formData.court_id,
    formData.reservation_date,
  ]);

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  // Actualizar los campos del formulario.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "court_id" || name === "reservation_date"
        ? { start_time: "", end_time: "" }
        : {}),
    }));

    clearFeedback();
  };

  // Seleccionar una fecha en el calendario.
  const handleDateChange = (date) => {
    setFormData((previous) => ({
      ...previous,
      reservation_date: date,
      start_time: "",
      end_time: "",
    }));

    clearFeedback();
  };

  // Seleccionar un horario disponible.
  const handleSlotChange = (event) => {
    const selectedStartTime = event.target.value;

    const selectedSlot = slotOptions.find(
      (slot) => slot.slot_start === selectedStartTime,
    );

    setFormData((previous) => ({
      ...previous,
      start_time: selectedSlot ? selectedSlot.slot_start : "",
      end_time: selectedSlot ? selectedSlot.slot_end : "",
    }));
  };

  // Limpiar el formulario. No toca los mensajes de éxito o error.
  const resetForm = () => {
    editingIdRef.current = null;
    setEditingId(null);
    setOriginalReservation(null);

    // Si la cancha no cambia, el efecto de fechas no se vuelve a ejecutar,
    // así que se elige acá la primera fecha habilitada.
    const keepsSameCourt = formData.court_id === DEFAULT_COURT_ID;
    setFormData(
      createInitialFormData(keepsSameCourt ? availableDates[0] || "" : ""),
    );
  };

  // Botones "Limpiar" y "Cancelar edición": además limpian los mensajes.
  const handleResetClick = () => {
    resetForm();
    clearFeedback();
  };

  // Crear o actualizar una reserva.
  const handleSubmit = async (event) => {
    event.preventDefault();

    clearFeedback();

    if (
      !formData.player_id ||
      !formData.court_id ||
      !formData.reservation_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
      setError("Completá todos los campos para continuar.");
      return;
    }

    if (!calendarDates.includes(formData.reservation_date)) {
      setError("La fecha elegida no está habilitada para esta cancha.");
      return;
    }

    const wasEditing = Boolean(editingId);

    try {
      setSaving(true);

      // created_by lo completa el backend a partir de la sesión (token).
      const reservationData = {
        ...formData,
        player_id: Number(formData.player_id),
        court_id: Number(formData.court_id),
        uses_lights: Number(formData.uses_lights),
      };

      if (wasEditing) {
        await updateReservation(editingId, reservationData);
      } else {
        await createReservation(reservationData);
      }

      resetForm();
      setMessage(
        wasEditing
          ? "Reserva actualizada correctamente."
          : "Reserva creada correctamente.",
      );

      setRefreshKey((key) => key + 1);
      await loadReservations();
    } catch (err) {
      setError(err.message || "No se pudo guardar la reserva.");
      // Es posible que el horario ya no esté disponible: se recarga.
      setRefreshKey((key) => key + 1);
    } finally {
      setSaving(false);
    }
  };

  // Cargar una reserva en el formulario para editarla.
  const handleEdit = (reservation) => {
    const reservationDate = String(reservation.reservation_date).slice(0, 10);

    editingIdRef.current = reservation.id;
    setEditingId(reservation.id);

    setOriginalReservation({
      court_id: String(reservation.court_id),
      reservation_date: reservationDate,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
    });

    setFormData({
      player_id: String(reservation.player_id),
      court_id: String(reservation.court_id),
      reservation_date: reservationDate,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      uses_lights: String(reservation.uses_lights ?? 0),
    });

    clearFeedback();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancelar una reserva.
  const handleCancel = async (id) => {
    if (cancellingId) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que querés cancelar esta reserva?",
    );

    if (!confirmed) return;

    try {
      setCancellingId(id);
      clearFeedback();

      await cancelReservation(id);

      // Si se estaba editando esa reserva, se sale del modo edición.
      if (editingId === id) resetForm();

      setMessage("Reserva cancelada correctamente.");
      setRefreshKey((key) => key + 1);
      await loadReservations();
    } catch (err) {
      setError(err.message || "No se pudo cancelar la reserva.");
    } finally {
      setCancellingId(null);
    }
  };
  // Eliminar físicamente una reserva (solo administrador).
  const handleDelete = async (id) => {
    if (!isAdmin || deletingId !== null || cancellingId !== null) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar definitivamente esta reserva? Esta acción no se puede deshacer.",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      clearFeedback();

      await deleteReservation(id);

      if (String(editingId) === String(id)) {
        resetForm();
      }

      setMessage("Reserva eliminada definitivamente.");
      setRefreshKey((key) => key + 1);

      await loadReservations();
    } catch (err) {
      setError(err.message || "No se pudo eliminar la reserva.");
    } finally {
      setDeletingId(null);
    }
  };
  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">
            Gestión de reservas
          </h1>

          <p className="mt-2 text-gray-600">
            Consultá los horarios disponibles y administrá las reservas.
          </p>
        </header>

        {/* Mensajes */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {availabilityError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-700"
          >
            {availabilityError}
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
        <section
          id="nueva-reserva"
          className="mb-10 rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {editingId ? "Editar reserva" : "Nueva reserva"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={handleResetClick}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Jugador */}
              <div>
                <label
                  htmlFor="player_id"
                  className="mb-2 block text-sm font-semibold"
                >
                  Jugador
                </label>

                <select
                  id="player_id"
                  name="player_id"
                  value={formData.player_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#65913C]"
                >
                  <option value="">Seleccioná un jugador</option>

                  {players.map((player) => (
                    <option key={player.id} value={String(player.id)}>
                      {player.last_name}, {player.first_name}
                    </option>
                  ))}
                </select>

                {players.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Todavía no hay jugadores.{" "}
                    <Link
                      href="/jugadores"
                      className="font-semibold text-[#65913C] hover:underline"
                    >
                      Agregá uno
                    </Link>
                    .
                  </p>
                )}
              </div>

              {/* Cancha */}
              <div>
                <label
                  htmlFor="court_id"
                  className="mb-2 block text-sm font-semibold"
                >
                  Cancha
                </label>

                <select
                  id="court_id"
                  name="court_id"
                  value={formData.court_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#65913C]"
                >
                  <option value="1">Cancha 1</option>
                  <option value="2">Cancha 2</option>
                  <option value="3">Cancha 3</option>
                  <option value="4">Cancha 4</option>
                </select>
              </div>
              {/* Iluminación */}
              <div>
                <label
                  htmlFor="uses_lights"
                  className="mb-2 block text-sm font-semibold"
                >
                  ¿La reserva utiliza luces?
                </label>
                <div className="rounded-lg border border-[#65913C]/30 bg-[#65913C]/10 p-4">
                  <p className="text-sm font-medium text-gray-600">
                    Precio de la reserva
                  </p>

                  {loadingPrice ? (
                    <p className="mt-1 text-sm text-gray-500">
                      Calculando precio...
                    </p>
                  ) : priceError ? (
                    <p className="mt-1 text-sm text-red-600">{priceError}</p>
                  ) : reservationPrice !== null ? (
                    <p className="mt-1 text-2xl font-bold text-[#263B1C]">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }).format(reservationPrice)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      Seleccioná un jugador para consultar el precio.
                    </p>
                  )}
                </div>
                <select
                  id="uses_lights"
                  name="uses_lights"
                  value={formData.uses_lights}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#65913C]"
                >
                  <option value="0">Sin luces</option>
                  <option value="1">Con luces</option>
                </select>
              </div>
              {/* Fecha */}
              <div role="group" aria-labelledby="date-label">
                <span
                  id="date-label"
                  className="mb-2 block text-sm font-semibold"
                >
                  Seleccioná una fecha
                </span>

                {loadingDates ? (
                  <p className="text-sm text-gray-500">
                    Cargando fechas disponibles...
                  </p>
                ) : calendarDates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay fechas habilitadas para esta cancha.
                  </p>
                ) : (
                  <AvailabilityCalendar
                    today={today}
                    availableDates={calendarDates}
                    value={formData.reservation_date}
                    onChange={handleDateChange}
                  />
                )}
              </div>

              {/* Horarios */}
              <div>
                <label
                  htmlFor="start_time"
                  className="mb-2 block text-sm font-semibold"
                >
                  Horario disponible
                </label>

                <select
                  id="start_time"
                  value={formData.start_time}
                  onChange={handleSlotChange}
                  disabled={loadingSlots || !formData.reservation_date}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#65913C] disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingSlots
                      ? "Cargando horarios..."
                      : "Seleccioná un horario"}
                  </option>

                  {slotOptions.map((slot) => (
                    <option key={slot.slot_start} value={slot.slot_start}>
                      {formatTime(slot.slot_start)} -{" "}
                      {formatTime(slot.slot_end)}
                      {slot.isCurrent ? " (actual)" : ""}
                    </option>
                  ))}
                </select>

                {!loadingSlots &&
                  formData.reservation_date &&
                  slotOptions.length === 0 &&
                  !availabilityError && (
                    <p className="mt-2 text-sm text-gray-500">
                      No hay horarios disponibles para esta fecha y cancha.
                    </p>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !today}
                className="rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar reserva"
                    : "Crear reserva"}
              </button>

              <button
                type="button"
                onClick={handleResetClick}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold transition hover:bg-gray-50"
              >
                Limpiar
              </button>
            </div>
          </form>
        </section>

        {/* Listado de reservas */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Reservas registradas</h2>

            <button
              type="button"
              onClick={loadReservations}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Actualizar listado
            </button>
          </div>

          {loading ? (
            <p className="py-6 text-gray-500">Cargando reservas...</p>
          ) : reservations.length === 0 ? (
            <p className="py-6 text-gray-500">
              Todavía no hay reservas registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-3 py-3">Jugador</th>
                    <th className="px-3 py-3">Cancha</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Horario</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Comprobante</th>
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {reservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="border-b border-gray-100"
                    >
                      <td className="px-3 py-4">
                        {reservation.first_name} {reservation.last_name}
                      </td>

                      <td className="px-3 py-4">{reservation.court}</td>

                      <td className="px-3 py-4">
                        {formatDate(reservation.reservation_date)}
                      </td>

                      <td className="px-3 py-4">
                        {formatTime(reservation.start_time)} -{" "}
                        {formatTime(reservation.end_time)}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            reservation.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {reservation.status === "confirmed"
                            ? "Confirmada"
                            : reservation.status === "cancelled"
                              ? "Cancelada"
                              : reservation.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <a
                          href={getReceiptUrl(reservation.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#65913C] hover:underline"
                        >
                          Ver
                        </a>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-3">
                          {reservation.status === "confirmed" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(reservation)}
                                disabled={
                                  cancellingId !== null || deletingId !== null
                                }
                                className="font-semibold text-[#65913C] hover:underline disabled:opacity-50"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCancel(reservation.id)}
                                disabled={
                                  cancellingId !== null || deletingId !== null
                                }
                                className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                              >
                                {cancellingId === reservation.id
                                  ? "Cancelando..."
                                  : "Cancelar"}
                              </button>
                            </>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(reservation.id)}
                              disabled={
                                deletingId !== null || cancellingId !== null
                              }
                              className="font-semibold text-red-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === reservation.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
