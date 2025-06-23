import './styles.css';
import Header from '../../components/Header';
import SetWorker from '../../components/SetWorker';

function CreateWorker() {
  return (
    <>
      <Header />
      <div className="container-create-worker">
        <div className="create-worker">
          <h1 className="create-worker-title">Cadastro de trabalhador</h1>
          <SetWorker />
        </div>
      </div>
    </>
  );
}

export default CreateWorker;