import client from "./client";

export const getUserMe = async () => {
  const response = await client.get("/api/v1/users/me");
  return response.data.data;
};

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post(
    "/api/v1/files/upload?directory=profiles",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data;
};

export const updateUserMe = async (data) => {
  const response = await client.patch("/api/v1/users/me", data);
  return response.data.data;
};

export const deleteUserMe = async (reason) => {
  const response = await client.delete("/api/v1/users/me", {
    data: { reason },
  });
  return response.data;
};
