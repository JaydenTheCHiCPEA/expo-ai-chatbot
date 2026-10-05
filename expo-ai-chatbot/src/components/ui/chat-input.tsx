import type React from "react";
import {
  View,
  type TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Paperclip, ArrowUp, X, FileText } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useAnimatedKeyboard,
  withSpring,
  FadeIn,
  FadeOut,
  withTiming,
  Layout,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatTextInput } from "./chat-text-input";
import { forwardRef, useEffect, useState } from "react";
import { useFilePicker } from "@/hooks/useFilePicker";
import { Image } from "expo-image";
import { useStore, type SelectedFile } from "@/lib/globalStore";
import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/useColorScheme";

type Props = {
  input: string;
  onChangeText: (text: string) => void;
  onSubmit: (message: string) => void;
  scrollViewRef: React.RefObject<ScrollView>;
  focusOnMount?: boolean;
};

interface ImageItemProps {
  file: SelectedFile;
  onRemove: (key: string) => void;
}

const ImageItem = ({ file, onRemove }: ImageItemProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const source = file.uri ? { uri: file.uri } : { uri: file.contentBase64 };

  return (
    <Animated.View
      key={file.key}
      className="relative"
      entering={FadeIn.delay(150).springify()}
    >
      <Image
        source={source}
        style={{
          width: 55,
          height: 55,
          borderRadius: 6,
        }}
        contentFit="cover"
        onLoadEnd={() => setTimeout(() => setIsLoading(false), 1500)}
      >
        {isLoading && (
          <Animated.View className="h-[55px] w-[55px] items-center justify-center rounded-md bg-accent/20">
            <ActivityIndicator size="small" color="#0ea5e9" />
          </Animated.View>
        )}
      </Image>
      <Pressable
        onPress={() => onRemove(file.key)}
        className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full bg-accent/20"
      >
        <X size={12} color="#0ea5e9" />
      </Pressable>
    </Animated.View>
  );
};

interface FileItemProps {
  file: SelectedFile;
  onRemove: (key: string) => void;
  formatFileSize: (bytes: number) => string;
}

const FileItem = ({ file, onRemove, formatFileSize }: FileItemProps) => {
  return (
    <Animated.View
      key={file.key}
      className="relative"
      entering={FadeIn.delay(150).springify()}
    >
      <View className="h-[55px] w-[150px] flex-row items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-3 py-2">
        <FileText size={18} color="#0ea5e9" />
        <View className="flex-1">
          <Text className="text-xs font-medium" numberOfLines={1}>
            {file.name}
          </Text>
          <Text className="text-[10px] text-muted-foreground">
            {file.isUploading ? "Uploading..." : formatFileSize(file.size)}
          </Text>
        </View>
        {file.isUploading && <ActivityIndicator size="small" color="#0ea5e9" />}
      </View>
      <Pressable
        onPress={() => onRemove(file.key)}
        className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full bg-accent/20"
      >
        <X size={12} color="#0ea5e9" />
      </Pressable>
    </Animated.View>
  );
};

export const ChatInput = forwardRef<TextInput, Props>(
  (
    { input, onChangeText, onSubmit, scrollViewRef, focusOnMount = false },
    ref,
  ) => {
    const { bottom } = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();
    const { pickFiles, formatFileSize } = useFilePicker();
    const { selectedFiles, addFile, removeFile } = useStore();

    useEffect(() => {
      if (focusOnMount) {
        (ref as React.RefObject<TextInput>).current?.focus();
      }
    }, [focusOnMount]);

    useEffect(() => {
      const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
      const focusSubscription = Keyboard.addListener("keyboardWillShow", () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });

      return () => {
        showSubscription.remove();
      };
    }, [scrollViewRef]);

    const animatedStyles = useAnimatedStyle(() => ({
      paddingBottom: withSpring(keyboard.height.value - bottom, {
        damping: 20,
        stiffness: 200,
      }),
    }));

    const { colorScheme } = useColorScheme();

    const attachmentsHeight = useAnimatedStyle(
      () => ({
        height: withTiming(selectedFiles.length === 0 ? 0 : 70, {
          duration: 200,
        }),
      }),
      [selectedFiles.length],
    );

    const handleAttach = async () => {
      const files = await pickFiles();
      if (files && files.length > 0) {
        files.forEach((file) => addFile(file));
      }
    };

    const isImage = (file: SelectedFile) => file.mimeType.startsWith("image/");
    const canSend = input.trim().length > 0;

    return (
      <KeyboardAvoidingView>
        <Animated.View style={animatedStyles}>
          <Animated.View
            className="overflow-hidden"
            style={[attachmentsHeight]}
            entering={FadeIn.delay(150).springify()}
            exiting={FadeOut}
            layout={Layout.springify()}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4 overflow-visible px-4 py-2"
              style={{ minHeight: 70 }}
            >
              <View className="flex-row gap-4">
                {selectedFiles.map((file) =>
                  isImage(file) ? (
                    <ImageItem
                      key={file.key}
                      file={file}
                      onRemove={removeFile}
                    />
                  ) : (
                    <FileItem
                      key={file.key}
                      file={file}
                      onRemove={removeFile}
                      formatFileSize={formatFileSize}
                    />
                  ),
                )}
              </View>
            </ScrollView>
          </Animated.View>
          <View className="flex-row items-center gap-2 bg-background px-4 py-2">
            <View
              className={
                "flex-1 flex-row items-center rounded-full border bg-white py-1 pl-1 pr-1 shadow-lg shadow-blue-600/5" +
                (canSend
                  ? " border-blue-300 border-2 ring-2 ring-blue-200/70"
                  : " border-blue-200")
              }
            >
              <Pressable
                onPress={handleAttach}
                className="h-10 w-10 items-center justify-center rounded-full"
                hitSlop={8}
              >
                <Paperclip size={20} color="#0ea5e9" />
              </Pressable>
              <ChatTextInput
                ref={ref}
                noFocus
                className="flex-1 rounded-full bg-transparent py-[8] pl-1"
                placeholder="Message assistant..."
                multiline
                value={input}
                onChangeText={onChangeText}
              />
              <Pressable
                onPress={() => {
                  if (!canSend) return;
                  onSubmit(input);
                  Keyboard.dismiss();
                }}
                disabled={!canSend}
                className="h-9 w-9 items-center justify-center"
                hitSlop={8}
              >
                {canSend ? (
                  <LinearGradient
                    colors={["#0369a1", "#0ea5e9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="h-9 w-9 items-center justify-center rounded-full shadow-lg shadow-accent/40"
                  >
                    <ArrowUp color="white" size={18} />
                  </LinearGradient>
                ) : (
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/20">
                    <ArrowUp color="#0ea5e9" size={18} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  },
);