import api from "./axios";

export async function uploadTaskProof(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/uploads/task-proof", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { url, filename, type }
}

export default { uploadTaskProof };
