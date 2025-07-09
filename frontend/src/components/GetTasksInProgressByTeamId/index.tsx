import './styles.css';
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

export interface Task {
    id: number;
    status: string;
    team_info: {
        id: number;
        name: string;
        shift: number;
        is_ocupied: boolean;
    };
    created_at: string;
    finished_at: string | null;
    team: number;
    categorie: number;
}

interface GetTAsksInProgressProps {
    onSelectTask?: (task: Task, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
    selectedTasks?: Task[];
    reloadSignal?: number;
}

function GetTasksInProgressByTeamId({
    onSelectTask,
    selectedTasks = [],
    reloadSignal,
}: GetTAsksInProgressProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { handleGetToken } = useAuth();
    const access = handleGetToken();
    
    useEffect(() => {
        async function fetchTasks() {
            if (!access) return;

            try {
                const tokenPayload = JSON.parse(atob(access.split('.')[1]));
                const teamId = tokenPayload.team_id;

                const url = `http://localhost:8000/api/v1/tasks/?status=in_progress&team=${teamId}`;

                const response = await api.get<Task[]>(url, {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                });

                setTasks(response.data);
            } catch(error) {
                console.error('Erro ao buscar tarefas em andamento da equipe: ', error);
            }
        }

        if (access) {
            fetchTasks();
        }
    }, [access, reloadSignal]);

    const isSelected = (task: Task) =>
        selectedTasks.some((selected) => selected.id === task.id);
    
    return(
    <div className="get-tasks-container">
      <div className="get-tasks">
        <h2 className="get-tasks-title">Tarefas em Andamento da sua Equipe</h2>

        <ul className="task-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={(event) => onSelectTask && onSelectTask(task, event)}
              className={`task-item ${isSelected(task) ? "selected" : ""}`}
              style={{ cursor: onSelectTask ? "pointer" : "default" }}
            >
              <div className="task-item-content">
                <div className="task-info-line">
                  <span className="task-info-label">Tarefa:</span>
                  <span className="task-value">{`#${task.id}`}</span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Status:</span>
                  <span className="task-value">{task.status}</span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Criada em:</span>
                  <span className="task-value">{new Date(task.created_at).toLocaleString()}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );      
}


export default GetTasksInProgressByTeamId;