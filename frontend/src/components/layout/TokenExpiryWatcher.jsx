// frontend/src/components/layout/TokenExpiryWatcher.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectIsAuthenticated } from '../../store/authSlice';

const TokenExpiryWatcher = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const interval = setInterval(() => {
      if (token && !isAuthed) {
        dispatch(logout());
        navigate('/');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, isAuthed, dispatch, navigate]);

  return null;
};

export default TokenExpiryWatcher;
