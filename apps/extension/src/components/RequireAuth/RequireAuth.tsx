import { FC } from 'react';
import { Navigate } from 'react-router';
import { Outlet, useLocation } from 'react-router-dom';

import PAGES from '../../constants/pages';

interface RequireAuthRouteProps {
  isAuthed: boolean;
  hasAddress: boolean;
}

export const RequireAuthRoute: FC<RequireAuthRouteProps> = ({ isAuthed, hasAddress }) => {
  const location = useLocation();

  if (!hasAddress) {
    return <Navigate to={PAGES.PAGE_GUIDE} />;
  }

  if (!isAuthed) {
    return <Navigate to={PAGES.PAGE_LOGIN} state={{ from: location }} />;
  }

  return <Outlet />;
};
