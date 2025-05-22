import { useState, useEffect, useCallback, useRef } from 'react';
import useChatStore, { ChatMessage, ChatMessageAuthorDetails } from '../store/chatStore';

export interface JoinedPlayer extends ChatMessageAuthorDetails {}

interface UseJoinGameCommandProps {
  command: string;
}

interface UseJoinGameCommandReturn {
  joinedPlayers: JoinedPlayer[];
  startListening: () => void;
  stopListening: () => void;
  resetPlayers: () => void;
  isListening: boolean;
}

const useJoinGameCommand = ({ command }: UseJoinGameCommandProps): UseJoinGameCommandReturn => {
  const lastFetchedMessages = useChatStore((state) => state.lastFetchedMessages);
  const [joinedPlayers, setJoinedPlayers] = useState<JoinedPlayer[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isListening || !lastFetchedMessages) {
      return;
    }

    const lowerCaseCommand = command.toLowerCase().trim();

    lastFetchedMessages.forEach((message: ChatMessage) => {
      if (!message.id || processedMessageIdsRef.current.has(message.id)) {
        return; // Already processed or no ID
      }

      const displayMessage = message.snippet?.displayMessage?.trim().toLowerCase();

      if (displayMessage === lowerCaseCommand && message.authorDetails) {
        const author = message.authorDetails;
        setJoinedPlayers((prevPlayers) => {
          if (!prevPlayers.find((p) => p.channelId === author.channelId)) {
            return [...prevPlayers, author];
          }
          return prevPlayers;
        });
      }
      processedMessageIdsRef.current.add(message.id);
    });
  }, [lastFetchedMessages, isListening, command]);

  const startListening = useCallback(() => {
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const resetPlayers = useCallback(() => {
    setJoinedPlayers([]);
    processedMessageIdsRef.current.clear();
  }, []);

  return { joinedPlayers, startListening, stopListening, resetPlayers, isListening };
};

export default useJoinGameCommand;
