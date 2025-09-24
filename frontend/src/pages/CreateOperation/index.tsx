import './styles.css';
import { useState } from 'react';
import Header from '../../components/Header';
import GetTasks, { Task } from '../../components/GetTasks';
import GetEquipments, { Equipment } from '../../components/GetEquipments';
import GetTeams, { Team } from '../../components/GetTeams';
import SetOperation from '../../components/SetOperation';
import SelectClassicOptimization from '../../components/SelectClassicOptimization';
import SelectQuantumOptimization from '../../components/SelectQuantumOptimization';
import MountOperations from '../../components/MountOperations';
import useAuth from '../../hooks/useAuth';

function CreateOperation() {
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [optimizationType, setOptimizationType] = useState<'classic' | 'quantum' | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [jobsJson, setJobsJson] = useState<{ jobs: Record<string, Array<[number[], number[], number[]]>> } | null>(null);

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

  const removeSpecificTasks = (taskIdsToRemove: number[]) => {
    setSelectedTasks((prev) => prev.filter(task => !taskIdsToRemove.includes(task.id)));
  };

  const removeSpecificTeams = (teamIdsToRemove: number[]) => {
    setSelectedTeams((prev) => prev.filter(team => !teamIdsToRemove.includes(team.id)));
  };

  const handleSuccess = () => {
    setSelectedTasks([]);
    setSelectedEquipments([]);
    setSelectedTeams([]);
    setOptimizationType(null);
    setJobsJson(null);
    setMessage({ type: 'success', text: 'Operação criada com sucesso!' });
    setReloadSignal((prev) => prev + 1);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleMountSuccess = () => {
    setMessage({ type: 'success', text: 'Operação montada com sucesso! As tarefas e equipes foram atualizadas.' });
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
              showAll={false} // Sempre mostrar apenas equipes disponíveis
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
          <MountOperations
            selectedTaskIds={selectedTasks.map((t) => t.id)}
            selectedEquipmentIds={selectedEquipments.map((e) => e.id)}
            selectedTeamIds={selectedTeams.map((t) => t.id)}
            selectedTeamsDetails={selectedTeams.map(t => ({ id: t.id, name: t.name }))}
            optimizationType={optimizationType}
            onRemoveSpecificTasks={removeSpecificTasks}
            onRemoveSpecificTeams={removeSpecificTeams}
            onMountSuccess={handleMountSuccess}
            onClassicJobsChange={(payload) => {
              console.log('classic_optimization payload atualizado:', payload);
              setJobsJson(payload);
            }}
            onQuantumJobsChange={(payload) => {
              console.log('quantum_optimization payload atualizado:', payload);
              setJobsJson(payload);
            }}
            onSendPayload={({ type, payload }) => {
              console.log(`Enviar payload (${type}):`, payload);
              // Aqui você pode baixar/salvar/rotear conforme necessário
              // ex.: salvar arquivo, enviar para backend específico, etc.
              setJobsJson(payload);
            }}
          />
          <SetOperation
            selectedTaskIds={selectedTasks.map((t) => t.id)}
            selectedEquipmentIds={selectedEquipments.map((e) => e.id)}
            selectedTeamIds={selectedTeams.map((t) => t.id)}
            optimizationType={optimizationType}
            onSuccess={handleSuccess}
            jobsJson={jobsJson ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateOperation;