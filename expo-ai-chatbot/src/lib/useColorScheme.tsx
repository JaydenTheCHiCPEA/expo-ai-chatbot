export function useColorScheme() {
  // The app is light-only: always report the light color scheme.
  return {
    colorScheme: "light",
    isDarkColorScheme: false,
    setColorScheme: () => {},
    toggleColorScheme: () => {},
  };
}
