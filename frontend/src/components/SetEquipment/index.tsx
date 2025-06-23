import './styles.css';
import { useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";
import type { Equipment } from "../GetEquipments";

function SetEquipment() {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [name, setName] = useState('');
  const [downTimeSeconds, setDownTimeSeconds] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if(!name || !downTimeSeconds) {
      setMessage('Preencha todos os campos.');
      return;
    }

    try {
      const response = await api.post<Equipment>(
        'http://localhost:8000/api/v1/equipments/',
        {
          name,
          downtime_seconds: parseInt(downTimeSeconds, 10),
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      setMessage(`Equipamento "${response.data.name}" cadastrado com sucesso!`);
      setName('');
      setDownTimeSeconds('');

    } catch(error) {
      console.error('Erro ao cadastrar equipamento: ', error);
      setMessage('Erro ao cadastrar equipamento.');
    }
  }

  return (
    <div className="set-equipment-container">
      <div className="set-equipment">
        <form onSubmit={handleSubmit} className="set-equipment-form">
          <div>
            <label>Nome:</label>
            <input
              type="text"
              value={name}
              placeholder="Ex: Escada"
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label>Tempo de inatividade (segundos): </label>
            <input
              type = "text"
              value = {downTimeSeconds}
              placeholder = "Ex: 300"
              onChange={(e) => setDownTimeSeconds(e.target.value)}
              className="input"
              required
            />
          </div>

          <button type="submit">Cadastrar</button>

          {message && <p className="feedback-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default SetEquipment;