import './styles.css';
import { useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Category {
  id: number;
  description: string;
  estimated_time: number;
  priority: string;
}

function SetCategory() {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [priority, setPriority] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!description || !estimatedTime || !priority) {
      setMessage('Preencha todos os campos.');
      return;
    }

    try {
      const response = await api.post<Category>(
        'http://localhost:8000/api/v1/categories/',
        {
          description,
          estimated_time: parseInt(estimatedTime, 10),
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      setMessage(`Categoria "${response.data.description}" cadastrada com sucesso!`);
      setDescription('');
      setEstimatedTime('');
      setPriority('');
    } catch (error) {
      console.error('Erro ao cadastrar categoria: ', error);
      setMessage('Erro ao cadastrar categoria.');
    }
  }

  return (
    <div className="set-category-container">
      <div className="set-category">
        <form onSubmit={handleSubmit} className="set-category-form">
          <div>
            <label>Descrição:</label>
            <input
              type="text"
              value={description}
              placeholder="Ex: Corte de energia"
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label>Tempo estimado (segundos):</label>
            <input
              type="text"
              value={estimatedTime}
              placeholder="Ex: 300"
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label>Prioridade:</label>
            <input
              type="text"
              value={priority}
              placeholder="Ex: Alta"
              onChange={(e) => setPriority(e.target.value)}
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

export default SetCategory;