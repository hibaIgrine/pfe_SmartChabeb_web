import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.17:3000", // L'adresse de NestJS
});

export default api;
