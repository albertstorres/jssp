import './styles.css'

interface UserNameProps {
    name: string;
}

function UserName({name}: UserNameProps){
    return(
        <div className='user'>usuário: {name}</div>
    );
}


export default UserName;