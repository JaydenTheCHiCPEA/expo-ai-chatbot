import { Platform } from "react-native";
import type { SelectedFile } from "@/lib/globalStore";

export function generateFileKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FilePickerResult = {
  pickFiles: () => Promise<SelectedFile[] | undefined>;
  formatFileSize: (bytes: number) => string;
};

export function useFilePicker(): FilePickerResult {
  const pickFiles = async (): Promise<SelectedFile[] | undefined> => {
    try {
      if (Platform.OS === "web") {
        return await pickFilesWeb();
      }
      const { pickFiles: pickFilesNative } = await import("./pickFilesNative");
      return await pickFilesNative();
    } catch (error) {
      console.error("Failed to pick files:", error);
      return undefined;
    }
  };

  return { pickFiles, formatFileSize: formatSize };
}

function pickFilesWeb(): Promise<SelectedFile[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept =
      ".pdf,.txt,.md,.markdown,.csv,.json,.log,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.c,.cpp,.h,.sql,.xml,.html,.css,.yaml,.yml,.ini,.sh,.svg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*";

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      const selected: SelectedFile[] = [];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) continue;

        const base64 = await readFileAsBase64(file);
        if (!base64) continue;

        selected.push({
          key: generateFileKey(),
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          contentBase64: base64,
          isUploading: false,
        });
      }

      input.remove();
      resolve(selected);
    };

    input.oncancel = () => {
      input.remove();
      resolve([]);
    };

    input.click();
  });
}

function readFileAsBase64(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}
