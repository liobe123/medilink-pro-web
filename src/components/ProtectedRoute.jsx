import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/roles';

/**
 * Protege une route : redirige vers /connexion si non authentifie, et vers
 * l'espace correspondant au role de l'utilisateur si celui-ci tente d'acceder
 * a un espace qui ne lui est pas destine (allowedRoles).
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  return children;
}
