"use client";

import { useState } from "react";

import { sendContactMessage } from "@/services/contactService";

const EMPTY_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "", // campo trampa anti-spam: debe quedar vacío
};

const MAX_MESSAGE = 2000;

export default function ContactoPage() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      setSending(true);

      await sendContactMessage(formData);

      setFormData(EMPTY_FORM);
      setMessage("¡Mensaje enviado! Te vamos a responder por correo.");
    } catch (err) {
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="px-4 py-10 text-[#263B1C]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Contacto</h1>

          <p className="mt-2 text-gray-600">
            ¿Tenés una consulta? Completá el formulario y te respondemos por
            correo.
          </p>
        </header>

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

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Nombre
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  maxLength={100}
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
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
                  name="email"
                  type="email"
                  maxLength={150}
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-semibold"
              >
                Asunto
              </label>

              <input
                id="subject"
                name="subject"
                type="text"
                maxLength={120}
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-semibold"
              >
                Mensaje
              </label>

              <textarea
                id="message"
                name="message"
                rows={6}
                maxLength={MAX_MESSAGE}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#65913C]"
              />

              <p className="mt-1 text-right text-xs text-gray-500">
                {formData.message.length}/{MAX_MESSAGE}
              </p>
            </div>

            {/* Campo trampa: oculto para personas, los bots suelen completarlo */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">No completar este campo</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-[#263B1C] px-6 py-3 font-semibold text-white transition hover:bg-[#65913C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
