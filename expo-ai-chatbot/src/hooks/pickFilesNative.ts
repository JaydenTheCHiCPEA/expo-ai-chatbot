import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import type { SelectedFile } from "@/lib/globalStore";
import { generateFileKey } from "./useFilePicker";

export async function pickFilesNative(): Promise<SelectedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    type: "*/*",
  });

  if (result.canceled || result.assets.length === 0) {
    return [];
  }

  const selected: SelectedFile[] = [];

  for (const asset of result.assets) {
    if ((asset.size ?? 0) > 5 * 1024 * 1024) continue;

    const contentBase64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    selected.push({
      key: generateFileKey(),
      name: asset.name,
      size: asset.size ?? 0,
      mimeType: asset.mimeType || "application/octet-stream",
      uri: asset.uri,
      contentBase64,
      isUploading: false,
    });
  }

  return selected;
}
