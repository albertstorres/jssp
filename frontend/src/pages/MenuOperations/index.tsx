import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuOperations() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Menu de Operações</h1>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/createOperation/')}>Cadastrar Operação</button>
          <button className="bottom-button" onClick={() => navigate('/listOperations/')}>Listar Operações</button>
          <button className="bottom-button">Editar Operação</button>
          <button className="bottom-button">Remover Operação</button>
        </div>
      </div>
    </>
  );
}

export default MenuOperations;