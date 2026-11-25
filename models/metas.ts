// Define los montos necesarios para calcular el avance de una meta.
export interface MetaBase {
  monto_objetivo: number;
  monto_ahorrado: number;
}

// Devuelve una fecha local con formato AAAA-MM-DD.
// Utiliza la fecha actual cuando no se proporciona otra.
export function fechaLocalISO(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}


// Comprueba el formato, el año y la existencia real de la fecha indicada.

export function fechaLocalValida(valor: string): boolean {
    // Rechaza los valores que no tengan el formato AAAA-MM-DD.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [year, month, day] = valor.split("-").map(Number);
    // Rechaza los años fuera del intervalo permitido.
  if (year < 1900 || year > 9999) return false;
  const fecha = new Date(year, month - 1, day);
  return (
    fecha.getFullYear() === year &&
    fecha.getMonth() === month - 1 &&
    fecha.getDate() === day
  );
}

// Calcula la diferencia en días entre la fecha indicada y hoy.
// Un resultado negativo indica que la fecha ya pasó.
export function diasHastaFecha(valor: string, hoy = new Date()): number | null {
    // Devuelve null si la fecha recibida no es válida.

  if (!fechaLocalValida(valor)) return null;
  const [year, month, day] = valor.split("-").map(Number);
  return Math.round(
    (Date.UTC(year, month - 1, day) -
      Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) /
      86400000,
  );
}
// Calcula el avance de la meta como un porcentaje entero entre 0 y 100.

export function porcentajeMeta(meta: MetaBase): number {
    // Devuelve cero si el objetivo es inválido, no es positivo
  // o el monto ahorrado no es un número finito.
  if (
    !Number.isFinite(meta.monto_objetivo) ||
    meta.monto_objetivo <= 0 ||
    !Number.isFinite(meta.monto_ahorrado)
  )
    return 0;
  return Math.min(
    100,
    Math.max(0, Math.floor((meta.monto_ahorrado / meta.monto_objetivo) * 100)),
  );
}
// Convierte el monto escrito como texto a un número.
// Interpreta separadores de miles y decimales y devuelve NaN si el monto es inválido.
export function leerMontoMeta(valor: string): number {
  let texto = valor.trim().replace(/\s/g, "");
    // Rechaza el texto vacío o con caracteres distintos de números, puntos y comas.
  if (!texto || !/^[0-9.,]+$/.test(texto)) return NaN;
    // Cuando hay una coma, la interpreta como separador decimal.
  if (texto.includes(",")) {
        // Rechaza los montos cuyo formato de miles o decimales no sea válido.
    if (!/^\d+(?:\.\d{3})*(?:,\d{1,2})?$/.test(texto)) return NaN;
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(texto))
    texto = texto.replace(/\./g, "");
      // Rechaza los formatos restantes que no sean enteros o números con hasta dos decimales.
  else if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) return NaN;
  const monto = Number(texto);
  return Number.isFinite(monto) && monto <= 999999999999.99 ? monto : NaN;
}
