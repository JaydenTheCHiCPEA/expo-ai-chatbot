import { View, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { ScrollAdapt } from "@/components/scroll-adapt";
import { useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";
import {
  Clock,
  GraduationCap,
  Trophy,
  Shirt,
  Phone,
  BookOpen,
  type LucideIcon,
} from "lucide-react-native";
import { useStore } from "@/lib/globalStore";
import { generateUUID } from "@/lib/utils";

interface SuggestedActionsProps {
  hasInput?: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const ACTION_STYLES: Record<string, { icon: LucideIcon; gradient: [string, string] }> = {
  clock: { icon: Clock, gradient: ["#3b82f6", "#1d4ed8"] },
  graduation: { icon: GraduationCap, gradient: ["#60a5fa", "#2563eb"] },
  trophy: { icon: Trophy, gradient: ["#38bdf8", "#0284c7"] },
  shirt: { icon: Shirt, gradient: ["#818cf8", "#4f46e5"] },
  phone: { icon: Phone, gradient: ["#0ea5e9", "#0369a1"] },
  book: { icon: BookOpen, gradient: ["#93c5fd", "#3b82f6"] },
};

export function SuggestedActions({
  hasInput = false,
  sendMessage,
}: SuggestedActionsProps) {
  const { selectedImageUris, setChatId } = useStore();
  const { width } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);

  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(
      hasInput || selectedImageUris.length > 0 ? 0 : 1,
      {
        duration: 200,
      },
    );
  }, [hasInput, selectedImageUris]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = async (action: string) => {
    const newChatId = generateUUID();
    setChatId({ id: newChatId, from: "newChat" });

    await sendMessage(action);
  };

  const actions = [
    {
      title: "School hours & contact",
      label: "Hours, phone & email",
      icon: "clock",
      action:
        "What are Manning's School's hours and how can I contact the school?",
    },
    {
      title: "Admissions & enrolment",
      label: "How to register",
      icon: "graduation",
      action: "How do I register my child at Manning's School?",
    },
    {
      title: "Sports & activities",
      label: "Teams & clubs",
      icon: "trophy",
      action: "What sports and activities does Manning's School offer?",
    },
    {
      title: "Uniform & colours",
      label: "What students wear",
      icon: "shirt",
      action: "What are the school's colours and uniform requirements?",
    },
    {
      title: "Contact the office",
      label: "Speak to the school",
      icon: "phone",
      action: "How do I get in touch with the school office?",
    },
    {
      title: "About the school",
      label: "History & motto",
      icon: "book",
      action: "Tell me about the history of Manning's School and its motto.",
    },
  ];

  const cardGap = 12;
  const totalCardsWidth =
    actions.length * (cardWidth || 0) +
    (actions.length - 1) * cardGap;

  const shouldCenter = cardWidth > 0 && width > totalCardsWidth;

  return (
    <Animated.View style={animatedStyle}>
      <ScrollAdapt
        withSnap
        itemWidth={cardWidth}
        contentContainerStyle={{
          minWidth: "100%",
          justifyContent: shouldCenter ? "center" : "flex-start",
        }}
      >
        {actions.map((item, i) => {
          const Icon = ACTION_STYLES[item.icon].icon;
          return (
            <Animated.View
              key={item.action}
              entering={FadeInUp.duration(450).delay(200 + i * 80).springify()}
            >
              <Pressable onPress={() => handlePress(item.action)}>
                <View
                  onLayout={
                    i === 0
                      ? (e) => setCardWidth(e.nativeEvent.layout.width)
                      : undefined
                  }
                  className="mr-3 h-36 w-[240px] overflow-hidden rounded-3xl"
                  style={{
                    borderColor: "rgba(255,255,255,0.75)",
                    borderWidth: 1,
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 14,
                    elevation: 3,
                    ...(!shouldCenter &&
                      i === actions.length - 1 && {
                        marginRight: width - cardWidth,
                      }),
                  }}
                >
                  <BlurView
                    intensity={28}
                    tint="light"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <View className="flex-1 bg-white/40 p-4">
                    <LinearGradient
                      className="h-10 w-10 items-center justify-center rounded-full"
                      colors={["#ffffff", "#eef2ff"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View
                        className="h-7 w-7 items-center justify-center rounded-full"
                        style={{
                          backgroundColor:
                            ACTION_STYLES[item.icon].gradient[1] + "22",
                        }}
                      >
                        <Icon
                          size={16}
                          color={ACTION_STYLES[item.icon].gradient[1]}
                        />
                      </View>
                    </LinearGradient>
                    <Text className="mt-3 text-[15px] font-semibold leading-5">
                      {item.title}
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-gray-500">
                      {item.label}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollAdapt>
    </Animated.View>
  );
}