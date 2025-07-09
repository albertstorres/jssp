import './styles.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  team: number | null;
}

interface Team {
  id: number;
  name: string;
}

interface GetWorkerProps {
  workerId: number;
}

function GetWorker({ workerId }: GetWorkerProps) {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorker() {
      try {
        const response = await api.get<Worker>(`http://localhost:8000/api/v1/workers/${workerId}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setWorker(response.data);
        console.log("Worker recebido:", response.data);

        if (response.data.team) {
          const teamResponse = await api.get<Team>(`http://localhost:8000/api/v1/teams/${response.data.team}/`, {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          });
          setTeam(teamResponse.data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do trabalhador:', error);
        setError('Erro ao buscar informações do trabalhador.');
      }
    }

    if (access) {
      fetchWorker();
    }
  }, [workerId, access]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!worker) {
    return <p>Carregando trabalhador...</p>;
  }

  return (
    <div className="get-worker-container">
      <h2 className="get-worker-title">Informações do Trabalhador</h2>
      <ul>
        <li><strong>Nome:</strong> {worker.first_name} {worker.last_name}</li>
        <li><strong>Equipe:</strong> {team ? team.name : `Equipe ID: ${worker.team}`}</li>
      </ul>
    </div>
  );
}

export default GetWorker;