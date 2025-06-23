import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuCategories() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Menu de Categorias</h1>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/createCategorie/')}>Cadastrar Categoria</button>
          <button className="bottom-button" onClick={() => navigate('/listCategories/')}>Listar Categorias</button>
          <button className="bottom-button">Editar Categoria</button>
          <button className="bottom-button">Remover Categoria</button>
        </div>
      </div>
    </>
  );
}

export default MenuCategories;