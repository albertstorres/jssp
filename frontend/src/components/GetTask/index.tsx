import './styles.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface TaskDetail {
  id: number;
  status: string;
  created_at: string;
  finished_at: string | null;
  team: number;
  categorie: number;
}

interface GetTaskProps {
  taskId: number;
}

function GetTask({ taskId }: GetTaskProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchTask() {
      try {
        const response = await api.get<TaskDetail>(`http://localhost:8000/api/v1/tasks/${taskId}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setTask(response.data);
      } catch (error) {
        console.error('Erro ao buscar task:', error);
      }
    }

    if (access) {
      fetchTask();
    }
  }, [access, taskId]);

  if (!task) return <p>Carregando detalhes...</p>;

  return (
    <div className="get-task-container">
      <h2 className="get-task-title">Informações da Tarefa</h2>
      <p><strong>ID:</strong> {task.id}</p>
      <p><strong>Status:</strong> {task.status}</p>
      <p><strong>Criada em:</strong> {new Date(task.created_at).toLocaleString()}</p>
      <p><strong>Finalizada em:</strong> {task.finished_at ? new Date(task.finished_at).toLocaleString() : "Ainda não finalizada"}</p>
      <p><strong>ID da Equipe:</strong> {task.team}</p>
      <p><strong>Descrição da Categoria:</strong> {task.categorie}</p>
    </div>
  );
}

export default GetTask;