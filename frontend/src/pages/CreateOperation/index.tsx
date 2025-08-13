import './styles.css';
import { useState } from 'react';
import Header from '../../components/Header';
import GetTasks, { Task } from '../../components/GetTasks';
import GetEquipments, { Equipment } from '../../components/GetEquipments';
import GetTeams, { Team } from '../../components/GetTeams';
import SetOperation from '../../components/SetOperation';
import SelectClassicOptimization from '../../components/SelectClassicOptimization';
import SelectQuantumOptimization from '../../components/SelectQuantumOptimization';
import useAuth from '../../hooks/useAuth';

function CreateOperation() {
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [optimizationType, setOptimizationType] = useState<'classic' | 'quantum' | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleSelection = <T extends { id: number }>(array: T[], item: T): T[] =>
    array.some((i) => i.id === item.id)
      ? array.filter((i) => i.id !== item.id)
      : [...array, item];

  const toggleTaskSelection = (task: Task) => {
    setSelectedTasks((prev) => toggleSelection(prev, task));
  };

  const toggleEquipmentSelection = (equipment: Equipment) => {
    setSelectedEquipments((prev) => toggleSelection(prev, equipment));
  };

  const toggleTeamSelection = (team: Team) => {
    setSelectedTeams((prev) => toggleSelection(prev, team));
  };

  const handleSuccess = () => {
    setSelectedTasks([]);
    setSelectedEquipments([]);
    setSelectedTeams([]);
    setOptimizationType(null);
    setMessage({ type: 'success', text: 'Operação criada com sucesso!' });
    setReloadSignal((prev) => prev + 1);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="create-operation-container">
      <Header />

      <div className="create-operation">
        <h1 className="create-operation-title">Criar Nova Operação</h1>

        {message && (
          <div className={`feedback-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="operation-layout">
          <div className="task-selection-box">
            <GetTasks
              selectedTasks={selectedTasks}
              onSelectTask={toggleTaskSelection}
              reloadSignal={reloadSignal}
            />
          </div>

          <div className="equipment-selection-box">
            <GetEquipments
              selectedEquipments={selectedEquipments}
              onSelectEquipment={toggleEquipmentSelection}
              reloadSignal={reloadSignal}
            />
          </div>

          <div className="team-selection-box">
            <GetTeams
              selectedTeams={selectedTeams}
              onSelectTeam={toggleTeamSelection}
              reloadSignal={reloadSignal}
            />
          </div>
        </div>

        <div className="optimization-selector-container">
          <SelectClassicOptimization
            onClick={() => setOptimizationType('classic')}
            isSelected={optimizationType === 'classic'}
          />
          <SelectQuantumOptimization
            onClick={() => setOptimizationType('quantum')}
            isSelected={optimizationType === 'quantum'}
          />
        </div>

        <div className="action-section">
          <SetOperation
            selectedTaskIds={selectedTasks.map((t) => t.id)}
            selectedEquipmentIds={selectedEquipments.map((e) => e.id)}
            selectedTeamIds={selectedTeams.map((t) => t.id)}
            optimizationType={optimizationType}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateOperation;