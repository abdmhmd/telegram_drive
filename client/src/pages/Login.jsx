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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Telegram Drive</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">Select an account or add a new one</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-900/50 p-5 sm:p-6">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {accounts.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Saved accounts</h2>
                  <div className="space-y-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc.user_phone}
                        onClick={() => handleLogin(acc.user_phone)}
                        disabled={loading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all disabled:opacity-50 min-h-[60px]"
                      >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{acc.user_phone}</p>
                          <p className="text-xs text-gray-400">Added {new Date(acc.created_at).toLocaleDateString()}</p>
                        </div>
                        <LogIn className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/setup')}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all min-h-[48px] text-sm sm:text-base"
              >
                <UserPlus className="w-5 h-5" />
                Add new account
              </button>

              {error && <p className="text-red-500 dark:text-red-400 text-sm mt-3 text-center">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
