import { UIMessage } from "ai";
import { create } from "zustand";

type ChatIdState = {
  id: string;
  from: "history" | "newChat";
} | null;

export type SelectedFile = {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  uri?: string;
  contentBase64?: string;
  isUploading?: boolean;
};

interface StoreState {
  scrollY: number;
  setScrollY: (value: number) => void;
  selectedImageUris: string[];
  addImageUri: (uri: string) => void;
  removeImageUri: (uri: string) => void;
  clearImageUris: () => void;
  selectedFiles: SelectedFile[];
  addFile: (file: SelectedFile) => void;
  removeFile: (key: string) => void;
  clearFiles: () => void;
  setFileUploading: (key: string, isUploading: boolean) => void;
  setBottomChatHeightHandler: (value: boolean) => void;
  bottomChatHeightHandler: boolean;
  chatId: ChatIdState;
  setChatId: (value: { id: string; from: "history" | "newChat" } | null) => void;
  setFocusKeyboard: (value: boolean) => void;
  focusKeyboard: boolean;
  globalStoreMessages: UIMessage[];
  setGlobalStoreMessages: (value: UIMessage[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  scrollY: 0,
  setScrollY: (value: number) => set({ scrollY: value }),
  selectedImageUris: [],
  addImageUri: (uri: string) =>
    set((state) => ({
      selectedImageUris: [...state.selectedImageUris, uri],
    })),
  removeImageUri: (uri: string) =>
    set((state) => ({
      selectedImageUris: state.selectedImageUris.filter(
        (imageUri) => imageUri !== uri,
      ),
    })),
  clearImageUris: () => set({ selectedImageUris: [] }),
  selectedFiles: [],
  addFile: (file: SelectedFile) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, file],
    })),
  removeFile: (key: string) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((file) => file.key !== key),
    })),
  clearFiles: () => set({ selectedFiles: [] }),
  setFileUploading: (key: string, isUploading: boolean) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.map((file) =>
        file.key === key ? { ...file, isUploading } : file,
      ),
    })),
  bottomChatHeightHandler: false,
  setBottomChatHeightHandler: (value: boolean) =>
    set({ bottomChatHeightHandler: value }),
  chatId: null,
  setChatId: (value) => set({ chatId: value }),
  focusKeyboard: false,
  setFocusKeyboard: (value: boolean) => set({ focusKeyboard: value }),
  globalStoreMessages: [],
  setGlobalStoreMessages: (value: UIMessage[]) =>
    set({ globalStoreMessages: value }),
}));
