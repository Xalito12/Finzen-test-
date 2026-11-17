export type PantallaTutorial =
  | "Inicio"
  | "Categorias"
  | "Gasto"
  | "Notificaciones"
  | "Metas"
  | "Perfil";

export type AccionTutorial =
  | "categoria_creada"
  | "gasto_creado"
  | "categorias_abiertas";

export type AccionInterfazTutorial = "crear_categoria" | "ver_gastos";

export interface PasoTutorial {
  id:
    | "inicio"
    | "categorias"
    | "gasto"
    | "resumen"
    | "gestion"
    | "notificaciones"
    | "metas"
    | "perfil";
  pantalla: PantallaTutorial;
  ruta: number;
  titulo: string;
  explicaciones: readonly string[];
  siguiente: string;
}

export const pasosTutorial: readonly PasoTutorial[] = [
  {
    id: "inicio",
    pantalla: "Inicio",
    ruta: 2,
    titulo: "Empieza creando una categoría",
    explicaciones: [
      "Las categorías ordenan tus gastos, por ejemplo, Alimentación o Transporte.",
      "Abre Categorías para crear la primera.",
    ],
    siguiente: "Abrir Categorías",
  },
  {
    id: "categorias",
    pantalla: "Categorias",
    ruta: 3,
    titulo: "Crea tu primera categoría",
    explicaciones: [
      "Pulsa + Nueva y elige una categoría o crea una propia en Otros…",
      "Añade un límite para controlar cuánto quieres gastar.",
    ],
    siguiente: "Continuar con mis categorías",
  },
  {
    id: "gasto",
    pantalla: "Gasto",
    ruta: 4,
    titulo: "Registra tus gastos",
    explicaciones: [
      "Escribe el monto, elige una categoría y pulsa Registrar gasto.",
      "También puedes continuar sin registrar un gasto.",
    ],
    siguiente: "Seguir sin registrar",
  },
  {
    id: "resumen",
    pantalla: "Inicio",
    ruta: 2,
    titulo: "Entiende tu saldo y el aro",
    explicaciones: [
      "Disponible es tu sueldo menos tus gastos.",
      "El aro cambia de verde a amarillo o rojo según el dinero que te queda.",
    ],
    siguiente: "Ver cómo administrar gastos",
  },
  {
    id: "gestion",
    pantalla: "Inicio",
    ruta: 2,
    titulo: "Revisa y corrige tus registros",
    explicaciones: [
      "En Gestión de gastos, usa el lápiz para editar y la papelera para eliminar.",
      "Las barras muestran cuánto gastaste en cada categoría.",
    ],
    siguiente: "Conocer las notificaciones",
  },
  {
    id: "notificaciones",
    pantalla: "Notificaciones",
    ruta: 6,
    titulo: "Reconoce los avisos importantes",
    explicaciones: [
      "La campana muestra avisos sobre tu presupuesto, categorías y metas.",
      "Los avisos aparecen dentro de FinZen. Pulsa uno para ver más.",
    ],
    siguiente: "Conocer las metas",
  },
  {
    id: "metas",
    pantalla: "Metas",
    ruta: 5,
    titulo: "Sigue tus objetivos de ahorro",
    explicaciones: [
      "Crea una meta con un nombre, un monto y una fecha opcional.",
      "Registra tus aportes o retiros. Estos no mueven dinero automáticamente.",
    ],
    siguiente: "Conocer mi perfil",
  },
  {
    id: "perfil",
    pantalla: "Perfil",
    ruta: 8,
    titulo: "Tu cuenta y los últimos controles",
    explicaciones: [
      "En Editar puedes cambiar tu nombre, sueldo y día de pago.",
      "Aquí también puedes ver notificaciones, repetir la guía y cerrar sesión.",
    ],
    siguiente: "Terminar tutorial",
  },
];

export function indiceSeguroTutorial(valor: unknown): number {
  return typeof valor === "number" && Number.isInteger(valor)
    ? Math.min(pasosTutorial.length - 1, Math.max(0, valor))
    : 0;
}