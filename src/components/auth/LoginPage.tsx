import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../db/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: (user: { id: string; username: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Query users table by username
      const { data: existingUsers, error: queryErr } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim().toLowerCase());

      if (queryErr) {
        throw new Error(queryErr.message);
      }

      const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (isRegisterMode) {
        if (existingUser) {
          setError('Username already exists. Please login instead.');
          setIsLoading(false);
          return;
        }

        // Hash password and create new user
        const passwordHash = bcrypt.hashSync(password, 10);
        const { data: newUser, error: insertErr } = await supabase
          .from('users')
          .insert({
            username: username.trim().toLowerCase(),
            password_hash: passwordHash
          })
          .select('*')
          .single();

        if (insertErr || !newUser) {
          throw new Error(insertErr?.message || 'Failed to create user.');
        }

        // Auto-seed default settings & default demo account for new user
        await seedNewUserData(newUser.id);

        const session = { id: newUser.id, username: newUser.username };
        localStorage.setItem('trading_journal_user_session', JSON.stringify(session));
        onLoginSuccess(session);
      } else {
        if (!existingUser) {
          setError('User not found. Check username or switch to register.');
          setIsLoading(false);
          return;
        }

        // Verify password hash
        const isMatch = bcrypt.compareSync(password, existingUser.password_hash);
        if (!isMatch) {
          setError('Invalid password. Please try again.');
          setIsLoading(false);
          return;
        }

        const session = { id: existingUser.id, username: existingUser.username };
        localStorage.setItem('trading_journal_user_session', JSON.stringify(session));
        onLoginSuccess(session);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const seedNewUserData = async (userId: string) => {
    try {
      // 1. Create Default Settings
      await supabase.from('settings').upsert({
        user_id: userId,
        theme: 'Light',
        currency: '$',
        date_format: 'YYYY-MM-DD',
        timezone: 'UTC',
        default_risk_percent: 1.0,
        normal_risk_max_percent: 1.5,
        warning_risk_max_percent: 3.0,
        critical_risk_max_percent: 5.0,
        autosave_interval_ms: 2000,
        autosave_enabled: true,
        hard_checklist_enforcement: false,
        hard_risk_warnings: true,
        no_trade_reminders: true,
        storage_persisted: true
      });

      // 2. Create Default Account
      await supabase.from('accounts').insert({
        user_id: userId,
        name: 'Main Trading Account',
        broker_or_firm: 'Primary Broker',
        account_type: 'Personal',
        currency: '$',
        initial_balance: 10000,
        current_balance: 10000,
        default_risk_percent: 1.0,
        daily_loss_limit_percent: 3.0,
        max_drawdown_percent: 6.0,
        trading_style: 'Day Trading',
        status: 'Active',
        notes: 'Primary active account'
      });
    } catch (e) {
      console.warn('Failed to seed default user data:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white font-bold text-xl tracking-wider">
            AE
          </div>
          <h1 className="text-xl font-bold text-slate-900">Ayzoh Enji Trading Journal</h1>
          <p className="text-xs text-slate-500">Cloud Sync Edition — Multi-Device Performance Journal</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. trader1"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isRegisterMode ? 'Create Account & Sign In' : 'Sign In'}
          </button>
        </form>

        <div className="text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
          >
            {isRegisterMode ? 'Already have an account? Sign In' : 'New user? Create an Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
