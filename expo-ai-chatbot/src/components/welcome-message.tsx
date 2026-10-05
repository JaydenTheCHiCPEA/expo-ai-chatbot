import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { ParticleBackground } from "@/components/particle-background";

export const WelcomeMessage = () => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.05, { duration: 2400 }), -1, true);
  }, [pulse]);

  const crestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View className="relative mx-auto w-full overflow-hidden rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-xl shadow-blue-500/5">
      <ParticleBackground count={48} />
      <View className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

      <View className="mx-auto w-full max-w-md items-center justify-center py-2">
        <Animated.View entering={ZoomIn.springify().damping(14)} style={crestStyle}>
          <LinearGradient
            colors={["#38bdf8", "#0066ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-24 w-24 items-center justify-center rounded-full shadow-lg shadow-blue-500/30"
          >
            <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-white">
              <Image
                source={require("@/assets/mannings-crest.png")}
                style={{ width: 78, height: 78 }}
                contentFit="contain"
              />
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500).delay(250)}
          className="mt-6 items-center"
        >
          <Text className="text-center font-inter-600 text-[12px] uppercase tracking-[0.34em] text-slate-400">
            Welcome! I&apos;m
          </Text>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              textShadowColor: "rgba(0, 102, 255, 0.3)",
              textShadowOffset: { width: 0, height: 3 },
              textShadowRadius: 12,
            }}
            className="mt-1 text-center text-[38px] tracking-tight text-[#0066ff]"
          >
            Azul
          </Text>
          <Text className="mt-3 text-center text-[14px] leading-6 text-slate-600">
            Your assistant for school hours, admissions, sports, and more. Ask
            me anything.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};