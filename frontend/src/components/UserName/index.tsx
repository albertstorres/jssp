import './styles.css';
import useCurrentUser from '../../hooks/useCurrentUser';

function UserName() {
  const user = useCurrentUser();

  let displayName = "Carregando...";

  if (user) {
    displayName = user.is_superuser ? user.username : user.first_name;
  }

  return (
    <div className='user'>Usuário: {displayName}</div>
  );
}

export default UserName;