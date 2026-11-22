"use client";

import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
const SECTIONS = [
  {
    href: "/reservas",
    title: "Reservas",
    text: "Elegí cancha, fecha y horario disponible. Podés editar o cancelar tus turnos y ver el comprobante.",
    action: "Reservar una cancha",
  },
  {
    href: "/contacto",
    title: "Contacto",
    text: "Escribinos por cualquier consulta. Tu mensaje llega directo a nuestro correo.",
    action: "Enviar un mensaje",
  },
];
// Tarjeta que cambia según el rol: el personal gestiona jugadores; el resto ve su perfil.
const PLAYERS_SECTION = {
  href: "/jugadores",
  title: "Jugadores",
  text: "Registro de jugadores del club: alta, modificación y baja.",
  action: "Ver jugadores",
};

const PROFILE_SECTION = {
  href: "/perfil",
  title: "Mi perfil",
  text: "Consultá y actualizá tus datos personales y tu información deportiva.",
  action: "Ir a mi perfil",
};
const STEPS = [
  "Elegí la cancha y la fecha en el calendario.",
  "Seleccioná uno de los horarios libres.",
  "Confirmá la reserva y descargá el comprobante.",
];

export default function Home() {
  const { canManage } = useAuth();

  const sections = [
    SECTIONS[0],
    canManage ? PLAYERS_SECTION : PROFILE_SECTION,
    SECTIONS[1],
  ];
  return (
    <main className="px-4 py-12 text-[#263B1C]">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-2xl py-6">
          <h1 className="text-4xl font-bold md:text-5xl">
            Reservá tu cancha en Orso Tenis
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Consultá los horarios disponibles de las cuatro canchas y administrá
            las reservas del club en un solo lugar.
          </p>

          <Link
            href="/reservas"
            className="mt-8 inline-block rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C]"
          >
            Ir a reservas
          </Link>
        </section>

        <section aria-labelledby="secciones" className="mt-14">
          <h2 id="secciones" className="mb-5 text-2xl font-bold">
            Secciones del sitio
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {sections.map((section) => (
              <article
                key={section.href}
                className="flex flex-col rounded-2xl bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold">{section.title}</h3>
                <p className="mt-2 flex-1 text-gray-600">{section.text}</p>

                <Link
                  href={section.href}
                  className="mt-5 font-semibold text-[#65913C] hover:underline"
                >
                  {section.action} &rarr;
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="como-funciona" className="mt-14">
          <h2 id="como-funciona" className="mb-5 text-2xl font-bold">
            Cómo reservar
          </h2>

          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-[#263B1C]/10 p-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#263B1C] font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
