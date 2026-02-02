import { useState, useRef, useCallback, useEffect } from "react";
import {
  getMessages,
  sendTextMessage as apiSendText,
  sendFileMessage as apiSendFile,
} from "../api/chatApi";
import usePolling from "./usePolling";

const useChatMessages = (chatRoomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const newestCursorRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Initial load
  useEffect(() => {
    if (!chatRoomId) return;
    initialLoadDone.current = false;
    setMessages([]);
    setLoading(true);
    newestCursorRef.current = null;

    const load = async () => {
      try {
        const response = await getMessages(chatRoomId, { size: 50 });
        const data = response.data.data;
        const msgs = data.messages || [];
        setMessages(msgs);
        setHasMore(data.pagination?.hasNext || false);
        if (msgs.length > 0) {
          newestCursorRef.current = msgs[msgs.length - 1].messageId;
        }
        initialLoadDone.current = true;
      } catch (e) {
        console.error("Failed to load messages:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chatRoomId]);

  // Poll for new messages
  const pollNewMessages = useCallback(async () => {
    if (!chatRoomId || !initialLoadDone.current) return;

    try {
      const params = { size: 50 };
      if (newestCursorRef.current) {
        params.cursor = newestCursorRef.current;
      }
      const response = await getMessages(chatRoomId, params);
      const data = response.data.data;
      const newMsgs = data.messages || [];

      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.messageId));
          const filtered = newMsgs.filter((m) => !existingIds.has(m.messageId));
          if (filtered.length === 0) return prev;
          return [...prev, ...filtered];
        });
        newestCursorRef.current = newMsgs[newMsgs.length - 1].messageId;
      }
    } catch (e) {
      console.error("Failed to poll messages:", e);
    }
  }, [chatRoomId]);

  usePolling(pollNewMessages, 3000, !!chatRoomId && initialLoadDone.current);

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
          newestCursorRef.current = msg.messageId;
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
          newestCursorRef.current = msg.messageId;
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
