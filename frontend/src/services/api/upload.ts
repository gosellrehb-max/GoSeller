import { api } from "../http/client";

export const uploadAPI = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ data?: { url: string }; url?: string }>(
      "/upload/image",
      formData,
    );
    const data = res.data?.data ?? res.data;
    const url = data?.url ?? "";
    if (!url) throw new Error("Upload did not return a URL");
    return { url };
  },
};
