import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

export interface Category {
  id: number;
  description: string;
  estimated_time: number;
  priority: string;
}

interface GetCategoryProps {
  onSelectCategory: (category: Category) => void;
  selectedCategory: Category[];
}

function GetCategories({ onSelectCategory, selectedCategory }: GetCategoryProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get<Category[]>('http://localhost:8000/api/v1/categories/', {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setCategories(response.data);
      } catch (error) {
        console.error("Erro ao buscar categories:", error);
      }
    }

    if (access) {
      fetchCategories();
    }
  }, [access]);

  const isSelected = (category: Category) =>
    selectedCategory.some((selected) => selected.id === category.id);

  return (
    <div className="get-categories-container">
      <h2 className="get-categories-title">Selecione as categorias:</h2>
      <ul className="category-list">
        {categories.map((category) => (
          <li
            key={category.description}
            onClick={() => onSelectCategory(category)}
            className={`category-item ${isSelected(category) ? "selected" : ""}`}
          >
            <strong>{`Categoria: ${category.description}`}</strong>

          </li>
        ))}
      </ul>
    </div>
  );
}

export default GetCategories;