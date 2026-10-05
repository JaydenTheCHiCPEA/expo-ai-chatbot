import { generateUUID } from "@/lib/utils";
import { Stack, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, type TextInput, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetch as expoFetch } from "expo/fetch";
import type { UIMessage } from "ai";
import { LottieLoader } from "@/components/lottie-loader";
import { ChatInterface } from "@/components/chat-interface";
import { ChatInput } from "@/components/ui/chat-input";
import { SuggestedActions } from "@/components/suggested-actions";
import { WelcomeMessage } from "@/components/welcome-message";
import type { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useStore } from "@/lib/globalStore";
import { useChatFromHistory } from "@/hooks/useChatFromHistory";
import { getApiUrl } from "@/lib/apiUrl";
import { RefreshCw, Menu } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { DrawerActions } from "@react-navigation/native";
import { Text } from "@/components/ui/text";

const HomePage = () => {
  const navigation = useNavigation();

  // Use individual selectors to avoid re-rendering on unrelated store changes
  const clearImageUris = useStore((state) => state.clearImageUris);
  const clearFiles = useStore((state) => state.clearFiles);
  const selectedFiles = useStore((state) => state.selectedFiles);
  const setFileUploading = useStore((state) => state.setFileUploading);
  const setBottomChatHeightHandler = useStore((state) => state.setBottomChatHeightHandler);
  const chatId = useStore((state) => state.chatId);
  const setChatId = useStore((state) => state.setChatId);
  const setGlobalStoreMessages = useStore((state) => state.setGlobalStoreMessages);

  const inputRef = useRef<TextInput>(null);

  // Initialize chatId if not set
  useEffect(() => {
    if (!chatId) {
      setChatId({ id: generateUUID(), from: "newChat" });
    }
  }, []);

  // Load messages from history if coming from drawer
  const { initialMessages, loading } = useChatFromHistory({ chatId });

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update messages when initialMessages changes (from history)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Sync messages to global store
  useEffect(() => {
    setGlobalStoreMessages(messages);
  }, [messages, setGlobalStoreMessages]);

  const handleNewChat = useCallback(() => {
    // Reset messages first
    setMessages([]);
    clearImageUris();
    clearFiles();

    // Small delay to ensure state updates have propagated
    setTimeout(() => {
      const newChatId = generateUUID();
      setChatId({ id: newChatId, from: "newChat" });
      inputRef.current?.focus();
      setBottomChatHeightHandler(false);
    }, 100);
  }, [clearImageUris, clearFiles, setBottomChatHeightHandler, setChatId]);

  const handleTextChange = (text: string) => {
    setInput(text);
  };

  const handleFormSubmit = async (message: string) => {
    try {
      if (!message) {
        return;
      }

      setBottomChatHeightHandler(true);
      setIsLoading(true);

      // Add user message
      const userMessage: UIMessage = {
        id: generateUUID(),
        role: "user",
        content: message,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Upload attached files first so the server can read them
      const uploadedFiles: Array<{
        name: string;
        mimeType?: string;
        text?: string | null;
        dataUrl?: string;
      }> = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          setFileUploading(file.key, true);
          try {
            const uploadResponse = await fetch(
              `${getApiUrl()}/api/files/upload`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  filename: file.name,
                  mimeType: file.mimeType,
                  content: file.contentBase64,
                }),
              },
            );

            if (!uploadResponse.ok) {
              throw new Error("File upload failed");
            }

            const uploadData = await uploadResponse.json();
            uploadedFiles.push({
              name: uploadData.filename || file.name,
              mimeType: uploadData.mimeType,
              text: uploadData.text,
              dataUrl: uploadData.dataUrl,
            });
          } finally {
            setFileUploading(file.key, false);
          }
        }
      }

      // Call API
      const response = await fetch(
        `${getApiUrl()}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: chatId?.id,
            message: userMessage,
            files: uploadedFiles,
            selectedChatModel: "mixtral-8x7b-32768",
            selectedVisibilityType: "public",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Handle streaming response (simplified - you may need to implement proper streaming)
      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: UIMessage = {
        id: generateUUID(),
        role: "assistant",
        content: data.message || data.response || "Response received",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setInput("");
      clearImageUris();
      clearFiles();
      setIsLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error submitting message:", error);
      setIsLoading(false);
      // Add error message
      const errorMessage: UIMessage = {
        id: generateUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const { bottom } = useSafeAreaInsets();
  const scrollViewRef = useRef<GHScrollView>(null);

  // Reset messages when chatId changes to a new chat
  useEffect(() => {
    if (chatId && chatId.from === "newChat") {
      setMessages([] as UIMessage[]);
    }
  }, [chatId, setMessages]);

  // Show loading if loading history
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <LottieLoader />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="flex-1 bg-[#f0f9ff]"
      style={{ paddingBottom: bottom }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#f0f9ff" },
          headerTitleAlign: "center",
          headerTitle: () => (
            <View className="items-center">
              <Text
                style={{ fontFamily: "OldEnglishTextMT" }}
                className="text-[24px] leading-7 text-slate-900"
              >
                Manning&apos;s School
              </Text>
              <Text className="mt-0.5 text-center font-inter-600 text-[10px] uppercase tracking-[0.28em] text-[#0066ff]">
                Vita sine litteris mors est
              </Text>
            </View>
          ),
          headerLeft: () => (
            <Pressable
              className="android:mr-4"
              hitSlop={8}
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
                inputRef.current?.blur();
              }}
            >
              <Menu size={22} color="#0066ff" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              disabled={!messages?.length}
              hitSlop={8}
              onPress={handleNewChat}
            >
              <RefreshCw
                size={22}
                opacity={!messages?.length ? 0.4 : 1}
                color="#0066ff"
              />
            </Pressable>
          ),
        }}
      />
      <LinearGradient
        colors={["#dbeafe", "#f0f9ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />
      <View className="container relative mx-auto flex-1 bg-transparent">
        <ChatInterface
          messages={messages}
          scrollViewRef={scrollViewRef}
          isLoading={isLoading}
          topContent={
            <View className="gap-4 pb-4">
              <WelcomeMessage />
              <SuggestedActions
                hasInput={input.length > 0}
                sendMessage={handleFormSubmit}
              />
            </View>
          }
        />
      </View>

      <ChatInput
        ref={inputRef}
        scrollViewRef={scrollViewRef}
        input={input}
        onChangeText={handleTextChange}
        focusOnMount={false}
        onSubmit={handleFormSubmit}
      />
    </Animated.View>
  );
};

export default HomePage;
