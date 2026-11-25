// components/GraficoGastosMes.tsx
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

// Define los datos de cada categoría necesarios para dibujar el gráfico.
export interface DatoGraficoCategoria {
  id: number | string;
  name: string;
  spent: number;
  limit: number;
  color: string;
  icono: string;
}

interface Props {
  // Lista de categorías con su monto gastado en el ciclo seleccionado.
  categorias: DatoGraficoCategoria[];
  // Total gastado en el ciclo actual o consultado.
  totalGastado: number;
  // Etiqueta del ciclo que se está visualizando (ej. "5 nov - 4 dic").
  etiquetaCiclo: string;
  // Desplazamiento del ciclo (0 = actual, -1 = mes anterior, etc.).
  desplazamiento: number;
  // Función para retroceder al ciclo/mes anterior.
  onAnterior: () => void;
  // Función para avanzar al ciclo/mes siguiente.
  onSiguiente: () => void;
  // Función para volver rápido al ciclo actual.
  onVolverActual: () => void;
}

export default function GraficoGastosMes({
  categorias,
  totalGastado,
  etiquetaCiclo,
  desplazamiento,
  onAnterior,
  onSiguiente,
  onVolverActual,
}: Props) {
  // Guarda el identificador de la categoría que el usuario tocó en el gráfico.
  const [seleccionadaId, setSeleccionadaId] = useState<number | string | null>(
    null,
  );

  // Al cambiar de mes/ciclo, limpia la selección anterior para no mostrar datos viejos.
  useEffect(() => {
    setSeleccionadaId(null);
  }, [desplazamiento]);

  // Filtra solo las categorías que tienen gastos en este ciclo y las ordena de mayor a menor.
  const categoriasConGasto = categorias
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Calcula el gasto más alto del mes para escalar proporcionalmente la altura de las barras.
  const gastoMaximo =
    categoriasConGasto.length > 0 ? categoriasConGasto[0].spent : 1;

  // Busca el detalle de la categoría seleccionada actualmente (si hay una).
  const categoriaActiva = categoriasConGasto.find(
    (c) => c.id === seleccionadaId,
  );

  // Permite seleccionar una categoría al tocarla o deseleccionarla si ya estaba activa.
  const alternarSeleccion = (id: number | string) => {
    setSeleccionadaId((actual) => (actual === id ? null : id));
  };

  return (
    <View className="bg-card rounded-[16px] p-[16px] mb-[20px]">
      {/* Cabecera con título y selector de ciclo/mes */}
      <View className="flex-row items-center justify-between mb-[12px]">
        <View>
          <Text className="text-[15px] font-bold text-text">
            Gráfico del ciclo
          </Text>
          <Text className="text-[11px] text-text-secondary">
            Toca una barra para ver el detalle
          </Text>
        </View>

        {/* Controles para navegar entre ciclos mensuales */}
        <View className="flex-row items-center gap-[6px]">
          <Pressable
            onPress={onAnterior}
            accessibilityRole="button"
            accessibilityLabel="Ver ciclo anterior"
            hitSlop={6}
            className="w-[32px] h-[32px] rounded-[8px] bg-bg items-center justify-center"
          >
            <Feather name="chevron-left" size={18} color="#512DA8" />
          </Pressable>

          <Pressable
            onPress={onVolverActual}
            disabled={desplazamiento === 0}
            className="px-[10px] py-[6px] rounded-[8px] bg-bg"
          >
            <Text className="text-[12px] font-semibold text-text">
              {etiquetaCiclo || "Ciclo actual"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onSiguiente}
            disabled={desplazamiento >= 0}
            accessibilityRole="button"
            accessibilityLabel="Ver ciclo siguiente"
            hitSlop={6}
            className="w-[32px] h-[32px] rounded-[8px] bg-bg items-center justify-center"
            style={{ opacity: desplazamiento >= 0 ? 0.35 : 1 }}
          >
            <Feather name="chevron-right" size={18} color="#512DA8" />
          </Pressable>
        </View>
      </View>

      {/* Aviso rápido cuando el usuario está mirando un ciclo pasado */}
      {desplazamiento < 0 && (
        <Pressable
          onPress={onVolverActual}
          className="self-start mb-[10px] px-[10px] py-[4px] rounded-[8px] bg-bg"
        >
          <Text className="text-[11px] font-semibold text-primary">
            ← Volver al ciclo actual
          </Text>
        </Pressable>
      )}

      {/* Si no hay gastos en el ciclo seleccionado, muestra un estado vacío */}
      {categoriasConGasto.length === 0 || totalGastado <= 0 ? (
        <View className="py-[20px] items-center">
          <Text className="text-[13px] text-text-secondary text-center">
            No hay gastos registrados en este ciclo ({etiquetaCiclo}).
          </Text>
        </View>
      ) : (
        <>
          {/* 1. Barra apilada interactiva: muestra la proporción de cada categoría sobre el total */}
          <View className="h-[16px] w-full flex-row rounded-[8px] overflow-hidden bg-bg mb-[14px]">
            {categoriasConGasto.map((cat) => {
              const proporcion = (cat.spent / totalGastado) * 100;
              const estaActiva = seleccionadaId === cat.id;
              return (
                <Pressable
                  key={`seg-${cat.id}`}
                  onPress={() => alternarSeleccion(cat.id)}
                  style={{
                    width: `${Math.max(proporcion, 3)}%`,
                    backgroundColor: cat.color || "#512DA8",
                    opacity:
                      seleccionadaId === null || estaActiva ? 1 : 0.35,
                  }}
                />
              );
            })}
          </View>

          {/* 2. Tarjeta de detalle interactivo según la categoría tocada */}
          <View className="bg-bg rounded-[12px] p-[12px] mb-[14px]">
            {categoriaActiva ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-[8px] flex-1">
                  <Text className="text-[20px]">{categoriaActiva.icono}</Text>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-text">
                      {categoriaActiva.name}
                    </Text>
                    <Text className="text-[12px] text-text-secondary">
                      {Math.round((categoriaActiva.spent / totalGastado) * 100)}
                      % del gasto total ·{" "}
                      {Math.round(
                        (categoriaActiva.spent / categoriaActiva.limit) * 100,
                      )}
                      % de su límite
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[15px] font-extrabold"
                  style={{ color: categoriaActiva.color || "#512DA8" }}
                >
                  ${categoriaActiva.spent.toLocaleString("es-CL")}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-text-secondary">
                  Total gastado en el ciclo
                </Text>
                <Text className="text-[15px] font-extrabold text-primary">
                  ${totalGastado.toLocaleString("es-CL")}
                </Text>
              </View>
            )}
          </View>

          {/* 3. Gráfico de columnas verticales interactivas por categoría */}
          <View className="flex-row items-end justify-around h-[120px] pt-[10px]">
            {categoriasConGasto.slice(0, 6).map((cat) => {
              // Calcula la altura en píxeles de la barra según el gasto máximo del ciclo.
              const altura = Math.max(
                14,
                Math.round((cat.spent / gastoMaximo) * 78),
              );
              const porcentaje = Math.round((cat.spent / totalGastado) * 100);
              const estaActiva = seleccionadaId === cat.id;

              return (
                <Pressable
                  key={`col-${cat.id}`}
                  onPress={() => alternarSeleccion(cat.id)}
                  className="items-center flex-1 px-[2px]"
                  style={{
                    opacity:
                      seleccionadaId === null || estaActiva ? 1 : 0.45,
                  }}
                >
                  <Text className="text-[10px] font-semibold text-text-secondary mb-[4px]">
                    {porcentaje}%
                  </Text>
                  <View
                    className="w-[26px] rounded-t-[8px]"
                    style={{
                      height: altura,
                      backgroundColor: cat.color || "#512DA8",
                    }}
                  />
                  <Text className="text-[15px] mt-[6px]">{cat.icono}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}