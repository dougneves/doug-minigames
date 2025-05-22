// Este arquivo conterá as funções para interagir com a API do YouTube.
import type { ChatMessage } from '../store/chatStore'; // Importar o tipo ChatMessage

// Tipos para getLiveChatId
interface YouTubeLiveStreamingDetails {
  activeLiveChatId?: string;
}

interface YouTubeVideoItem {
  liveStreamingDetails?: YouTubeLiveStreamingDetails;
  // Outras propriedades do item de vídeo, se necessário
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
  // Outras propriedades da resposta de vídeos, se necessário
}

// Tipos para fetchChatMessages
// A API retorna um objeto que pode incluir 'items', 'nextPageToken', 'pollingIntervalMillis'
interface YouTubeChatMessagesApiResponse {
  items?: ChatMessage[];
  nextPageToken?: string | null;
  pollingIntervalMillis?: number;
  error?: any; // Para capturar a estrutura de erro da API
}

// Nossa função fetchChatMessages retorna uma estrutura um pouco diferente
interface FetchChatMessagesResult {
  messages: ChatMessage[];
  nextPageToken: string | null;
  pollingIntervalMillis: number;
  chatDisabled?: boolean;
}

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Busca o activeLiveChatId de um vídeo ao vivo do YouTube.
 * @param {string} apiKey - Sua chave da API do YouTube.
 * @param {string} videoId - O ID do vídeo da transmissão ao vivo.
 * @returns {Promise<string|null>} O ID do chat ao vivo ou null se não encontrado/erro.
 */
export async function getLiveChatId(apiKey: string, videoId: string): Promise<string | null> {
  if (!apiKey || !videoId) {
    console.error('API Key e Video ID são obrigatórios para buscar o Live Chat ID.');
    return null;
  }

  const params = new URLSearchParams({
    part: 'liveStreamingDetails',
    id: videoId,
    key: apiKey,
  });

  const url = `${YOUTUBE_API_BASE_URL}/videos?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Erro ao buscar Live Chat ID [${response.status}]:`, errorData);
      return null;
    }

    const data: YouTubeVideosResponse = await response.json();

    if (data.items && data.items.length > 0) {
      const liveStreamingDetails = data.items[0].liveStreamingDetails;
      if (liveStreamingDetails && liveStreamingDetails.activeLiveChatId) {
        return liveStreamingDetails.activeLiveChatId;
      } else {
        console.warn('Detalhes da transmissão ao vivo ou activeLiveChatId não encontrados para o vídeo:', videoId);
        return null;
      }
    } else {
      console.warn('Nenhum item encontrado para o vídeo ID:', videoId);
      return null;
    }
  } catch (error) {
    console.error('Erro de rede ou inesperado ao buscar Live Chat ID:', error);
    return null;
  }
}

/**
 * Busca mensagens de um chat ao vivo do YouTube.
 * @param {string} apiKey - Sua chave da API do YouTube.
 * @param {string} liveChatId - O ID do chat ao vivo.
 * @param {string} [pageToken] - O token da página para buscar (para paginação).
 * @returns {Promise<{messages: Array<Object>, nextPageToken: string, pollingIntervalMillis: number}|null>} 
 *          Um objeto com as mensagens, o próximo token de página e o intervalo de polling, ou null em caso de erro.
 */
export async function fetchChatMessages(apiKey: string, liveChatId: string, pageToken?: string | null): Promise<FetchChatMessagesResult | null> {
  if (!apiKey || !liveChatId) {
    console.error('API Key e Live Chat ID são obrigatórios para buscar mensagens.');
    return null;
  }

  const params = new URLSearchParams({
    liveChatId: liveChatId,
    part: 'snippet,authorDetails',
    key: apiKey,
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const url = `${YOUTUBE_API_BASE_URL}/liveChat/messages?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      
      if (response.status === 403 || response.status === 404) {
        const errorReason = errorData.error?.errors?.[0]?.reason;
        if (errorReason === 'liveChatDisabled' || errorReason === 'liveChatNotFound') {
          console.warn(`Chat ao vivo desabilitado ou não encontrado para o ID: ${liveChatId}`);
          return { messages: [], nextPageToken: null, pollingIntervalMillis: 60000, chatDisabled: true };
        }
      }
      return null;
    }

    const data: YouTubeChatMessagesApiResponse = await response.json();

    return {
      messages: data.items || [],
      nextPageToken: data.nextPageToken || null, // Garantir que seja null se undefined
      pollingIntervalMillis: data.pollingIntervalMillis || 10000,
    };
  } catch (error) {
    console.error('Erro de rede ou inesperado ao buscar mensagens do chat:', error);
    return null;
  }
}
