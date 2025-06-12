import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface UnlockRouteProps {
  route: "enigma" | "libras" | "rosa" | "vinho";
  next: string;
}

export const UnlockRoute: React.FC<UnlockRouteProps> = ({ route, next }) => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  // Códigos por rota
  const codes: Record<UnlockRouteProps["route"], string> = {
    enigma: "0000",
    libras: "2624",
    rosa: "3388",
    vinho: "8392",
  };

  const handleSubmit = () => {
    if (input === codes[route]) {
      // ✅ Desbloqueia diretamente via sessionStorage
      const saved = sessionStorage.getItem("route-access");
      const parsed = saved ? JSON.parse(saved) : {};
      const updated = { ...parsed, [route]: true };
      sessionStorage.setItem("route-access", JSON.stringify(updated));

      navigate(next);
    } else {
      alert("Código incorreto!");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Digite o código para desbloquear: {route}</h2>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Digite o código..."
      />
      <button onClick={handleSubmit}>Desbloquear</button>
    </div>
  );
};
