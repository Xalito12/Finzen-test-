import { StyleSheet } from "react-native";

export const layout = StyleSheet.create({
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 720,
    minWidth: 0,
    minHeight: 0,
    alignSelf: "center",
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
});