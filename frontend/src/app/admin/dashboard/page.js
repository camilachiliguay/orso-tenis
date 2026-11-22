"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
import CourtsManagement from "@/components/admin/CourtsManagement";

import {
  getTodayReservationsCount,
  getUpcomingReservationsCount,
  getRecentReservations,
} from "@/services/reservationService";

import { getPlayersCount } from "@/services/playerService";
import { getActiveCourtsCount } from "@/services/courtService";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  // Estadísticas de reservas de hoy.
  const [reservationsCount, setReservationsCount] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  // Actividad reciente.
  const [recentReservations, setRecentReservations] = useState([]);
  const [loadingRecentReservations, setLoadingRecentReservations] =
    useState(true);
  const [recentReservationsError, setRecentReservationsError] = useState("");

  // Jugadores registrados.
  const [playersCount, setPlayersCount] = useState(null);
  const [loadingPlayersCount, setLoadingPlayersCount] = useState(true);
  const [playersCountError, setPlayersCountError] = useState("");

  // Canchas habilitadas.
  const [activeCourtsCount, setActiveCourtsCount] = useState(null);
  const [loadingCourtsCount, setLoadingCourtsCount] = useState(true);
  const [courtsCountError, setCourtsCountError] = useState("");

  // Próximas reservas.
  const [upcomingReservationsCount, setUpcomingReservationsCount] =
    useState(null);
  const [loadingUpcomingReservations, setLoadingUpcomingReservations] =
    useState(true);
  const [upcomingReservationsError, setUpcomingReservationsError] =
    useState("");

  // Verificar permisos del administrador.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    } else if (!isAdmin) {
      router.replace("/reservas");
    }
  }, [user, loading, isAdmin, router]);

  // Obtener estadísticas del dashboard.
  useEffect(() => {
    if (loading || !user || !isAdmin) return;

    // Reservas de hoy.
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError("");

        const data = await getTodayReservationsCount();
        setReservationsCount(data.total);
      } catch (error) {
        setStatsError(
          error.message || "No se pudieron cargar las estadísticas.",
        );
      } finally {
        setLoadingStats(false);
      }
    };

    // Jugadores registrados.
    const fetchPlayersCount = async () => {
      try {
        setLoadingPlayersCount(true);
        setPlayersCountError("");

        const data = await getPlayersCount();
        setPlayersCount(data.total);
      } catch (error) {
        setPlayersCountError(
          error.message || "No se pudo obtener la cantidad de jugadores.",
        );
      } finally {
        setLoadingPlayersCount(false);
      }
    };

    // Canchas habilitadas.
    const fetchCourtsCount = async () => {
      try {
        setLoadingCourtsCount(true);
        setCourtsCountError("");

        const data = await getActiveCourtsCount();
        setActiveCourtsCount(data.total);
      } catch (error) {
        setCourtsCountError(
          error.message || "No se pudo obtener la cantidad de canchas.",
        );
      } finally {
        setLoadingCourtsCount(false);
      }
    };

    // Próximas reservas.
    const fetchUpcomingReservationsCount = async () => {
      try {
        setLoadingUpcomingReservations(true);
        setUpcomingReservationsError("");

        const data = await getUpcomingReservationsCount();
        setUpcomingReservationsCount(data.total);
      } catch (error) {
        setUpcomingReservationsError(
          error.message || "No se pudieron obtener las próximas reservas.",
        );
      } finally {
        setLoadingUpcomingReservations(false);
      }
    };

    // Últimas reservas.
    const fetchRecentReservations = async () => {
      try {
        setLoadingRecentReservations(true);
        setRecentReservationsError("");

        const data = await getRecentReservations();
        setRecentReservations(data);
      } catch (error) {
        setRecentReservationsError(
          error.message || "No se pudo obtener la actividad reciente.",
        );
      } finally {
        setLoadingRecentReservations(false);
      }
    };

    // Ejecutar consultas.
    fetchStats();
    fetchPlayersCount();
    fetchCourtsCount();
    fetchUpcomingReservationsCount();
    fetchRecentReservations();
  }, [loading, user, isAdmin]);

  // Verificar acceso.
  if (loading || !user || !isAdmin) {
    return <p className="p-6">Verificando acceso...</p>;
  }

  return (
    <main className="min-h-screen bg-[#F7F7F2] p-6 text-[#263B1C]">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <h1 className="text-3xl font-bold">Panel de administración</h1>

        <p className="mt-2 text-gray-600">
          Bienvenido, {user.first_name || "Administrador"}. Desde acá podés
          gestionar Orso Tenis.
        </p>

        {/* Estadísticas */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Reservas de hoy */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Reservas de hoy</p>

            {loadingStats ? (
              <p className="mt-3 text-2xl font-bold text-gray-400">
                Cargando...
              </p>
            ) : statsError ? (
              <p className="mt-3 text-sm text-red-600">{statsError}</p>
            ) : (
              <p className="mt-3 text-3xl font-bold">{reservationsCount}</p>
            )}

            <p className="mt-2 text-xs text-gray-500">Reservas confirmadas</p>
          </div>

          {/* Jugadores registrados */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Jugadores registrados
            </p>

            {loadingPlayersCount ? (
              <p className="mt-3 text-2xl font-bold text-gray-400">
                Cargando...
              </p>
            ) : playersCountError ? (
              <p className="mt-3 text-sm text-red-600">{playersCountError}</p>
            ) : (
              <p className="mt-3 text-3xl font-bold">{playersCount}</p>
            )}

            <p className="mt-2 text-xs text-gray-500">Total de jugadores</p>
          </div>

          {/* Canchas disponibles */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Canchas disponibles
            </p>

            {loadingCourtsCount ? (
              <p className="mt-3 text-2xl font-bold text-gray-400">
                Cargando...
              </p>
            ) : courtsCountError ? (
              <p className="mt-3 text-sm text-red-600">{courtsCountError}</p>
            ) : (
              <p className="mt-3 text-3xl font-bold">{activeCourtsCount}</p>
            )}

            <p className="mt-2 text-xs text-gray-500">Canchas habilitadas</p>
          </div>

          {/* Próximas reservas */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Próximas reservas
            </p>

            {loadingUpcomingReservations ? (
              <p className="mt-3 text-2xl font-bold text-gray-400">
                Cargando...
              </p>
            ) : upcomingReservationsError ? (
              <p className="mt-3 text-sm text-red-600">
                {upcomingReservationsError}
              </p>
            ) : (
              <p className="mt-3 text-3xl font-bold">
                {upcomingReservationsCount}
              </p>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Reservas confirmadas desde mañana
            </p>
          </div>
        </div>

        {/* Actividad reciente */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Actividad reciente</h2>

            <p className="mt-1 text-sm text-gray-500">
              Últimas 5 reservas registradas en el club.
            </p>
          </div>

          {loadingRecentReservations ? (
            <p className="text-sm text-gray-500">
              Cargando actividad reciente...
            </p>
          ) : recentReservationsError ? (
            <p className="text-sm text-red-600">{recentReservationsError}</p>
          ) : recentReservations.length === 0 ? (
            <p className="text-sm text-gray-500">
              Todavía no hay reservas registradas.
            </p>
          ) : (
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex flex-col gap-2 border-b border-gray-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {reservation.first_name} {reservation.last_name}
                    </p>

                    <p className="text-sm text-gray-500">{reservation.court}</p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      {new Date(
                        `${reservation.reservation_date}T00:00:00`,
                      ).toLocaleDateString("es-AR")}
                    </p>

                    <p>
                      {String(reservation.start_time).slice(0, 5)} -{" "}
                      {String(reservation.end_time).slice(0, 5)}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#65913C]/10 px-3 py-1 text-xs font-semibold text-[#263B1C]">
                    {reservation.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acciones rápidas */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Acciones rápidas</h2>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/reservas#nueva-reserva"
              className="inline-flex items-center rounded-xl bg-[#87b174] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#65913C]"
            >
              + Nueva reserva
            </Link>

            <Link
              href="/reservas"
              className="inline-flex items-center rounded-xl border border-[#263B1C] px-5 py-3 text-sm font-semibold text-[#263B1C] transition hover:bg-[#F7F7F2]"
            >
              Ver reservas
            </Link>

            <Link
              href="/admin/canchas"
              className="inline-flex items-center rounded-xl border border-[#65913C] bg-white px-5 py-3 text-sm font-semibold text-[#65913C] transition hover:bg-[#65913C] hover:text-white"
            >
              Administrar canchas
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
