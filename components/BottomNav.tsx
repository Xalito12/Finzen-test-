// Importa los iconos utilizados en la barra.
import { Feather } from "@expo/vector-icons";

// Define el tipo de datos que recibe la barra de navegación.
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import React from "react";

// Importa los componentes y herramientas de React Native.
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Permite conocer los espacios reservados por el sistema del teléfono.
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importa la lista de pestañas que se mostrarán.
import { pestanasVisibles } from "../navigation/rutas";

// Componente que muestra la barra inferior.
// state contiene las rutas y la pestaña activa.
// navigation permite cambiar de pantalla y emitir eventos.
export default function BottomNav({state,navigation,}: BottomTabBarProps) {
  // Obtiene los márgenes de seguridad del dispositivo.
  const insets = useSafeAreaInsets();

  return (
    <View
      // Indica a las herramientas de accesibilidad que es una lista de pestañas.
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          // Usa el mayor entre el margen inferior del sistema
          // y el espacio mínimo definido para cada plataforma.
          paddingBottom: Math.max(
            insets.bottom,
            Platform.OS === "android" ? 12 : 16,
          ),
        },
      ]}
    >
      {/* Recorre las pestañas para crear sus botones. */}
      {pestanasVisibles.map((tab) => {
        // Busca la ruta correspondiente a esta pestaña.
        const route = state.routes.find(
          (item) => item.name === tab.name,
        );

        // Omite la pestaña si su ruta no está registrada.
        if (!route) return null;

        // Comprueba si esta es la pestaña que está abierta.
        const selected =
          state.routes[state.index].key === route.key;

        // Identifica la pestaña que mostrará el botón central +.
        const isAdd = tab.name === "Gasto";

        // Define el color de las pestañas normales según su selección.
        const color = selected ? "#512DA8" : "#6B6580";

        // Se ejecuta cuando el usuario toca una pestaña.
        const onPress = () => {
          // Avisa al navegador que se presionó una pestaña.
          // Los manejadores de este evento pueden cancelar la navegación.
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          // Cambia de pantalla si la pestaña no estaba seleccionada
          // y el evento no fue cancelado.
          if (!selected && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            // Identificador único del botón.
            key={route.key}
            // Opacidad del botón mientras está presionado.
            activeOpacity={0.65}
            // Información para lectores de pantalla.
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              isAdd ? "Registrar gasto" : tab.label
            }
            // Ejecuta el cambio de pantalla al tocar el botón.
            onPress={onPress}
            // Emite un evento al mantener presionado el botón.
            onLongPress={() =>
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              })
            }
            style={styles.tab}
          >
            {isAdd ? (
              // Muestra el botón circular para registrar un gasto.
              <View style={styles.addButton}>
                <Feather
                  name="plus"
                  size={28}
                  color="#fff"
                />
              </View>
            ) : (
              // Muestra el icono y el nombre de las otras pestañas.
              <>
                <Feather
                  name={tab.icon}
                  size={22}
                  color={color}
                />

                <Text
                  // Mantiene el nombre en una sola línea.
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color,
                      // Resalta el nombre de la pestaña seleccionada.
                      fontWeight: selected ? "700" : "500",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Estilos utilizados por la barra inferior.
const styles = StyleSheet.create({
  // Contenedor horizontal que ocupa todo el ancho.
  bar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",

    // Línea que separa la barra del contenido.
    borderTopWidth: 1,
    borderTopColor: "#E8E4F0",

    // Espacios internos de la barra.
    paddingHorizontal: 8,
    paddingTop: 8,

    // Configuración de la sombra.
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  // Cada pestaña ocupa un 20 % del ancho disponible.
  // Su contenido queda centrado horizontal y verticalmente.
  tab: {
    width: "20%",
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },

  // Apariencia del botón circular central.
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#512DA8",
    alignItems: "center",
    justifyContent: "center",
  },

  // Apariencia del nombre que aparece debajo de cada icono.
  label: {
    width: "100%",
    marginTop: 3,
    fontSize: 11,
    textAlign: "center",
  },
});