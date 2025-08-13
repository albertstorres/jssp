import './styles.css';
import Header from '../../components/Header';
import GetCategories, { Category } from '../../components/GetCategories';
import { useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

function CreateTask() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category.id === selectedCategory?.id ? null : category);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      setMessage({ type: 'error', text: 'Selecione pelo menos uma categoria.' });
      return;
    }

    try {
      const request = {
        category: selectedCategory.id,
      };

      await api.post('http://localhost:8000/api/v1/tasks/', request, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      setMessage({ type: 'success', text: 'Tarefa criada com sucesso!' });
      setSelectedCategory(null);

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