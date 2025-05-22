import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLiveChatId } from '../services/youtubeApiService';

interface AppState {
  apiKey: string;
  liveId: string;
  liveChatId: string;
  isLoadingLiveChatId: boolean;
  liveChatIdError: string | null;
  allowHomePageRedirect: boolean;

  setCredentials: (apiKey: string, liveId: string) => Promise<void>;
  clearCredentials: () => void;
  setAllowHomePageRedirect: (value: boolean) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get): AppState => ({
      apiKey: '',
      liveId: '',
      liveChatId: '',
      isLoadingLiveChatId: false,
      liveChatIdError: null,
      allowHomePageRedirect: true, // Novo estado

      setCredentials: async (apiKey: string, liveId: string) => {
        set({ apiKey, liveId, isLoadingLiveChatId: true, liveChatIdError: null, liveChatId: '' });
        try {
          const chatId = await getLiveChatId(apiKey, liveId);
          if (chatId) {
            set({ liveChatId: chatId, isLoadingLiveChatId: false });
          } else {
            set({ liveChatIdError: 'Não foi possível obter o ID do chat ao vivo. Verifique o ID da Live e a Chave de API.', isLoadingLiveChatId: false });
          }
        } catch (error) {
          console.error('Erro ao chamar getLiveChatId:', error);
          set({ liveChatIdError: 'Erro ao buscar ID do chat ao vivo.', isLoadingLiveChatId: false });
        }
      },

      clearCredentials: () => set({
        apiKey: '',
        liveId: '',
        liveChatId: '',
        isLoadingLiveChatId: false,
        liveChatIdError: null,
        allowHomePageRedirect: true,
      }),

      setAllowHomePageRedirect: (value: boolean) => set({ allowHomePageRedirect: value }),
    }),
    {
      name: 'youtube-credentials-storage', 
      // getStorage: () => localStorage, 
      // getStorage: () => localStorage, // (opcional) especifica localStorage (padrão)
    }
  )
);

export default useAppStore;
