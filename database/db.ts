import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";


export const db = Platform.OS !== "web" ? SQLite.openDatabaseSync("mi_base_datos.db") : null;