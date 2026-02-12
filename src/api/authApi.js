import client from "./client";

export const logoutApi = () =>
  client.post("/api/v1/auth/logout", null, { _skipAuthRetry: true });
