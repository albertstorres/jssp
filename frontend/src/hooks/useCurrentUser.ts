// src/hooks/useCurrentUser.ts
import { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "./useAuth";

interface CurrentUser {
  id: number;
  username: string;
  first_name: string;
  is_superuser: boolean;
}

function useCurrentUser() {
  const { handleGetToken } = useAuth();
  const access = handleGetToken();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get<CurrentUser>("/api/v1/users/me/", {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao buscar o usuário atual:", error);
      }
    }

    if (access) {
      fetchUser();
    }
  }, [access]);

  return user;
}

export default useCurrentUser;