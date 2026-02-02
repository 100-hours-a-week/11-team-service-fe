import client from "./client";

// === 채팅방 목록 ===

export const getChatRoomsForJob = (jobMasterId, params = {}) =>
  client.get(`/api/v1/job-postings/${jobMasterId}/chat-rooms`, { params });

export const getMyChatRooms = (params = {}) =>
  client.get("/api/v1/users/me/chat-rooms", { params });

// === 채팅방 관리 ===

export const createChatRoom = (jobMasterId, body) =>
  client.post(`/api/v1/job-postings/${jobMasterId}/chat-rooms`, body);

export const getChatRoomDetail = (chatRoomId) =>
  client.get(`/api/v1/chat-rooms/${chatRoomId}`);

export const joinChatRoom = (chatRoomId) =>
  client.post(`/api/v1/chat-rooms/${chatRoomId}/members`);

export const leaveChatRoom = (chatRoomId) =>
  client.delete(`/api/v1/chat-rooms/${chatRoomId}/members/me`);

export const kickMember = (chatRoomId, chatRoomMemberId) =>
  client.delete(
    `/api/v1/chat-rooms/${chatRoomId}/members/${chatRoomMemberId}`,
  );

export const closeChatRoom = (chatRoomId) =>
  client.delete(`/api/v1/chat-rooms/${chatRoomId}`);

// === 메시지 ===

export const getMessages = (chatRoomId, params = {}) =>
  client.get(`/api/v1/chat-rooms/${chatRoomId}/messages`, { params });

export const sendTextMessage = (chatRoomId, content) => {
  const formData = new FormData();
  formData.append("messageType", "TEXT");
  formData.append("content", content);
  return client.post(`/api/v1/chat-rooms/${chatRoomId}/messages`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const sendFileMessage = (chatRoomId, file) => {
  const formData = new FormData();
  formData.append("messageType", "FILE");
  formData.append("file", file);
  return client.post(`/api/v1/chat-rooms/${chatRoomId}/messages`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// === 멤버 ===

export const getMembers = (chatRoomId) =>
  client.get(`/api/v1/chat-rooms/${chatRoomId}/members`);

export const getMemberProfile = (chatRoomId, chatRoomMemberId) =>
  client.get(
    `/api/v1/chat-rooms/${chatRoomId}/members/${chatRoomMemberId}`,
  );

export const getMemberResume = (chatRoomId, chatRoomMemberId) =>
  client.get(
    `/api/v1/chat-rooms/${chatRoomId}/members/${chatRoomMemberId}/resume`,
  );

export const getMemberPortfolio = (chatRoomId, chatRoomMemberId) =>
  client.get(
    `/api/v1/chat-rooms/${chatRoomId}/members/${chatRoomMemberId}/portfolio`,
  );

export const getMemberComparison = (chatRoomId, chatRoomMemberId) =>
  client.get(
    `/api/v1/chat-rooms/${chatRoomId}/members/${chatRoomMemberId}/comparison`,
  );
