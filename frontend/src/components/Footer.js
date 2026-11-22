"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function Footer() {
  const { canManage } = useAuth();

  return (
    <footer className="mt-auto bg-[#263B1C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* IDENTIDAD DEL CLUB */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBCB43] text-xl font-black text-[#263B1C]">
                O
              </span>

              <span>
                <span className="block text-xl font-extrabold tracking-wide">
                  ORSO TENIS
                </span>
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#EBCB43]">
                  Club deportivo
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
              Un espacio para disfrutar del tenis, compartir momentos y
              desarrollar tu pasión por el deporte.
            </p>
          </div>

          {/* NAVEGACIÓN */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#EBCB43]">
              Navegación
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-white/75">
              <li>
                <Link href="/" className="transition hover:text-[#EBCB43]">
                  Inicio
                </Link>
              </li>

              <li>
                <Link
                  href="/reservas"
                  className="transition hover:text-[#EBCB43]"
                >
                  Reservar una cancha
                </Link>
              </li>

              {canManage && (
                <li>
                  <Link
                    href="/jugadores"
                    className="transition hover:text-[#EBCB43]"
                  >
                    Jugadores
                  </Link>
                </li>
              )}

              <li>
                <Link
                  href="/contacto"
                  className="transition hover:text-[#EBCB43]"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* INFORMACIÓN */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#EBCB43]">
              Orso Tenis
            </h3>

            <p className="mt-5 text-sm leading-7 text-white/65">
              Gestión integral del club, reservas de canchas y organización de
              actividades deportivas.
            </p>

            <Link
              href="/reservas"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#9c8f53] px-5 py-3 text-sm font-bold transition text-black"
            >
              Reservar ahora
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-center sm:flex-row sm:text-left">
          <p className="mt-4 text-center text-[10px] text-white/30">
            © 2026 Orso Tenis
          </p>

          <p className="text-xs font-medium text-white/50">
            Pasión por el tenis.
          </p>
        </div>
      </div>
    </footer>
  );
}
