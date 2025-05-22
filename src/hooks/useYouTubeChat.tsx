import { useCallback, useEffect, useRef } from "react";
import { fetchChatMessages } from "../services/youtubeApiService";
import useAppStore from "../store/appStore";
import type { ChatMessage } from "../store/chatStore"; // Importar para o tipo de retorno
import useChatStore from "../store/chatStore";
import { useShallow } from 'zustand/react/shallow'; // Import useShallow

// Definindo o tipo para o valor de retorno do hook
interface UseYouTubeChatReturn {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  chatError: string | null;
  isChatDisabled: boolean;
  isPollingActive: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

function useYouTubeChat(): UseYouTubeChatReturn {
  const { apiKey, liveChatId } = useAppStore(
    useShallow((state) => ({
      apiKey: state.apiKey,
      liveChatId: state.liveChatId,
    }))
  );

  const {
    messages,
    nextPageToken,
    pollingIntervalMillis,
    isPollingActive,
    isLoadingMessages,
    chatError,
    isChatDisabled,
    addMessages,
    setNextPageToken,
    setPollingInterval,
    setIsPollingActive,
    setIsLoadingMessages,
    setChatError,
    setIsChatDisabled,
    resetChatState,
  } = useChatStore();

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPollingDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingOperationInProgressRef = useRef<boolean>(false); // Mutex

  const getChatStoreState = useCallback(() => useChatStore.getState(), []);

  const pollMessages = useCallback(async () => {
    if (isPollingOperationInProgressRef.current) {
      // console.log('[useYouTubeChat] Polling operation already in progress, skipping.');
      return;
    }

    const currentStoreState = getChatStoreState();
    const currentNextPageToken = currentStoreState.nextPageToken;

    if (!apiKey || !liveChatId) {
      setChatError("API Key ou Live Chat ID não estão configurados.");
      setIsPollingActive(false);
      return;
    }

    setIsLoadingMessages(true);
    console.log(`[useYouTubeChat] Polling. Token: ${currentNextPageToken}, API Key: ${apiKey ? 'present' : 'absent'}, Live ID: ${liveChatId || 'absent'}`);
    isPollingOperationInProgressRef.current = true;

    try {
      const result = await fetchChatMessages(apiKey, liveChatId, currentNextPageToken);
      setIsLoadingMessages(false);

      if (result) { 
        if (result.chatDisabled) {
          setIsChatDisabled(true);
          setIsPollingActive(false);
          console.warn(
            "Polling interrompido: Chat desabilitado ou não encontrado."
          );
          return;
        }

        addMessages(result.messages);
        setNextPageToken(result.nextPageToken);
        setPollingInterval(result.pollingIntervalMillis);

        if (getChatStoreState().isPollingActive) {
          pollingTimeoutRef.current = setTimeout(
            pollMessages,
            getChatStoreState().pollingIntervalMillis 
          );
        } else {
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        }
      } else {
        setChatError("Não foi possível buscar novas mensagens.");
        if (getChatStoreState().isPollingActive) {
          pollingTimeoutRef.current = setTimeout(
            pollMessages,
            getChatStoreState().pollingIntervalMillis
          );
        } else {
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        }
      }
    } catch (error) { 
      console.error("Erro crítico no polling de mensagens:", error);
      setChatError("Erro crítico ao buscar mensagens.");
      setIsLoadingMessages(false);
      setIsPollingActive(false);
    } finally {
          isPollingOperationInProgressRef.current = false;
    }
  }, [
    apiKey,
    liveChatId,
    addMessages,
    setNextPageToken,
    setPollingInterval,
    setIsLoadingMessages,
    setChatError,
    setIsPollingActive,
    setIsChatDisabled,
    getChatStoreState,
  ]);

  const startPolling = useCallback(() => {
    if (startPollingDebounceTimeoutRef.current) {
      clearTimeout(startPollingDebounceTimeoutRef.current);
    }
    startPollingDebounceTimeoutRef.current = setTimeout(() => {
    console.log('[useYouTubeChat] startPolling called.'); // Log Adicionado
    if (!apiKey || !liveChatId) {
      console.error(
        "Não é possível iniciar o polling: API Key ou Live Chat ID ausentes."
      );
      setChatError(
        "API Key ou Live Chat ID não configurados para iniciar o chat."
      );
      return; // Importante retornar para não prosseguir com estado inválido
    }
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current); // Limpa qualquer timeout anterior
    resetChatState(); // Reseta o estado do chat antes de iniciar um novo polling
          setIsPollingActive(true);
    }, 100); // Debounce de 100ms // Ativa o polling
    setIsChatDisabled(false); // Reseta o estado de chat desabilitado
    // A primeira chamada a pollMessages será feita pelo useEffect abaixo quando isPollingActive se torna true
  }, [
    apiKey,
    liveChatId,
    setIsPollingActive,
    resetChatState, // resetChatState é uma dependência
    setChatError,
    setIsChatDisabled,
    pollingTimeoutRef // pollingTimeoutRef é usado
  ]);

  const stopPolling = useCallback(() => {
    console.log('[useYouTubeChat] stopPolling called.');
    setIsPollingActive(false);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    // Não reseta o estado aqui, para que as mensagens permaneçam visíveis
  }, [setIsPollingActive]);

  useEffect(() => {
    console.log(`[useYouTubeChat Effect] Fired. isPollingActive: ${isPollingActive}, apiKey: ${!!apiKey}, liveChatId: ${!!liveChatId}`);
    if (isPollingActive && apiKey && liveChatId) {
      // console.log('[useYouTubeChat Effect] Conditions met, calling pollMessages()');
      pollMessages(); // Inicia o polling ou continua o ciclo
    } else {
      // Se o polling não estiver ativo ou faltar apiKey/liveChatId, garante que qualquer timeout agendado seja limpo.
      // console.log('[useYouTubeChat Effect] Conditions NOT met or polling stopped, clearing timeout.');
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    }

    // Limpeza ao desmontar o componente ou se as dependências mudarem de forma a parar o polling
    return () => {
      // console.log('[useYouTubeChat Effect] Cleanup. Clearing timeout.');
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [isPollingActive, apiKey, liveChatId, pollMessages]); // pollMessages é uma dependência chave. Se sua identidade mudar, este efeito re-executa.

  return {
    messages,
    isLoadingMessages,
    chatError,
    isChatDisabled,
    isPollingActive,
    startPolling,
    stopPolling,
  };
}

export default useYouTubeChat;
