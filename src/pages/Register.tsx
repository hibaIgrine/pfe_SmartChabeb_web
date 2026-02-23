import { useState } from "react";
import api from "../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
    role: "ADHERENT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users", formData);
      alert("Inscription réussie ! Connectez-vous.");
    } catch (error) {
      alert("Erreur lors de l'inscription");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Créer un compte (Sign Up)</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom"
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
        />
        <br />
        <input
          type="text"
          placeholder="Prénom"
          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
        />
        <br />
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <br />
        <input
          type="password"
          placeholder="Mot de passe"
          onChange={(e) =>
            setFormData({ ...formData, mot_de_passe: e.target.value })
          }
        />
        <br />
        <button type="submit">S'inscrire</button>
      </form>
    </div>
  );
}
