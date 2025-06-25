import './styles.css';
import Header from '../../components/Header';
import GetTeams, { Team } from '../../components/GetTeams';
import GetCategories, { Category } from '../../components/GetCategories';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

function CreateTask() {
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reloadTeams, setReloadTeams] = useState(0); // novo estado
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const toggleSelection = <T extends { id: number }>(array: T[], item: T): T[] => {
    return array.some((i) => i.id === item.id)
      ? array.filter((i) => i.id !== item.id)
      : [...array, item];
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeams((prev) => toggleSelection(prev, team));
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category.id === selectedCategory?.id ? null : category);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || selectedTeams.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos uma equipe e uma categoria.' });
      return;
    }

    try {
      const request = selectedTeams.map((team) => ({
        team: team.id,
        category: selectedCategory.id,
      }));

      await Promise.all(
        request.map((data) =>
          api.post('http://localhost:8000/api/v1/tasks/', data, {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          })
        )
      );

      setMessage({ type: 'success', text: 'Tarefa criada com sucesso!' });
      setSelectedTeams([]);
      setSelectedCategory(null);
      setReloadTeams(prev => prev + 1); // força o recarregamento de GetTeams

      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error('Erro ao criar tarefa.', error);
      setMessage({ type: 'error', text: 'Erro ao criar tarefa.' });
    }
  };

  return (
    <>
      <Header />
      <div className="create-task-container">
        <div className="create-task">
          <h1 className="create-task-title">Criar Nova Tarefa</h1>

          {message && (
            <div className={`feedback-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="operation-layout">
            <div className="task-selection-box">
              <GetCategories
                onSelectCategory={handleSelectCategory}
                selectedCategory={selectedCategory ? [selectedCategory] : []}
              />
            </div>

            <div className="team-selection-box">
              <GetTeams
                onSelectTeam={handleSelectTeam}
                selectedTeams={selectedTeams}
                reloadSignal={reloadTeams} // prop para forçar recarregamento
              />
            </div>
          </div>

          <button className="submit-button" onClick={handleSubmit}>
            Criar Tarefa
          </button>
        </div>
      </div>
    </>
  );
}

export default CreateTask;