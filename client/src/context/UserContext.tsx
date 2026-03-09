import { ReactNode } from "react";
import { User } from "../interfaces/user";
import { getMe } from "../services/users";
import { getToken } from "../services/auth";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loadingUser: boolean;
  refetchUser: () => Promise<void>;
} | null;

const UserContext = createContext<UserContextType>(null);

export const useUserContext = () => useContext(UserContext);

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const fetchAuth = async () => await getToken();

  const getUser = useCallback(async () => {
    try {
      setLoadingUser(true);
      const token = await fetchAuth();
      if (token) {
        setUser(await getMe());
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const refetchUser = async () => {
    getUser();
  };

  useEffect(() => {
    getUser();
  }, [getUser]);
  return (
    <UserContext.Provider
      value={{
        user,
        refetchUser,
        setUser,
        loadingUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
