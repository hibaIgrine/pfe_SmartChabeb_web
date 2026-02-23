import { useState } from "react";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", {
        email,
        mot_de_passe: password,
      });

      // ON SAUVEGARDE LE TOKEN DANS LE NAVIGATEUR
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("Connexion réussie !");
      window.location.href = "/dashboard"; // On redirige
    } catch (error) {
      alert("Email ou mot de passe incorrect");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Connexion (Sign In)</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Mot de passe"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
