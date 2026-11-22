"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const ROLE_LABELS = {
  admin: "Administrador",
  staff: "Staff",
  player: "Jugador",
};

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/reservas", label: "Reservas" },
  { href: "/jugadores", label: "Jugadores", staffOnly: true },
  { href: "/contacto", label: "Contacto" },
];

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-xl border border-[#263B1C]/15 bg-white px-3 py-2 transition hover:border-[#65913C] hover:bg-[#F7F7F2]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#263B1C] text-sm font-bold text-white">
          {(ROLE_LABELS[user.role] || "U").charAt(0)}
        </span>

        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-[#263B1C]">
            Mi cuenta
          </span>
          <span className="block text-xs text-gray-500">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </span>

        <span className="text-xs text-[#65913C]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-[#263B1C]/10 bg-white p-2 shadow-xl shadow-[#263B1C]/10"
        >
          <div className="border-b border-gray-100 px-3 py-3">
            <p className="text-xs text-gray-500">Sesión iniciada como</p>
            <p className="mt-1 text-sm font-semibold text-[#263B1C]">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>

          <Link
            role="menuitem"
            href="/perfil"
            onClick={closeMenu}
            className="mt-2 block rounded-xl px-3 py-3 text-sm font-medium text-[#263B1C] transition hover:bg-[#F7F7F2]"
          >
            Mi perfil
          </Link>

          <Link
            role="menuitem"
            href="/cambiar-password"
            onClick={closeMenu}
            className="block rounded-xl px-3 py-3 text-sm font-medium text-[#263B1C] transition hover:bg-[#F7F7F2]"
          >
            Cambiar contraseña
          </Link>

          <div className="my-2 border-t border-gray-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onLogout();
            }}
            className="block w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function Brand({ admin = false }) {
  return (
    <Link
      href={admin ? "/admin/dashboard" : "/"}
      className="group flex shrink-0 items-center gap-3"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#263B1C] text-lg font-black text-[#EBCB43] shadow-sm transition group-hover:bg-[#65913C]">
        O
      </span>

      <span>
        <span className="block text-lg font-extrabold leading-tight tracking-wide text-[#263B1C]">
          ORSO TENIS
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#65913C]">
          Club deportivo
        </span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canManage } = useAuth();

  const isAdminRoute = pathname.startsWith("/admin");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // El panel administrativo tiene su propia navegación lateral.
  if (isAdminRoute) return null;

  // Navegación del administrador fuera del panel.
  if (user?.role === "admin") {
    return (
      <header className="sticky top-0 z-40 border-b border-[#263B1C]/10 bg-white/95 shadow-sm backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Brand admin />

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin/dashboard"
              className="rounded-xl bg-[#263B1C] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#65913C] sm:px-5 sm:text-sm"
            >
              <span className="hidden sm:inline text-white">
                ← Volver al panel
              </span>
              <span className="sm:hidden">← Panel</span>
            </Link>

            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </nav>
      </header>
    );
  }

  // Navegación pública para jugadores y visitantes.
  const links = LINKS.filter((item) => {
    if (!item.staffOnly) return true;
    return Boolean(user && (canManage || user.role === "player"));
  });

  return (
    <header className="sticky top-0 z-40 border-b border-[#263B1C]/10 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Brand />

        <ul className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:pb-0">
          {links.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-xl px-4 py-2.5 transition ${
                    isActive
                      ? "bg-[#263B1C] text-white shadow-sm"
                      : "text-[#52604B] hover:bg-[#F2F4EE] hover:text-[#263B1C]"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto sm:ml-0">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-[#263B1C] transition hover:bg-[#F2F4EE] sm:px-4 sm:text-sm"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/registro"
                className="rounded-xl bg-[#263B1C] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#65913C] sm:px-5 sm:text-sm"
              >
                Registrate
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
