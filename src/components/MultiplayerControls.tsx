import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { multiplayerService } from '../services/MultiplayerService';

interface MultiplayerControlsProps {
  onMultiplayerStateChange: (isMultiplayer: boolean, role?: 'host' | 'guest') => void;
}

export function MultiplayerControls({ onMultiplayerStateChange }: MultiplayerControlsProps) {
  const [inviteCode, setInviteCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<'host' | 'guest' | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<number>(1);

  useEffect(() => {
    // Listen for multiplayer events
    const handleSessionCreated = (data: { code: string; role: 'host' | 'guest' }) => {
      setInviteCode(data.code);
      setPlayerRole(data.role);
      setConnectionStatus('waiting');
      onMultiplayerStateChange(true, data.role);
    };

    const handleSessionJoined = (data: { code: string; role: 'host' | 'guest' }) => {
      setPlayerRole(data.role);
      setConnectionStatus('connected');
      setConnectedPlayers(2);
      onMultiplayerStateChange(true, data.role);
    };

    const handlePlayerConnected = () => {
      setConnectionStatus('connected');
      setConnectedPlayers(2);
    };

    const handleJoinError = (error: string) => {
      setErrorMessage(error);
      setConnectionStatus('error');
      setTimeout(() => {
        setConnectionStatus('idle');
        setErrorMessage('');
      }, 3000);
    };

    const handleSessionLeft = () => {
      setInviteCode('');
      setJoinCode('');
      setConnectionStatus('idle');
      setPlayerRole(null);
      setConnectedPlayers(1);
      onMultiplayerStateChange(false);
    };

    // Register event listeners
    multiplayerService.on('sessionCreated', handleSessionCreated);
    multiplayerService.on('sessionJoined', handleSessionJoined);
    multiplayerService.on('playerConnected', handlePlayerConnected);
    multiplayerService.on('joinError', handleJoinError);
    multiplayerService.on('sessionLeft', handleSessionLeft);

    return () => {
      multiplayerService.off('sessionCreated', handleSessionCreated);
      multiplayerService.off('sessionJoined', handleSessionJoined);
      multiplayerService.off('playerConnected', handlePlayerConnected);
      multiplayerService.off('joinError', handleJoinError);
      multiplayerService.off('sessionLeft', handleSessionLeft);
    };
  }, [onMultiplayerStateChange]);

  const handleCreateInvite = () => {
    const code = multiplayerService.createGame();
    setInviteCode(code);
  };

  const handleJoinGame = () => {
    if (joinCode.length === 3) {
      const success = multiplayerService.joinGame(joinCode);
      if (!success) {
        setErrorMessage('Failed to join game');
        setConnectionStatus('error');
      }
    } else {
      setErrorMessage('Please enter a 3-digit code');
      setConnectionStatus('error');
    }
  };

  const handleLeaveSession = () => {
    multiplayerService.leaveSession();
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    // Could add a toast notification here
  };

  if (connectionStatus === 'connected') {
    return (
      <motion.div 
        className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-3xl border-3 border-white shadow-xl mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🎮✨</div>
          <div className="text-lg font-bold text-green-700 mb-2">
            Multiplayer Connected!
          </div>
          <div className="text-sm text-green-600 mb-4">
            You are the <span className="font-bold">{playerRole === 'host' ? 'Host' : 'Guest'}</span>
            <br />
            Players ready: {connectedPlayers}/2
          </div>
          
          {inviteCode && (
            <div className="bg-white/50 rounded-2xl p-3 mb-4">
              <div className="text-xs text-gray-600 mb-1">Game Code:</div>
              <div className="text-2xl font-bold tracking-wider text-purple-700">
                {inviteCode}
              </div>
            </div>
          )}

          <Button
            onClick={handleLeaveSession}
            className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-2xl"
          >
            Leave Game
          </Button>
        </div>
      </motion.div>
    );
  }

  if (connectionStatus === 'waiting') {
    return (
      <motion.div 
        className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-3xl border-3 border-white shadow-xl mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div 
            className="text-2xl mb-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.div>
          <div className="text-lg font-bold text-orange-700 mb-2">
            Waiting for Player 2...
          </div>
          <div className="text-sm text-orange-600 mb-4">
            Share this code with your friend:
          </div>
          
          <motion.div 
            className="bg-white rounded-2xl p-4 mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyInviteCode}
          >
            <div className="text-xs text-gray-600 mb-1">Game Code (Click to Copy):</div>
            <div className="text-4xl font-bold tracking-wider text-purple-700">
              {inviteCode}
            </div>
          </motion.div>

          <Button
            onClick={handleLeaveSession}
            className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-2xl"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-3xl border-3 border-white shadow-xl mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">👥</div>
        <div className="text-lg font-bold text-purple-700 mb-2">
          Multiplayer Mode
        </div>
        <div className="text-sm text-purple-600">
          Play with friends across different devices!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Game Section */}
        <div className="bg-white/50 rounded-2xl p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Host a Game</div>
          <Button
            onClick={handleCreateInvite}
            className="w-full bg-gradient-to-r from-purple-400 to-blue-500 hover:from-purple-500 hover:to-blue-600 text-white py-3 rounded-2xl text-lg font-semibold"
            disabled={connectionStatus !== 'idle'}
          >
            <span className="mr-2">📨</span>
            Create Invite
          </Button>
          <div className="text-xs text-gray-600 mt-2">
            Generate a 3-digit code to share
          </div>
        </div>

        {/* Join Game Section */}
        <div className="bg-white/50 rounded-2xl p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Join a Game</div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="000"
              className="flex-1 px-3 py-2 bg-white rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-center text-xl font-bold tracking-wider"
              maxLength={3}
            />
            <Button
              onClick={handleJoinGame}
              className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-4 py-2 rounded-xl"
              disabled={joinCode.length !== 3 || connectionStatus !== 'idle'}
            >
              <span className="mr-1">🔗</span>
              Join
            </Button>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Enter the 3-digit code from your friend
          </div>
        </div>
      </div>

      {/* Error Message */}
      {connectionStatus === 'error' && errorMessage && (
        <motion.div 
          className="mt-4 bg-red-100 border border-red-300 rounded-2xl p-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-red-700 text-sm">
            ❌ {errorMessage}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
