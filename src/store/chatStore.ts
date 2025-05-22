import { create } from "zustand";

// Detalhes do autor da mensagem
export interface ChatMessageAuthorDetails {
  channelId: string;
  displayName: string;
  profileImageUrl: string;
  isVerified?: boolean;
  isChatOwner?: boolean;
  isChatSponsor?: boolean;
  isChatModerator?: boolean;
}

// Definindo o tipo para uma mensagem individual
export interface ChatMessage {
  id: string;
  // Estes são exemplos, ajuste conforme os dados reais da API do YouTube
  authorDetails?: ChatMessageAuthorDetails;
  snippet?: {
    displayMessage: string;
    publishedAt: string; // ou Date, se for processar
  };
  // Adicione outros campos que a API do YouTube retorna e você usa
}

interface ChatState {
  messages: ChatMessage[];
  lastFetchedMessages: ChatMessage[];

  addMessages: (newMessages: ChatMessage[]) => void;
  resetChatState: () => void;
}

const useChatStore = create<ChatState>()(
  (set, get): ChatState => ({
    messages: [],
    lastFetchedMessages: [], // Armazena apenas as mensagens do último request bem-sucedido

    addMessages: (newMessages: ChatMessage[]) => {
      if (!newMessages || newMessages.length === 0) return;

      set((state) => {
        const existingMessageIds = new Set(
          state.messages.map((msg: ChatMessage) => msg.id)
        );
        const uniqueNewMessages = newMessages.filter(
          (msg: ChatMessage) => !existingMessageIds.has(msg.id)
        );

        if (uniqueNewMessages.length === 0) return {}; // Nenhuma mensagem nova para adicionar

        // Mantém um número máximo de mensagens para evitar sobrecarga de memória/UI
        const MAX_MESSAGES = 100;
        const combinedMessages = [...state.messages, ...uniqueNewMessages];
        const slicedMessages = combinedMessages.slice(-MAX_MESSAGES);

        return {
          messages: slicedMessages,
          lastFetchedMessages: uniqueNewMessages,
        };
      });
    },

    resetChatState: () =>
      set({
        messages: [],
        lastFetchedMessages: [],
      }),
  })
);

export default useChatStore;
