import './styles.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface Worker {
    id: number;
    name: string;
    team: number;
}

interface TeamTask {
    id: number;
    team: number;
    task: number;
    task_id: number;
    task_status: string;
}

interface GetTeamProps {
    teamId: number;
}

function GetTeam({ teamId }: GetTeamProps) {
    const { handleGetToken } = useAuth();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [tasks, setTasks] = useState<TeamTask[]>([]);
    const [error, setError] = useState<string | null>(null);

    const access = handleGetToken();

    useEffect(() => {
        async function fetchWorkers() {
            try {
                const response = await api.get<Worker[]>(`http://localhost:8000/api/v1/workers/?team=${teamId}`, {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    }
                });
                setWorkers(response.data)
            } catch(error) {
                setError('Erro ao buscar trabalhadores da equipe.');
                console.error(error);
            }
        }

        async function fetchTEamTasks() {
            try {
                const response = await api.get<TeamTask[]>(`http://localhost:8000/api/v1/team_task/?team=${teamId}`, {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    }
                });
                setTasks(response.data);
            } catch(error) {
                setError('Erro ao buscar tarefa da equipe.');
                console.error(error);
            }
        }

        if(access) {
            fetchWorkers();
            fetchTEamTasks();
        }
    }, [teamId, access]);

    return(
        <div className="get-team-container">
        <h2 className="get-team-title">Informações da Equipe {teamId}</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="workers-section">
            <h3>Trabalhadores:</h3>
            {workers.length > 0 ? (
            <ul>
                {workers.map((worker) => (
                <li key={worker.id}>{worker.name}</li>
                ))}
            </ul>
            ) : (
            <p>Nenhum trabalhador encontrado para esta equipe.</p>
            )}
        </div>

        <div className="tasks-section">
            <h3>Tarefas Atuais:</h3>
            {tasks.length > 0 ? (
            <ul>
                {tasks.map((task) => (
                <li key={task.id}>
                    Tarefa #{task.task_id} - Status: {task.task_status}
                </li>
                ))}
            </ul>
            ) : (
            <p>Equipe livre (sem tarefa atual).</p>
            )}
        </div>
        </div>
    );
}


export default GetTeam;