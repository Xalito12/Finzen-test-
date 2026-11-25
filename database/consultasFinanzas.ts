// Importa la conexión con Supabase.
import { supabase } from "./supabase";
// Importa la función y el tipo para calcular el rango de fechas del ciclo mensual.
import {
  calcularCicloFinanciero,
  type CicloFinanciero,
} from "../utils/cicloFinanciero";

// Define los datos utilizados para representar un gasto.
export interface GastoResumen {
  id: number | string;
  monto: number | string;
  categoria: string;
  icono: string | null;
  // Fecha del gasto en formato AAAA-MM-DD para filtrar por ciclo y permitir editarla.
  fecha?: string | null;
}

// Define los datos utilizados para representar un ingreso extra.
export interface IngresoExtraResumen {
  id: number | string;
  descripcion: string;
  monto: number | string;
  // Fecha del ingreso extra en formato AAAA-MM-DD para ubicarlo en su ciclo.
  fecha?: string | null;
}

// Define los datos utilizados para representar una categoría.
export interface CategoriaResumen {
  id: number | string;
  nombre: string;
  icono: string | null;
  limite: number | string;
  color: string | null;
}

// Calcula el total general de gastos y el total de cada categoría.
export function resumirGastos(
  // Recibe una lista de gastos con sus campos monto y categoría.
  gastos: ReadonlyArray<Pick<GastoResumen, "monto" | "categoria">>,
) {
  // Acumula el monto total de los gastos.
  let total = 0;
  // Relaciona cada nombre de categoría con su total gastado.
  const porCategoria = new Map<string, number>();
  for (const gasto of gastos) {
    // Convierte el monto a número.
    const monto = Number(gasto.monto);
    // Omite el gasto si su monto no es un número finito.
    if (!Number.isFinite(monto)) continue;
    // Suma el monto al total general.
    total += monto;
    // Acumula el monto en la categoría correspondiente.
    porCategoria.set(
      gasto.categoria,
      (porCategoria.get(gasto.categoria) || 0) + monto,
    );
  }
  // Compatibilidad con registros antiguos llamados Comida.
  // Al consultar Alimentación, también incluye los gastos llamados Comida.
  const gastoCategoria = (nombre: string) =>
    (porCategoria.get(nombre) || 0) +
    (nombre === "Alimentación" ? porCategoria.get("Comida") || 0 : 0);
  // Devuelve el total general y la función para consultar cada categoría.
  return { total, gastoCategoria };
}

// Suma los montos válidos de una lista de ingresos extra.
export function sumarIngresosExtra(
  ingresos: ReadonlyArray<Pick<IngresoExtraResumen, "monto">>,
): number {
  let total = 0;
  for (const ingreso of ingresos) {
    // Convierte el monto a número y omite valores inválidos o negativos.
    const monto = Number(ingreso.monto);
    if (!Number.isFinite(monto) || monto <= 0) continue;
    total += monto;
  }
  return total;
}

// Obtiene el usuario de la sesión actual.
async function usuarioActual() {
  // La sesión local evita validar el usuario por red en cada lectura.
  // Supabase sigue autorizando cada consulta con su token y sus políticas.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  // Propaga cualquier error al obtener la sesión.
  if (error) throw error;
  // Informa que se necesita una sesión activa para continuar.
  if (!session?.user) throw new Error("No hay una sesión activa.");
  // Devuelve los datos del usuario de la sesión.
  return session.user;
}

