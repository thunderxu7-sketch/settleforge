import { createContext, FC } from 'react';

interface AuthContextInterface {
  isAuthed: boolean;
  hasAddress: boolean;
}

export const AuthContext = createContext<AuthContextInterface>({
  isAuthed: false,
  hasAddress: false,
});

export const AuthProvider: FC<{ authContextObj: AuthContextInterface }> = ({
  authContextObj,
  children,
}) => {
  return <AuthContext.Provider value={authContextObj}>{children}</AuthContext.Provider>;
};
