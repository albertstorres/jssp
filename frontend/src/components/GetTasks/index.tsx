import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

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

interface GetTaskProps {
  onSelectTask?: (task: Task, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  selectedTasks?: Task[];
  showAll?: boolean;
}

function GetTasks({ onSelectTask, selectedTasks = [], showAll = false }: GetTaskProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTasks() {
      try {
        const url = showAll
          ? 'http://localhost:8000/api/v1/tasks/'
          : 'http://localhost:8000/api/v1/tasks/?status=pending';

        const response = await api.get<Task[]>(url, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        setTasks(response.data);
      } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
      }
    }

    if (access) {
      fetchTasks();
    }
  }, [access, showAll]);

  const isSelected = (task: Task) =>
    selectedTasks.some((selected) => selected.id === task.id);

  return (
    <div className="get-tasks-container">
      <div className="get-tasks">
        <h2 className="get-tasks-title">
          {showAll ? "Lista de Todas as Tarefas" : "Selecione as tarefas pendentes:"}
        </h2>

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
                  <span className="task-info-label">Equipe:</span>
                  <span className="task-value">{task.team_info?.name || "Sem equipe"}</span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Status:</span>
                  <span className="task-value">{task.status}</span>
                </div>
                <div className="task-info-line">
                  <span className="task-info-label">Criada em:</span>
                  <span className="task-value">
                    {new Date(task.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GetTasks;