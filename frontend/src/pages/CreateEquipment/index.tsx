import './styles.css';
import Header from '../../components/Header';
import SetEquipment from '../../components/SetEquipment';

function CreateEquipment() {
    return(
        <>
            <Header />
            <div className = 'container-create-equipment'>
                <div className = 'create-equipment'>
                    <h1 className = 'create-equipment-title'>Cadastro de equipamento</h1>
                    <SetEquipment />
                </div>
            </div>
        </>
    );
}


export default CreateEquipment;