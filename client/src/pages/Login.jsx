import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import useStore from '../store/useStore';
import { LogIn, UserPlus, Loader2, Smartphone } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    authApi.getAccounts()
      .then((res) => setAccounts(res.data.accounts))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleLogin = async (phone) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ phone });
      setAuth(res.data.token, res.data.phone);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram Drive</h1>
          <p className="text-gray-500 mt-1">Select an account or add a new one</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {accounts.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-500 mb-3">Saved accounts</h2>
                  <div className="space-y-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc.user_phone}
                        onClick={() => handleLogin(acc.user_phone)}
                        disabled={loading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all disabled:opacity-50"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{acc.user_phone}</p>
                          <p className="text-xs text-gray-400">Added {new Date(acc.created_at).toLocaleDateString()}</p>
                        </div>
                        <LogIn className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/setup')}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                <UserPlus className="w-5 h-5" />
                Add new account
              </button>

              {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
