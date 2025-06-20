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
  equipment_info: {
    id: number;
    name: string;
    timespan: number;
    is_ocupied: boolean;
  }[]; // ← agora é uma lista
  created_at: string;
  finished_at: string | null;
  team: number;
  categorie: number;
}

interface GetTaskProps {
  onSelectTask: (task: Task) => void;
  selectedTasks: Task[];
}

function GetTasks({ onSelectTask, selectedTasks }: GetTaskProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await api.get<Task[]>('http://localhost:8000/api/v1/tasks/?status=pending', {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setTasks(response.data);
      } catch (error) {
        console.error("Erro ao buscar tasks:", error);
      }
    }

    if (access) {
      fetchTasks();
    }
  }, [access]);

  const isSelected = (task: Task) =>
    selectedTasks.some((selected) => selected.id === task.id);

  return (
    <div className="get-tasks-container">
      <h2 className="get-tasks-title">Selecione as Tarefas Pendentes:</h2>
      <ul className="task-list">
        {tasks.map((task) => (
          <li
            key={task.id}
            onClick={() => onSelectTask(task)}
            className={`task-item ${isSelected(task) ? "selected" : ""}`}
          >
            <strong>{`Tarefa #${task.id}`}</strong>
            <br />
            Equipe: {task.team_info?.name || "Sem equipe"}
            <br />
            Equipamentos:
            <ul>
              {task.equipment_info && task.equipment_info.length > 0 ? (
                task.equipment_info.map((eq) => (
                  <li key={eq.id}>
                    #{eq.id} - {eq.name}
                  </li>
                ))
              ) : (
                <li>Sem equipamento</li>
              )}
            </ul>
            Criada em: {new Date(task.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GetTasks;