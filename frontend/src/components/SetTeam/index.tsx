import './styles.css';
import { FormEvent, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

function SetTeam() {
  const [shift, setShift] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { handleGetToken } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      if (!shift || !name.trim()) {
        setMessage({ type: 'error', text: 'Turno e Nome são obrigatórios.' });
        return;
      }

      const token = handleGetToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Token de autenticação inválido.' });
        return;
      }

      await api.post('http://localhost:8000/api/v1/teams/', { shift, name }, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });

      setMessage({ type: 'success', text: 'Equipe cadastrada com sucesso!' });
      setShift('');
      setName('');

      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error('Erro ao cadastrar equipe:', error);
      setMessage({ type: 'error', text: 'Falha ao cadastrar equipe.' });
    }
  }

  return (
    <div className="set-team-container">
      <div className="set-team">
        <h2 className="set-team-title">Cadastro de Equipe</h2>

        {message && (
          <div className={`feedback-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="set-team-form">
          <input
            className="input"
            type="text"
            placeholder="Turno da equipe em horas(Ex: 8)"
            value={shift}
            onChange={(e) => setShift(Number(e.target.value))}
            required
          />

          <input
            className="input"
            type="text"
            placeholder="Nome da equipe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <button className="btn-green" type="submit">
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetTeam;