import './styles.css';
import { useState } from 'react';
import Header from '../../components/Header';
import GetTasks, { Task } from '../../components/GetTasks';
import GetEquipments, { Equipment } from '../../components/GetEquipments';
import SetOperation from '../../components/SetOperation';

function CreateOperation() {
    const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
    const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);

    function toggleTaskSelection(task: Task) {
        const alreadySelected = selectedTasks.some((t) => t.id === task.id);
        if(alreadySelected) {
            setSelectedTasks((prev) => prev.filter((t) => t.id !== task.id));
        } else {
            setSelectedTasks((prev) => [...prev, task]);
        }
    }

    function toggleEquipmentSelection(equipment: Equipment) {
        const alreadySelected = selectedEquipments.some((e) => e.id === equipment.id);
        if(alreadySelected) {
            setSelectedEquipments((prev) => prev.filter((e) => e.id !== equipment.id));
        } else {
            setSelectedEquipments((prev) => [...prev, equipment]);
        }
    }

    return (
        <div className="create-operation-page">
            <Header />

            <main className="create-operation-main">
                <h1 className="create-operation-title">Criar Nova Operação</h1>

                <section className="selection-section">
                    <GetTasks
                        selectedTasks={selectedTasks}
                        onSelectTask={toggleTaskSelection}
                    />
                </section>

                <section className="selection-section">
                    <GetEquipments
                        selectedEquipments={selectedEquipments}
                        onSelectEquipment={toggleEquipmentSelection}
                    />
                </section>

                <section className="action-section">
                    <SetOperation
                        selectedTaskIds={selectedTasks.map(t => t.id)}
                        selectedEquipmentIds={selectedEquipments.map(e => e.id)}
                        onSuccess={() => {
                            alert('Operação criada com sucesso!');
                            setSelectedTasks([]);
                            setSelectedEquipments([]);
                        }}
                    />
                </section>
            </main>
        </div>
    );
}


export default CreateOperation;