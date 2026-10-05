import { View, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { CustomMarkdown } from "@/components/ui/markdown";
import { useKeyboard } from "@react-native-community/hooks";
import { Text } from "@/components/ui/text";
import WeatherCard from "@/components/weather";
import React, { forwardRef } from "react";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { cn } from "@/lib/utils";

type ToolInvocation = {
  toolName: string;
  toolCallId: string;
  state: string;
  result?: any;
  output?: any;
};

type TextPart = {
  type: "text";
  text: string;
};

type MessagePart = TextPart | { type: string; [key: string]: any };

type Message = {
  id: string;
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
  parts?: MessagePart[];
  content?: string;
  toolInvocations?: ToolInvocation[];
};

type ChatInterfaceProps = {
  messages: Message[];
  scrollViewRef: React.RefObject<ScrollView>;
  isLoading?: boolean;
  topContent?: React.ReactNode;
};

const TypingDots = () => {
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setFrame((f) => f + 1), 250);
    return () => clearInterval(interval);
  }, []);

  const phases: Record<number, number[]> = {
    0: [0.35, 0.7, 1],
    1: [0.7, 1, 0.35],
    2: [1, 0.35, 0.7],
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-row items-center gap-1.5"
    >
      {(phases[frame % 3] ?? phases[0]).map((o, i) => (
        <View
          key={i}
          className="h-2 w-2 rounded-full bg-[#0066ff]"
          style={{ opacity: o }}
        />
      ))}
    </Animated.View>
  );
};

const AssistantAvatar = () => (
  <LinearGradient
    colors={["#38bdf8", "#0ea5e9"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="mr-3 mt-1 h-9 w-9 items-center justify-center rounded-full shadow-sm shadow-accent/30"
  >
    <View className="h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white">
      <Image
        source={require("@/assets/mannings-crest.png")}
        style={{ width: 24, height: 24 }}
        contentFit="contain"
      />
    </View>
  </LinearGradient>
);

export const ChatInterface = forwardRef<ScrollView, ChatInterfaceProps>(
  ({ messages, scrollViewRef, isLoading, topContent }, ref) => {
    const { keyboardShown, keyboardHeight } = useKeyboard();

    const getTextContent = (m: Message): string => {
      if (m.parts && Array.isArray(m.parts)) {
        return m.parts
          .filter(
            (part): part is TextPart =>
              part.type === "text" && typeof part.text === "string",
          )
          .map((part) => part.text)
          .join("");
      }
      if (m.content) {
        return typeof m.content === "string" ? m.content : "";
      }
      return "";
    };

    const hasTextContent = (m: Message): boolean => {
      return getTextContent(m).trim().length > 0;
    };

    return (
      <View className="flex-1">
        <ScrollView
          ref={ref}
          className="flex-1 space-y-4 p-4"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          {!messages.length && (
            <View className="flex-1">
              {topContent ? (
                topContent
              ) : (
                <View className="flex-1" />
              )}
            </View>
          )}
          {messages.length > 0
            ? messages.map((m, index) => (
                <React.Fragment key={m.id}>
                  {m.toolInvocations?.map((t) => {
                    if (t.toolName === "getWeather") {
                      const weatherData = t.output || t.result;

                      if (t.state !== "result" && !weatherData) {
                        return (
                          <View
                            key={t.toolCallId}
                            className={cn(
                              "mt-4 max-w-[85%] rounded-2xl rounded-bl-md border border-accent/20 bg-accent/10 p-4",
                            )}
                          >
                            <ActivityIndicator size="small" color="#0ea5e9" />
                            <Text className="mt-2 text-sm text-foreground/70">
                              Getting weather data...
                            </Text>
                          </View>
                        );
                      }
                      if (weatherData) {
                        return (
                          <WeatherCard
                            key={t.toolCallId}
                            city={weatherData.city || "Unknown"}
                            temperature={weatherData.current.temperature_2m}
                            weatherCode={weatherData.current.weathercode}
                            humidity={weatherData.current.relative_humidity_2m}
                            wind={weatherData.current.wind_speed_10m}
                          />
                        );
                      }
                    }
                    return null;
                  })}

                  {m.role === "assistant" ? (
                    hasTextContent(m) && (
                      <Animated.View
                        entering={FadeInDown.duration(400).springify()}
                        className="flex-row items-start"
                      >
                        <AssistantAvatar />
                        <View className="flex-1 rounded-3xl rounded-tl-md border border-accent/20 bg-card px-4 py-3 shadow-sm shadow-accent/10">
                          <CustomMarkdown content={getTextContent(m)} />
                        </View>
                      </Animated.View>
                    )
                  ) : (
                    <Animated.View
                      entering={FadeInDown.duration(400).springify()}
                      className="flex-row justify-end"
                    >
                      <LinearGradient
                        colors={["#0369a1", "#0ea5e9"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="max-w-[85%] rounded-3xl rounded-br-md px-4 py-2.5 shadow-lg shadow-accent/30"
                      >
                        <Text className="text-[15px] leading-6 text-white">
                          {getTextContent(m)}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  )}

                  {isLoading &&
                    messages[messages.length - 1].role === "user" &&
                    m === messages[messages.length - 1] && (
                      <Animated.View
                        entering={FadeIn.duration(300)}
                        className="flex-row items-center gap-2"
                      >
                        <AssistantAvatar />
                        <View className="rounded-2xl rounded-bl-md border border-blue-100/80 bg-blue-50/80 px-4 py-3">
                          <TypingDots />
                        </View>
                      </Animated.View>
                    )}
                </React.Fragment>
              ))
            : null}
        </ScrollView>
      </View>
    );
  },
);