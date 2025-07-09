import './styles.css';
import { useState } from 'react';
import Header from '../../components/Header';
import GetTasks, { Task } from '../../components/GetTasks';
import GetEquipments, { Equipment } from '../../components/GetEquipments';
import SetOperation from '../../components/SetOperation';
import SelectClassicOptimization from '../../components/SelectClassicOptimization';
import SelectQuantumOptimization from '../../components/SelectQuantumOptimization';

function CreateOperation() {
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [optimizationType, setOptimizationType] = useState<'classic' | 'quantum' | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function toggleTaskSelection(task: Task) {
    const alreadySelected = selectedTasks.some((t) => t.id === task.id);
    setSelectedTasks((prev) =>
      alreadySelected ? prev.filter((t) => t.id !== task.id) : [...prev, task]
    );
  }

  function toggleEquipmentSelection(equipment: Equipment) {
    const alreadySelected = selectedEquipments.some((e) => e.id === equipment.id);
    setSelectedEquipments((prev) =>
      alreadySelected ? prev.filter((e) => e.id !== equipment.id) : [...prev, equipment]
    );
  }

  function handleSuccess() {
    setSelectedTasks([]);
    setSelectedEquipments([]);
    setOptimizationType(null);
    setMessage({ type: 'success', text: 'Operação criada com sucesso!' });
    setReloadSignal((prev) => prev + 1);
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="create-operation-page">
      <Header />

      <main className="create-operation-main">
        <h1 className="create-operation-title">Criar Nova Operação</h1>

        {message && (
          <div className={`feedback-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="selection-section">
          <GetTasks
            selectedTasks={selectedTasks}
            onSelectTask={toggleTaskSelection}
            reloadSignal={reloadSignal}
          />
        </section>

        <section className="selection-section">
          <GetEquipments
            selectedEquipments={selectedEquipments}
            onSelectEquipment={toggleEquipmentSelection}
            reloadSignal={reloadSignal}
          />
        </section>

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

        <section className="action-section">
          <SetOperation
            selectedTaskIds={selectedTasks.map((t) => t.id)}
            selectedEquipmentIds={selectedEquipments.map((e) => e.id)}
            onSuccess={handleSuccess}
            optimizationType={optimizationType} // se precisar usar no backend
          />
        </section>
      </main>
    </div>
  );
}

export default CreateOperation;