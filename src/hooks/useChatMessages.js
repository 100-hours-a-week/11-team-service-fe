import { useState, useRef, useCallback, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  getMessages,
  sendTextMessage as apiSendText,
  sendFileMessage as apiSendFile,
} from "../api/chatApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const useChatMessages = (chatRoomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const initialLoadDone = useRef(false);

  // Initial load
  useEffect(() => {
    if (!chatRoomId) return;
    initialLoadDone.current = false;
    setMessages([]);
    setLoading(true);

    const load = async () => {
      try {
        const response = await getMessages(chatRoomId, { size: 50 });
        const data = response.data.data;
        const msgs = data.messages || [];
        setMessages(msgs);
        setHasMore(data.pagination?.hasNext || false);
        initialLoadDone.current = true;
      } catch (e) {
        console.error("Failed to load messages:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chatRoomId]);

  // WebSocket connection
  useEffect(() => {
    if (!chatRoomId) return;

    const client = new Client({
      webSocketFactory: () => {
        const token = localStorage.getItem("accessToken");
        return new SockJS(`${API_BASE_URL}/ws?token=${token}`);
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat-rooms/${chatRoomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => {
            if (prev.some((m) => m.messageId === newMessage.messageId))
              return prev;
            return [...prev, newMessage];
          });
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [chatRoomId]);

  const sendTextMessage = useCallback(
    async (content) => {
      try {
        setSending(true);
        const response = await apiSendText(chatRoomId, content);
        const msg = response.data.data;
        if (msg) {
          setMessages((prev) => {
            if (prev.some((m) => m.messageId === msg.messageId)) return prev;
            return [...prev, msg];
          });
        }
      } finally {
        setSending(false);
      }
    },
    [chatRoomId],
  );

  const sendFileMessage = useCallback(
    async (file) => {
      try {
        setSending(true);
        const response = await apiSendFile(chatRoomId, file);
        const msg = response.data.data;
        if (msg) {
          setMessages((prev) => {
            if (prev.some((m) => m.messageId === msg.messageId)) return prev;
            return [...prev, msg];
          });
        }
      } finally {
        setSending(false);
      }
    },
    [chatRoomId],
  );

  return {
    messages,
    loading,
    sending,
    hasMore,
    sendTextMessage,
    sendFileMessage,
  };
};

export default useChatMessages;
