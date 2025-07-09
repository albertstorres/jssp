import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { Team } from '../GetTeams';

export interface Worker {
  team: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface SetWorkerProps {
  selectedTeam: Team | null;
}

function SetWorker({ selectedTeam }: SetWorkerProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedTeam) {
      setMessage('Selecione uma equipe antes de cadastrar.');
      return;
    }

    try {
      const url = 'http://localhost:8000/api/v1/workers/';

      const response = await api.post<Worker>(
        url,
        {
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          team: selectedTeam.id,
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      setMessage(`Trabalhador "${response.data.first_name} ${response.data.last_name}" cadastrado com sucesso!`);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
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
            value={firstName}
            placeholder="Ex: João"
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Sobrenome:</label>
          <input
            type="text"
            value={lastName}
            placeholder="Ex: da Silva"
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>E-mail:</label>
          <input
            type="email"
            value={email}
            placeholder="Ex: joao@email.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            placeholder="Digite uma senha"
            onChange={(e) => setPassword(e.target.value)}
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