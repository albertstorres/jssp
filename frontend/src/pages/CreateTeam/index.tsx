import './styles.css';
import Header from '../../components/Header';
import SetTeam from '../../components/SetTeam';

function CreateTeam() {
  return (
    <>
      <Header />
      <div className="container-create-team">
        <SetTeam />
      </div>
    </>
  );
}

export default CreateTeam;