"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "⌂",
  },
  {
    label: "Reservas",
    href: "/reservas",
    icon: "▤",
  },
  {
    label: "Jugadores",
    href: "/jugadores",
    icon: "♟",
  },
  {
    label: "Canchas",
    href: "/admin/canchas",
    icon: "▦",
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F7F7F2] md:flex-row">
      {/* MENÚ LATERAL */}
      <aside className="z-30 flex w-full shrink-0 flex-col bg-[#263B1C] text-white md:sticky md:top-0 md:h-screen md:w-[270px]">
        {/* MARCA */}
        <div className="border-b border-white/10 px-6 py-6">
          <Link
            href="/admin/dashboard"
            className="group flex items-center gap-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBCB43] text-2xl font-black text-[#263B1C] transition group-hover:scale-105">
              O
            </span>

            <span>
              <span className="block text-xl font-extrabold tracking-wide">
                ORSO TENIS
              </span>

              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#EBCB43]">
                Club deportivo
              </span>
            </span>
          </Link>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
              Administración
            </p>

            <p className="mt-1 text-sm text-white/70">
              Panel de gestión del club
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav
          aria-label="Navegación administrativa"
          className="flex gap-2 overflow-x-auto p-4 md:flex-1 md:flex-col md:overflow-x-visible md:overflow-y-auto"
        >
          <p className="hidden px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 md:block">
            Menú principal
          </p>

          {menuItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#65913C] text-white shadow-lg shadow-black/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl transition ${
                    active
                      ? "bg-white/15 text-[#EBCB43]"
                      : "bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-[#EBCB43]"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>

                {active && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-[#EBCB43]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* INFORMACIÓN DEL CLUB */}
        <div className="hidden px-4 pb-5 md:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#EBCB43]" />
              <p className="text-xs font-bold text-white">ORSO TENIS</p>
            </div>

            <p className="mt-2 text-xs leading-5 text-white/50">
              Gestión integral del club. Administrá las actividades y servicios
              desde un solo lugar.
            </p>
          </div>

          <p className="mt-4 text-center text-[10px] text-white/30">
            © 2026 Orso Tenis
          </p>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="min-h-screen min-w-0 flex-1 bg-[#F7F7F2]">
        {children}
      </main>
    </div>
  );
}
