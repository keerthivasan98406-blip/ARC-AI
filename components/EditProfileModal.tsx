import React, { useState } from 'react';
import { getAuth, saveAuth } from '../services/authService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave }) => {
  const userAuth = getAuth();
  const [name, setName] = useState(userAuth?.name || '');
  const [email, setEmail] = useState(userAuth?.email || '');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setMessage('Please enter your name');
      return;
    }
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email');
      return;
    }

    saveAuth(name, email);
    setMessage('Profile updated successfully!');
    setTimeout(() => {
      onSave();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md modal-backdrop animate-fade-in-up">
      <div className="glass-elevated p-8 rounded-3xl border border-indigo-500/20 max-w-md w-full animate-fade-in-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent font-display tracking-tight">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-300"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white ml-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-6 py-3 glass-input rounded-full text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white ml-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-6 py-3 glass-input rounded-full text-white placeholder:text-slate-500"
            />
          </div>

          {message && (
            <p className={`text-sm text-center ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 glass-button text-white font-semibold rounded-full transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-br from-indigo-400 to-violet-600 hover:from-indigo-500 hover:to-violet-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
