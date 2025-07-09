import './styles.css';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

interface SetOperartionProps {
    selectedTaskIds: number[];
    selectedEquipmentIds: number[];
    onSuccess?: () => void;
    optimizationType?: 'classic' | 'quantum' | null;
}

function SetOperation({
    selectedTaskIds,
    selectedEquipmentIds,
    onSuccess,
    optimizationType,
}: SetOperartionProps) {
    const { handleGetToken } = useAuth();
    const access = handleGetToken();

    const [message, setMessage] = useState('');
    const [name, setName] = useState('');

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!selectedTaskIds.length || !name.trim()) {
            setMessage('Selecione pelo menos uma tarefa e um nome para a operação.');
            return;
        }

        try {
            const response = await api.post(
                'http://localhost:8000/api/v1/operations/',
                {
                    name,
                    task_ids: selectedTaskIds,
                    equipment_ids: selectedEquipmentIds,
                    optimization_type: optimizationType, // ← Envia o tipo de otimização se definido
                },
                {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
            );

            console.log('Operação criada com sucesso: ', response.data);
            setMessage('Operação criada com sucesso.');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Erro ao criar operação: ', error);
            setMessage('Erro ao criar operação.');
        }
    }

    return (
        <div className="set-operation-container">
            <form onSubmit={handleSubmit} className="set-operation-form">
                <input
                    type="text"
                    placeholder="Nome da operação"
                    className="operation-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                {optimizationType && (
                    <p className="selected-optimization">Tipo: <strong>{optimizationType === 'classic' ? 'Otimização Clássica' : 'Otimização Quântica'}</strong></p>
                )}
                <button type="submit" className="create-operation-button">Criar operação</button>
                {message && <p className="feedback-message">{message}</p>}
            </form>
        </div>
    );
}

export default SetOperation;