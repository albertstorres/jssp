import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import GetTeams, { Team } from '../GetTeams';

export interface Worker {
    team: number;
    name: string;
}

function SetWorker() {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedTeam) {
      setMessage('Selecione uma equipe.');
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
      setSelectedTeam(null);
    } catch (error) {
      console.error('Erro ao cadastrar trabalhador: ', error);
      setMessage('Erro ao cadastrar trabalhador.');
    }
  }

  return (
    <div className="set-worker-container">
      <div className="set-worker">
        <h2 className="set-worker-title">Cadastro de trabalhador</h2>

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

          <div className="form-group">
            <GetTeams
              onSelectTeam={setSelectedTeam}
              selectedTeams={selectedTeam ? [selectedTeam] : []}
            />
          </div>

          <button type="submit">Cadastrar</button>

          {message && <p className="feedback-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default SetWorker;