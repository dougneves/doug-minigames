import { create } from 'zustand';

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
  nextPageToken: string | null;
  pollingIntervalMillis: number;
  isPollingActive: boolean;
  isLoadingMessages: boolean;
  chatError: string | null;
  isChatDisabled: boolean;
  lastFetchedMessages: ChatMessage[];

  addMessages: (newMessages: ChatMessage[]) => void;
  setNextPageToken: (token: string | null) => void;
  setPollingInterval: (interval: number) => void;
  setIsPollingActive: (isActive: boolean) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
  setChatError: (error: string | null) => void;
  setIsChatDisabled: (isDisabled: boolean) => void;
  resetChatState: () => void;
}

const useChatStore = create<ChatState>()((set, get): ChatState => ({
  messages: [],
  nextPageToken: null,
  pollingIntervalMillis: 10000, // Valor inicial padrão
  isPollingActive: false,
  isLoadingMessages: false,
  chatError: null,
  isChatDisabled: false, // Indica se o chat da live está desabilitado/não encontrado
  lastFetchedMessages: [], // Armazena apenas as mensagens do último request bem-sucedido

  addMessages: (newMessages: ChatMessage[]) => {
    if (!newMessages || newMessages.length === 0) return;

    set((state) => {
      const existingMessageIds = new Set(state.messages.map((msg: ChatMessage) => msg.id));
      const uniqueNewMessages = newMessages.filter((msg: ChatMessage) => !existingMessageIds.has(msg.id));
      
      if (uniqueNewMessages.length === 0) return {}; // Nenhuma mensagem nova para adicionar

      // Mantém um número máximo de mensagens para evitar sobrecarga de memória/UI
      const MAX_MESSAGES = 100; 
      const combinedMessages = [...state.messages, ...uniqueNewMessages];
      const slicedMessages = combinedMessages.slice(-MAX_MESSAGES);

      return { messages: slicedMessages, lastFetchedMessages: uniqueNewMessages };
    });
  },

  setNextPageToken: (token: string | null) => set({ nextPageToken: token }),

  setPollingInterval: (interval: number) => {
    // Garante um intervalo mínimo para evitar spam na API
    const minInterval = 5000; // 5 segundos
    set({ pollingIntervalMillis: Math.max(interval || minInterval, minInterval) });
  },

  setIsPollingActive: (isActive: boolean) => set({ isPollingActive: isActive }),

  setIsLoadingMessages: (isLoading: boolean) => set({ isLoadingMessages: isLoading }),

  setChatError: (error: string | null) => set({ chatError: error }),

  setIsChatDisabled: (isDisabled: boolean) => set({ isChatDisabled: isDisabled }),

  resetChatState: () => set({
    messages: [],
    nextPageToken: null,
    pollingIntervalMillis: 10000,
    isPollingActive: false,
    isLoadingMessages: false,
    chatError: null,
    isChatDisabled: false,
    lastFetchedMessages: [],
  }),
}));

export default useChatStore;
