// Foto del jugador o, si no tiene, un círculo con sus iniciales.
export default function Avatar({
  photo,
  firstName,
  lastName,
  size = "h-12 w-12",
  placeholderClass = "bg-[#263B1C]/10 text-[#263B1C]",
}) {
  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={`Foto de ${firstName} ${lastName}`}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${size} ${placeholderClass} flex shrink-0 items-center justify-center rounded-full text-sm font-bold`}
    >
      {initials}
    </div>
  );
}
