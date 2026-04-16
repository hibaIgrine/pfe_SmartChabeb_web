import api from "./axios";

export async function fetchEtablissements() {
  const response = await api.get("/etablissements");
  return response.data;
}

export async function searchEtablissements(query: string) {
  const response = await api.get("/etablissements/search", {
    params: { q: query },
  });
  return response.data;
}
