import { useCallback, useEffect, useRef } from "react";
import { fetchChatMessages } from "../services/youtubeApiService";
import useAppStore from "../store/appStore";
import useChatStore from "../store/chatStore";

const DEFAULT_POLLING_INTERVAL = 5000;

const YoutubeChatLoop = () => {
  const apiKey = useAppStore((state) => state.apiKey);
  const liveChatIdFromStore = useAppStore((state) => state.liveChatId);
  const addMessages = useChatStore((state) => state.addMessages);
  const nextPageTokenRef = useRef<string | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const pollMessages = useCallback(async () => {
    stopPolling();

    if (!apiKey || !liveChatIdFromStore) {
      return;
    }

    try {
      const result = await fetchChatMessages(
        apiKey,
        liveChatIdFromStore,
        nextPageTokenRef.current
      );

      if (result) {
        if (result.messages && result.messages.length > 0) {
          const currentAddMessages = useChatStore.getState().addMessages;
          currentAddMessages(result.messages);
        }
        nextPageTokenRef.current = result.nextPageToken;
        console.log(
          "[YoutubeChatLoop] PollingIntervalMillis:",
          result.pollingIntervalMillis
        );
        timeoutIdRef.current = setTimeout(
          pollMessages,
          result.pollingIntervalMillis || DEFAULT_POLLING_INTERVAL
        );
      } else {
        timeoutIdRef.current = setTimeout(
          pollMessages,
          DEFAULT_POLLING_INTERVAL
        );
      }
    } catch (error) {
      console.error("Error polling messages:", error);
      nextPageTokenRef.current = null;
      timeoutIdRef.current = setTimeout(
        pollMessages,
        DEFAULT_POLLING_INTERVAL * 2
      );
    }
  }, [apiKey, liveChatIdFromStore]); // Removed addMessages and nextPageToken from dependencies

  useEffect(() => {
    stopPolling(); // Clear any existing timeout from previous renders/effects

    if (apiKey && liveChatIdFromStore) {
      nextPageTokenRef.current = null;
      pollMessages();
    }

    return () => {
      stopPolling();
    };
  }, [apiKey, liveChatIdFromStore, pollMessages, stopPolling]); // Added stopPolling

  return <></>;
};

export default YoutubeChatLoop;
