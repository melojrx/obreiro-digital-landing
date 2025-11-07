/**
 * Hook customizado para Server-Sent Events (SSE)
 * 
 * Gerencia conexão persistente com o backend para receber eventos em tempo real.
 * Inclui reconexão automática, tratamento de erros e cleanup adequado.
 * 
 * @example
 * ```typescript
 * const { data, isConnected, error } = useSSE<NotificationCountData>({
 *   url: '/api/v1/notifications/stream/',
 *   eventName: 'notification_count',
 *   onMessage: (data) => console.log('Nova contagem:', data.count),
 *   enabled: true,
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SSEOptions<T> {
  /** URL do endpoint SSE (ex: '/api/v1/notifications/stream/') */
  url: string;
  
  /** Nome do evento a escutar (ex: 'notification_count', 'new_notification') */
  eventName: string;
  
  /** Callback quando mensagem é recebida */
  onMessage?: (data: T) => void;
  
  /** Callback quando conexão é estabelecida */
  onConnect?: () => void;
  
  /** Callback quando erro ocorre */
  onError?: (error: Event) => void;
  
  /** Se deve tentar reconectar automaticamente (default: true) */
  autoReconnect?: boolean;
  
  /** Delay entre tentativas de reconexão em ms (default: 5000) */
  reconnectDelay?: number;
  
  /** Máximo de tentativas de reconexão (default: Infinity) */
  maxReconnectAttempts?: number;
  
  /** Se o SSE está habilitado (default: true) */
  enabled?: boolean;
  
  /** Headers customizados para a requisição */
  headers?: Record<string, string>;
}

export interface SSEState<T> {
  /** Últimos dados recebidos */
  data: T | null;
  
  /** Se está conectado ao servidor */
  isConnected: boolean;
  
  /** Último erro ocorrido */
  error: Event | null;
  
  /** Número de tentativas de reconexão */
  reconnectAttempts: number;
  
  /** Função para forçar reconexão */
  reconnect: () => void;
  
  /** Função para fechar conexão */
  close: () => void;
}

export function useSSE<T = unknown>(options: SSEOptions<T>): SSEState<T> {
  const {
    url,
    eventName,
    onMessage,
    onConnect,
    onError,
    autoReconnect = true,
    reconnectDelay = 5000,
    maxReconnectAttempts = Infinity,
    enabled = true,
    headers,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Cria a URL completa com headers como query params se necessário
   * EventSource não suporta headers customizados nativamente
   */
  const buildUrl = useCallback(() => {
    if (!headers || Object.keys(headers).length === 0) {
      return url;
    }

    // Para SSE, headers precisam ser enviados via cookies (autenticação)
    // ou incluídos na URL se absolutamente necessário
    // Neste caso, usamos cookies para autenticação (sessionid)
    return url;
  }, [url, headers]);

  /**
   * Conecta ao servidor SSE
   */
  const connect = useCallback(() => {
    if (!enabled || !isMountedRef.current) {
      return;
    }

    try {
      // Fechar conexão existente se houver
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Criar nova conexão EventSource
      const eventSource = new EventSource(buildUrl(), {
        withCredentials: true, // Importante para enviar cookies (autenticação)
      });

      eventSourceRef.current = eventSource;

      // Evento: Conexão estabelecida
      eventSource.addEventListener('connected', () => {
        if (!isMountedRef.current) return;
        
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        
        if (onConnect) {
          onConnect();
        }

        console.log(`[SSE] Conectado: ${eventName}`);
      });

      // Evento: Mensagem do tipo especificado
      eventSource.addEventListener(eventName, (event) => {
        if (!isMountedRef.current) return;

        try {
          const parsedData = JSON.parse(event.data) as T;
          setData(parsedData);

          if (onMessage) {
            onMessage(parsedData);
          }
        } catch (err) {
          console.error(`[SSE] Erro ao parsear dados do evento ${eventName}:`, err);
        }
      });

      // Evento: Heartbeat (mantém conexão viva)
      eventSource.addEventListener('heartbeat', () => {
        // Apenas para manter conexão viva, não precisa fazer nada
      });

      // Evento: Erro do servidor
      eventSource.addEventListener('error', (event) => {
        if (!isMountedRef.current) return;

        console.error(`[SSE] Erro recebido do servidor:`, event);
        setError(event);

        if (onError) {
          onError(event);
        }
      });

      // Evento: Erro de conexão (nativo do EventSource)
      eventSource.onerror = (event) => {
        if (!isMountedRef.current) return;

        console.error('[SSE] Erro de conexão:', event);
        setIsConnected(false);
        setError(event);

        if (onError) {
          onError(event);
        }

        // Tentar reconectar se habilitado
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts((prev) => prev + 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(`[SSE] Tentando reconectar... (tentativa ${reconnectAttempts + 1})`);
              connect();
            }
          }, reconnectDelay);
        }
      };

    } catch (err) {
      console.error('[SSE] Erro ao criar EventSource:', err);
    }
  }, [
    enabled,
    buildUrl,
    eventName,
    onMessage,
    onConnect,
    onError,
    autoReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectDelay,
  ]);

  /**
   * Fecha a conexão SSE
   */
  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    console.log('[SSE] Conexão fechada');
  }, []);

  /**
   * Força reconexão
   */
  const reconnect = useCallback(() => {
    close();
    setReconnectAttempts(0);
    connect();
  }, [close, connect]);

  // Conectar quando componente montar ou opções mudarem
  useEffect(() => {
    if (enabled) {
      connect();
    }

    // Cleanup quando desmontar
    return () => {
      isMountedRef.current = false;
      close();
    };
  }, [enabled, connect, close]);

  return {
    data,
    isConnected,
    error,
    reconnectAttempts,
    reconnect,
    close,
  };
}
