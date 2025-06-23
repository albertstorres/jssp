import './styles.css';
import Header from '../../components/Header';
import SetCategory from '../../components/SetCategory';

function CreateCategory() {
  return (
    <>
      <Header />
      <div className="container-create-category">
        <div className="create-category">
          <h1 className="create-category-title">Cadastro de Categoria</h1>
          <SetCategory />
        </div>
      </div>
    </>
  );
}

export default CreateCategory;