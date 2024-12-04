import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';

const WaitingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId;

  useEffect(() => {
    if (sessionId) {
      navigate(`/game/${sessionId}`);
    } else {
      navigate('/');
    }
  }, [sessionId, navigate]);

  // Show nothing while redirecting
  return null;
};

export default WaitingScreen;