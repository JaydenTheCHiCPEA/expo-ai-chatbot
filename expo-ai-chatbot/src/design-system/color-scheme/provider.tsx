import { useState, useCallback, useEffect } from "react";
import { Appearance, Platform } from "react-native";
import type { ColorSchemeName } from "react-native";

import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme as useTailwindColorScheme } from "nativewind";

import { ColorSchemeContext } from "./context";
import {
  setColorScheme as persistColorScheme,
  setDisabledSystemTheme,
  deleteDisabledSystemTheme,
} from "./store";

export const toggleColorScheme = (isDark?: boolean) => {
  if (Platform.OS !== "android") return;
  NavigationBar.setBackgroundColorAsync(isDark ? "#000" : "#FFF");
  NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
};

export function ColorSchemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const nativewind = useTailwindColorScheme();
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("light");

  const changeTheme = useCallback(
    (newColorScheme: ColorSchemeName) => {
      if (!newColorScheme) return;
      persistColorScheme(newColorScheme);
      setColorScheme(newColorScheme);
      const isDark = newColorScheme === "dark";
      // TODO: build error: comment for now
      // if (isDark) {
      //   toggleColorScheme(isDark);
      //   SystemUI.setBackgroundColorAsync("black");
      //   nativewind.setColorScheme("dark");
      // } else {
      //   toggleColorScheme();
      //   SystemUI.setBackgroundColorAsync("white");
      //   nativewind.setColorScheme("light");
      // }
    },
    [nativewind]
  );

  useEffect(() => {
    const themeChangeListener = () => {
      // Always force the light theme regardless of system preference
      changeTheme("light");
    };
    themeChangeListener();
    const appearanceListener =
      Appearance.addChangeListener(themeChangeListener);
    return () => {
      // @ts-ignore
      appearanceListener.remove();
    };
  }, [changeTheme, colorScheme]);

  const handleColorSchemeChange = (newColorScheme: ColorSchemeName) => {
    if (newColorScheme) {
      changeTheme(newColorScheme);
      setDisabledSystemTheme();
    } else {
      deleteDisabledSystemTheme();
      const theme = Appearance.getColorScheme();
      if (theme) {
        changeTheme(theme);
      }
    }
  };

  return (
    <ColorSchemeContext.Provider
      value={{ colorScheme, setColorScheme: handleColorSchemeChange }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
}
