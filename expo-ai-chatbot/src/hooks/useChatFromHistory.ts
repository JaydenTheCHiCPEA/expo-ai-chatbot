import { useState, useEffect } from "react";
import type { UIMessage } from "ai";
import { convertToUIMessages } from "@/lib/utils";
import { getApiUrl } from "@/lib/apiUrl";

type ChatIdState = {
  id: string;
  from: "history" | "newChat";
} | null;

interface UseChatFromHistoryProps {
  chatId: ChatIdState;
}

export function useChatFromHistory({ chatId }: UseChatFromHistoryProps) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chatId?.id && chatId.from === "history") {
      setLoading(true);
      fetch(`${getApiUrl()}/api/chat/${chatId.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const messages = Array.isArray(res) ? res : res.messages;
          console.log(">>> messages from history:", messages);

          if (messages && messages.length) {
            const uiMessages = convertToUIMessages(messages);
            console.log(">>> uiMessages:", uiMessages);
            setInitialMessages(uiMessages);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(">>> Error fetching chat messages:", err);
          setInitialMessages([]);
          setLoading(false);
        });
    }
  }, [chatId]);

  return { initialMessages, loading };
}