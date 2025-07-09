import { Navigate } from "react-router-dom";
import useAuth from '../../hooks/useAuth';
import { ReactElement } from "react";

interface RequireGroupProps {
  allowedGroups: string[];
  children: ReactElement;
}

function RequireGroup({ allowedGroups, children }: RequireGroupProps): ReactElement | null {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();

  if (!access) {
    console.warn("Token não encontrado. Redirecionando para /");
    return <Navigate to="/" />;
  }

  try {
    const base64Payload = access.split('.')[1];
    const decodedPayload = JSON.parse(atob(base64Payload));
    const userGroups: string[] = Array.isArray(decodedPayload.groups)
      ? decodedPayload.groups
      : [decodedPayload.groups];

    console.log("Payload JWT:", decodedPayload);
    console.log("Grupos do usuário:", userGroups);
    console.log("Grupos permitidos:", allowedGroups);

    const hasPermission = userGroups.some(group => allowedGroups.includes(group));

    if (hasPermission) {
      return children;
    } else {
      console.warn("Usuário não tem permissão. Redirecionando para /unauthorized");
      return <Navigate to="/unauthorized" />;
    }
  } catch (err) {
    console.error("Erro ao decodificar o token:", err);
    return <Navigate to="/unauthorized" />;
  }
}

export default RequireGroup;