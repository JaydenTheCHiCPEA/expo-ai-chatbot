import Constants from "expo-constants";
import { Platform } from "react-native";

function getConfiguredUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
}

function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function swapHost(url: string, newHost: string): string {
  const separatorIndex = url.indexOf("://");
  const port = separatorIndex >= 0 ? url.slice(separatorIndex + 3).split(":")[1] : undefined;
  return `${url.slice(0, separatorIndex + 3)}${newHost}${port ? `:${port}` : ""}`;
}

export function getApiUrl(): string {
  const url = getConfiguredUrl();
  const host = extractHost(url);

  if (Platform.OS === "web") {
    const webHost =
      typeof window !== "undefined" ? window.location.hostname : null;
    if (
      webHost &&
      (host === "localhost" || host === "127.0.0.1") &&
      webHost !== "localhost" &&
      webHost !== "127.0.0.1"
    ) {
      return swapHost(url, webHost);
    }
    return url;
  }

  if (host === "localhost" || host === "127.0.0.1" || host === "10.0.2.2") {
    const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
    if (metroHost) {
      return swapHost(url, metroHost);
    }
  }

  return url;
}
