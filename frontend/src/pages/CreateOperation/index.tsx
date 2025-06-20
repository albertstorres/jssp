import './styles.css';
import Header from '../../components/Header';
import GetTasks, { Task } from '../../components/GetTasks';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

function CreateOperation(){
    const [operationName, setOperationName] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
    const { handleGetToken } = useAuth();
    const access = handleGetToken()

    const handleSelectTask = (task: Task) => {
        setSelectedTasks((prevSelected) => {
            const alreadySelected = prevSelected.find((t) => t.id === task.id);
            if (alreadySelected) {
                return prevSelected.filter((t) => t.id !== task.id);
            }
            return [...prevSelected, task];
        });
    };

    const handleSubmit = async () => {
        if (!operationName.trim()) {
            alert('Digite um nome para a operação.');
            return;
        }

        if (selectedTasks.length === 0) {
            alert('Selecione pelo menos uma tarefa.');
            return;
        }

        try {
            const response = await api.post(
                'http://localhost:8000/api/v1/operations/',
                {
                    name: operationName,
                    task_ids: selectedTasks.map((task) => task.id),
                },
                {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
            );

            alert('Operação criada com sucesso!');
            setOperationName('');
            setSelectedTasks([]);

        }catch (error) {
            console.error('Erro aoi criar operação: ', error);
            alert('Erro ao criar operação.');
        }
    };

   return (
    <>
      <Header />
      <div className="create-operation-container">
        <h1>Criar Nova Operação</h1>

        <input
          type="text"
          placeholder="Digite o nome da operação"
          value={operationName}
          onChange={(e) => setOperationName(e.target.value)}
          className="operation-input"
        />

        <div className = 'operation-layout'>
            <div className = 'selected-task-box'>
                <h3>Tarefas selecionadas</h3>
                <ul>
                    {selectedTasks.map((task) => (
                        <li key = {task.id}>
                            #{task.id} - {task.team_info.name} - Equipamentos:
                            {task.equipment_info.length > 0 ? (
                                <ul>
                                    {task.equipment_info.map((eq) => (
                                        <li key = {eq.id}>{eq.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span>Sem equipamento</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className = 'task-selection-box'>
                    <GetTasks
                    onSelectTask={handleSelectTask}
                    selectedTasks={selectedTasks}
                    />
            </div>
        </div>

        <button className="submit-button" onClick={handleSubmit}>
          Criar Operação
        </button>
      </div>
    </>
  );
}


export default CreateOperation;