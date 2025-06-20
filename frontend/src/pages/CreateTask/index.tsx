import './styles.css';
import Header from '../../components/Header';
import GetEquipments, { Equipment } from '../../components/GetEquipments';
import GetTeams, { Team } from '../../components/GetTeams';
import GetCategories, { Category } from '../../components/GetCategories';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

function CreateTask() {
    const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
    const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const { handleGetToken } = useAuth();
    const access = handleGetToken();

    const toggleSelection = <T extends {id: number}>(array: T[], item: T): T[] => {
        return array.some((i) => i.id === item.id)
            ? array.filter((i) => i.id !== item.id)
            : [...array, item];
    };

    const handleSelectTeam = (team: Team) => {
        setSelectedTeams((prev) => toggleSelection(prev, team));
    };

    const handleSelectEquipment = (equipment: Equipment) => {
        setSelectedEquipments((prev) => toggleSelection(prev, equipment));
    };

    const handleSelectCategory = (category: Category) => {
        setSelectedCategory(category.id === selectedCategory?.id ? null : category);
    };

    const handleSubmit = async () => {
        if (!selectedCategory || setSelectedTeams.length === 0 ) {
            alert('Selecione pelo menos uma equipe e uma categoria.');
            return;
        }

        try {
            const request = selectedTeams.flatMap((team) =>
                selectedEquipments.map((equipment) => ({
                    team: team.id,
                    categorie: selectedCategory.id,
                    equipment: equipment.id,
                }))
            );

            await Promise.all(
                request.map((data) =>
                    api.post('http://localhost:8000/api/v1/tasks/', data, {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    })
                )
            );

            alert('Tarefa criada com sucesso!');
            setSelectedTeams([]);
            setSelectedEquipments([]);
            setSelectedCategory(null);
        } catch (error) {
            console.error('Erro ao criar tarefa. ', error);
            alert('Erro ao criar tarefa.');
        }
    };

  return (
    <>
      <Header />
      <div className="create-task-container">
        <h1>Criar Nova Tarefa</h1>

        <div className = 'selection-row'>
          <div className = 'selection-column'>
            <GetCategories
            onSelectCategory={handleSelectCategory}
            selectedCategory={selectedCategory ? [selectedCategory] : []}
            />
          </div>

          <div className = 'selected-column'>
            <h3>Categoria selecionada</h3>
            <ul>
              {selectedCategory && (
                <li>
                  #{selectedCategory.id} - {selectedCategory.description}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className = 'selection-row'>
          <div className = 'selection-column'>
            <GetTeams
            onSelectTeam={handleSelectTeam}
            selectedTeams={selectedTeams}
            />
          </div>

          <div className = 'selected-column'>
            <h3>Equipes selecionadas</h3>
            <ul>
              {selectedTeams.map((team) => (
                <li key={team.id}>#{team.id} - {team.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className = 'selection-row'>
          <div className = 'selection-column'>
            <GetEquipments
            onSelectEquipment={handleSelectEquipment}
            selectedEquipments={selectedEquipments}
            />
          </div>
          <div className = 'selected-column'>
            <h3>Equipamentos selecionados</h3>
            <ul>
              {selectedEquipments.map((equipment) => (
                <li key = {equipment.id}>#{equipment.id} - {equipment.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <button className="submit-button" onClick={handleSubmit}>
          Criar Tarefa
        </button>
      </div>
    </>
  );
}


export default CreateTask;