import './styles.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

function MenuTasks() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="container-main">
        <div className="main-title">
          <h1>Menu de Tarefas</h1>
        </div>

        <div className="bottom-box">
          <button className="bottom-button" onClick={() => navigate('/createTask/')}>Cadastrar Tarefa</button>
          <button className="bottom-button" onClick={() => navigate('/listTasks/')}>Listar Tarefas</button>
          <button className="bottom-button">Editar Tarefa</button>
          <button className="bottom-button">Remover Tarefa</button>
        </div>
      </div>
    </>
  );
}

export default MenuTasks;