// Obtiene la información necesaria para la pantalla de Inicio.
// Recibe un desplazamiento opcional (0 = ciclo actual, -1 = mes anterior, etc.).
export async function consultarInicio(desplazamientoCiclos = 0): Promise<{
  user: Awaited<ReturnType<typeof usuarioActual>>;
  perfil: {
    nombre?: string | null;
    sueldo?: number | null;
    dia_pago?: number | null;
  } | null;
  gastos: GastoResumen[];
  ingresosExtra: IngresoExtraResumen[];
  categorias: CategoriaResumen[];
  ciclo: CicloFinanciero;
}> {
  // Obtiene el usuario cuyos datos se consultarán.
  const user = await usuarioActual();
  // Ejecuta las consultas de perfil y categorías en paralelo.
  // Se consulta el perfil primero para obtener dia_pago y calcular el ciclo.
  const [perfil, categorias] = await Promise.all([
    // Consulta el nombre, el sueldo y el día de pago del perfil del usuario.
    supabase
      .from("perfiles")
      .select("nombre, sueldo, dia_pago")
      .eq("id", user.id)
      .single(),
    // Consulta sus categorías ordenadas de menor a mayor identificador.
    supabase
      .from("categorias")
      .select("id, nombre, icono, limite, color")
      .eq("usuario_id", user.id)
      .order("id", { ascending: true }),
  ]);
  // Comprueba si alguna consulta devolvió un error y lo propaga.
  if (perfil.error) throw perfil.error;
  if (categorias.error) throw categorias.error;

  // Calcula las fechas de inicio y fin del ciclo financiero usando dia_pago.
  const ciclo = calcularCicloFinanciero(
    perfil.data?.dia_pago,
    new Date(),
    desplazamientoCiclos,
  );

  // Consulta en paralelo los gastos y los ingresos extra del ciclo financiero actual.
  const [gastos, ingresosExtra] = await Promise.all([
    // Consulta solo los gastos que caen dentro del ciclo actual.
    supabase
      .from("gastos")
      .select("id, monto, categoria, icono, fecha")
      .eq("usuario_id", user.id)
      .gte("fecha", ciclo.inicioISO)
      .lte("fecha", ciclo.finISO)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false }),
    // Consulta solo los ingresos extra registrados dentro del ciclo actual.
    supabase
      .from("ingresos_extra")
      .select("id, descripcion, monto, fecha")
      .eq("usuario_id", user.id)
      .gte("fecha", ciclo.inicioISO)
      .lte("fecha", ciclo.finISO)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  // Comprueba si alguna consulta devolvió un error y lo propaga.
  if (gastos.error) throw gastos.error;
  if (ingresosExtra.error) throw ingresosExtra.error;

  // Devuelve los resultados agrupados junto con la información del ciclo.
  // Para gastos, ingresos extra y categorías utiliza una lista vacía si no hay datos.
  return {
    user,
    perfil: perfil.data,
    gastos: (gastos.data || []) as GastoResumen[],
    ingresosExtra: (ingresosExtra.data || []) as IngresoExtraResumen[],
    categorias: (categorias.data || []) as CategoriaResumen[],
    ciclo,
  };
}

// Obtiene las categorías y los gastos del ciclo actual para calcular sus totales.
export async function consultarCategorias(desplazamientoCiclos = 0) {
  // Obtiene el usuario cuyos datos se consultarán.
  const user = await usuarioActual();
  // Ejecuta las consultas de perfil (para dia_pago) y categorías en paralelo.
  const [perfil, categorias] = await Promise.all([
    // Consulta el día de pago configurado por el usuario.
    supabase
      .from("perfiles")
      .select("dia_pago")
      .eq("id", user.id)
      .single(),
    // Consulta las categorías del usuario ordenadas por identificador.
    supabase
      .from("categorias")
      .select("id, nombre, icono, limite, color")
      .eq("usuario_id", user.id)
      .order("id", { ascending: true }),
  ]);
  // Propaga cualquier error recibido en las consultas.
  if (perfil.error) throw perfil.error;
  if (categorias.error) throw categorias.error;

  // Calcula el rango de fechas del ciclo financiero actual.
  const ciclo = calcularCicloFinanciero(
    perfil.data?.dia_pago,
    new Date(),
    desplazamientoCiclos,
  );

  // Consulta el monto, la categoría y la fecha solo de los gastos del ciclo actual.
  const gastos = await supabase
    .from("gastos")
    .select("monto, categoria, fecha")
    .eq("usuario_id", user.id)
    .gte("fecha", ciclo.inicioISO)
    .lte("fecha", ciclo.finISO);

  // Propaga cualquier error recibido al consultar los gastos.
  if (gastos.error) throw gastos.error;

  // Devuelve ambas listas y el ciclo con los tipos de datos esperados.
  return {
    categorias: (categorias.data || []) as CategoriaResumen[],
    gastos: (gastos.data || []) as Pick<GastoResumen, "monto" | "categoria">[],
    ciclo,
  };
}