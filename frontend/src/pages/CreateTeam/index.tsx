import './styles.css';
import Header from '../../components/Header';
import { FormEvent, useState } from 'react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

function CreateTeam(){
    const [shift, setShift] = useState<number | ''>(0);
    const [name, setName] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const { handleGetToken } = useAuth();

    interface AuthResponse {
        shift: number;
        name: string;
    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        try {
            if (!shift || !name) {
                throw new Error('Turno e nome da equipe são obrigatórios.');
            }

            const token = handleGetToken();
            if (!token) {
                throw new Error('Acesso negado');
            }

            const response = await api.post<AuthResponse>('/api/v1/teams/', {
                shift,
                name
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage('Equipe cadastrada com sucesso!');
            setShift('');
            setName('');

        }catch (error) {
            console.log(error);
        }
    }
 
    return(
        <>
            <Header />
            <div className='container-create-team'>
                <div className='create-team'>
                    <h1 className='create-team-title'>Cadastro de equipes</h1>
                    {message && <div className="alert">{message}</div>}
                    <form onSubmit={handleSubmit}>
                        <input className='input' type='text' placeholder='Digite o turno da equipe aqui' value={shift} onChange={(e) => setShift(Number(e.target.value))} required/>
                        <input className='input' type='text' placeholder='Digite o nome da equipe aqui' value={name} onChange={(e) => setName(e.target.value)} required/>
                        <button className='btn-green'>CADASTRAR</button>
                    </form>
                </div>
            </div>
        </>
    );
}


export default CreateTeam;