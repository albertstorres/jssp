import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { Team } from '../GetTeams';

export interface Worker {
  team: number;
  name: string;
}

interface SetWorkerProps {
  selectedTeam: Team | null;
}

function SetWorker({ selectedTeam }: SetWorkerProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedTeam) {
      setMessage('Selecione uma equipe antes de cadastrar.');
      return;
    }

    try {
      const response = await api.post<Worker>(
        'http://localhost:8000/api/v1/workers/',
        {
          name,
          team: selectedTeam.id,
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      setMessage(`Trabalhador "${response.data.name}" cadastrado com sucesso!`);
      setName('');
    } catch (error) {
      console.error('Erro ao cadastrar trabalhador:', error);
      setMessage('Erro ao cadastrar trabalhador.');
    }
  }

  return (
    <div className="set-worker-container">
      <form onSubmit={handleSubmit} className="set-worker-form">
        <div className="form-group">
          <label>Nome:</label>
          <input
            type="text"
            value={name}
            placeholder="Ex: João da Silva"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Cadastrar
        </button>

        {message && <p className="feedback-message">{message}</p>}
      </form>
    </div>
  );
}

export default SetWorker;