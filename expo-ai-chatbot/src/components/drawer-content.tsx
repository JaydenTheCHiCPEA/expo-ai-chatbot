import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { getChatsByUserId } from "@/lib/api-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/lib/globalStore";

type Chat = {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
};

const groupChatsByDate = (chats: Chat[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return chats.reduce(
    (groups: Record<string, Chat[]>, chat) => {
      const chatDate = new Date(chat.createdAt);
      chatDate.setHours(0, 0, 0, 0);

      if (chatDate.getTime() === today.getTime()) {
        groups.today = [...(groups.today || []), chat];
      } else if (chatDate.getTime() === yesterday.getTime()) {
        groups.yesterday = [...(groups.yesterday || []), chat];
      } else if (chatDate >= lastWeek) {
        groups.lastWeek = [...(groups.lastWeek || []), chat];
      } else if (chatDate >= lastMonth) {
        groups.lastMonth = [...(groups.lastMonth || []), chat];
      } else {
        groups.older = [...(groups.older || []), chat];
      }
      return groups;
    },
    {} as Record<string, Chat[]>,
  );
};

export function DrawerContent() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const router = useRouter();

  // Use individual selectors to avoid re-rendering on unrelated store changes
  const chatId = useStore((state) => state.chatId);
  const setChatId = useStore((state) => state.setChatId);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const result = await getChatsByUserId();
      const data = Array.isArray(result) ? result : result?.chats;

      if (Array.isArray(data)) {
        setChats(data);
        if (data.length > 0) {
          setRetryAttempt(0);
        } else {
          setRetryAttempt((prev) => prev + 1);
        }
      } else {
        setRetryAttempt((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      setRetryAttempt((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount or when auth changes
  useEffect(() => {
    fetchChats();
  }, [chatId]);

  const groupedChats = groupChatsByDate(chats);
  const { top, bottom } = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: top,
        paddingBottom: bottom,
      }}
    >
      <LinearGradient
        colors={["#eff6ff", "#e0f2fe"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="mx-3 mt-3 flex-row items-center gap-3 overflow-hidden rounded-2xl border border-blue-100 px-4 py-3"
      >
        <LinearGradient
          colors={["#38bdf8", "#0066ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-10 w-10 items-center justify-center rounded-full shadow-sm shadow-blue-500/30"
        >
          <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
            <Image
              source={require("@/assets/mannings-crest.png")}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
            />
          </View>
        </LinearGradient>
        <View>
          <Text className="font-inter-700 text-base text-slate-900">
            Azul
          </Text>
          <Text className="text-[11px] text-slate-500">
            Manning's School assistant
          </Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-2">
        {isLoading && chats.length === 0 ? (
          <Text className="mt-4 text-center text-muted-foreground">
            Loading chats...
          </Text>
        ) : chats.length === 0 ? (
          <Text className="mt-4 text-center text-muted-foreground">
            No chats yet
          </Text>
        ) : (
          (Object.entries(groupedChats) as [string, Chat[]][]).map(
            ([period, periodChats]) => (
              <View key={period} className="mt-4">
                <Text className="mb-2 px-2 py-1 text-[11px] font-inter-600 uppercase tracking-wider text-blue-500/70">
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
                {periodChats.map((chat) => (
                  <Pressable
                    key={chat.id}
                    onPress={() => {
                      setChatId({ id: chat.id, from: "history" });
                      router.back();
                    }}
                    className="flex-row items-center rounded-xl px-2 py-2 hover:bg-blue-50 active:bg-blue-100"
                  >
                    <Text
                      className="flex-1 text-sm text-slate-700"
                      numberOfLines={1}
                    >
                      {chat.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ),
          )
        )}
      </ScrollView>
    </View>
  );
}
