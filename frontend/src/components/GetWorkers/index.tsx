import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  team: number;
}

interface TeamInfo {
  id: number;
  name: string;
}

interface GetWorkerProps {
  onSelectWorker?: (worker: Worker, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedWorkers?: Worker[];
}

function GetWorkers({ onSelectWorker, selectedWorkers = [] }: GetWorkerProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teamNames, setTeamNames] = useState<Record<number, string>>({});
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchWorkers() {
      try {
        const response = await api.get<Worker[]>('http://localhost:8000/api/v1/workers/', {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setWorkers(response.data);

        // Coletar os IDs únicos das equipes desses workers
        const uniqueTeamIds = Array.from(new Set(response.data.map((worker) => worker.team)));

        // Buscar os nomes das equipes
        const teamFetches = uniqueTeamIds.map(async (teamId) => {
          try {
            const teamResponse = await api.get<TeamInfo>(`http://localhost:8000/api/v1/teams/${teamId}/`, {
              headers: {
                Authorization: `Bearer ${access}`,
              },
            });
            return { id: teamId, name: teamResponse.data.name };
          } catch (error) {
            console.error(`Erro ao buscar equipe ${teamId}`, error);
            return { id: teamId, name: `Equipe ${teamId}` }; // Fallback
          }
        });

        const teamsResult = await Promise.all(teamFetches);
        const teamsMap: Record<number, string> = {};
        teamsResult.forEach((team) => {
          teamsMap[team.id] = team.name;
        });
        setTeamNames(teamsMap);

      } catch (error) {
        console.error("Erro ao buscar trabalhadores:", error);
      }
    }

    if (access) {
      fetchWorkers();
    }
  }, [access]);

  const isSelected = (worker: Worker) =>
    selectedWorkers.some((selected) => selected.id === worker.id);

  return (
    <div className="get-workers-container">
      <div className="get-workers">
        <h2 className="get-workers-title">Selecione os trabalhadores:</h2>
        <ul className="worker-list">
          {workers.map((worker) => (
            <li
              key={worker.id}
              onClick={(event) => onSelectWorker && onSelectWorker(worker, event)}
              className={`worker-item ${isSelected(worker) ? "selected" : ""}`}
              style={{ cursor: onSelectWorker ? "pointer" : "default" }}
            >
              <div className="worker-info-line">
                <span className="worker-info-label">Nome:</span>
                <span className="worker-info-value">{worker.first_name} {worker.last_name}</span>
              </div>
              <div className="worker-info-line">
                <span className="worker-info-label">Equipe:</span>
                <span className="worker-info-value">
                  {teamNames[worker.team] || `Equipe ${worker.team}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GetWorkers;