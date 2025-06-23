import './styles.css';
import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";
import { Category } from "../GetCategories";

interface GetCategoryProps {
  categoryId: number;
}

function GetCategory({ categoryId }: GetCategoryProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchCategory() {
      try {
        const response = await api.get<Category>(`http://localhost:8000/api/v1/categories/${categoryId}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setCategory(response.data);
      } catch (error) {
        console.error("Erro ao buscar detalhes da categoria:", error);
      }
    }

    if (access) {
      fetchCategory();
    }
  }, [access, categoryId]);

  if (!category) {
    return <p>Carregando categoria...</p>;
  }

  return (
    <div className="get-category">
      <h2 className="get-category-title">Detalhes da Categoria</h2>
      <ul className="category-detail-list">
        <li>
          <strong>ID:</strong> {category.id}
        </li>
        <li>
          <strong>Descrição:</strong> {category.description}
        </li>
        <li>
          <strong>Tempo estimado:</strong> {category.estimated_time} min
        </li>
        <li>
          <strong>Prioridade:</strong> {category.priority}
        </li>
      </ul>
    </div>
  );
}

export default GetCategory;