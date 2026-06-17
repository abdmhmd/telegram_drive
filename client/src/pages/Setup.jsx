import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import useStore from '../store/useStore';
import { maskPhone } from '../utils/helpers';
import { Key, Smartphone, Shield, ArrowRight, Loader2 } from 'lucide-react';

export default function Setup() {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ api_id: '', api_hash: '', phone: '', code: '', password: '' });
  const [needPassword, setNeedPassword] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.sendCode({
        api_id: form.api_id,
        api_hash: form.api_hash,
        phone: form.phone,
      });
      toast.success('Code sent to your phone');
      setStep(1);
    } catch (err) {
      toast.error('Failed to send code');
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyCode({
        phone: form.phone,
        code: form.code,
      });
      if (res.data.needPassword) {
        setNeedPassword(true);
        setStep(2);
        return;
      }
      toast.success('Welcome back!');
      setAuth(res.data.token, res.data.phone);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify code');
      setError(err.response?.data?.error || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verify2FA({
        phone: form.phone,
        password: form.password,
      });
      toast.success('Welcome back!');
      setAuth(res.data.token, res.data.phone);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify 2FA password');
      setError(err.response?.data?.error || 'Failed to verify 2FA password');
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
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">Your personal cloud storage on Telegram</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-900/50 p-5 sm:p-6">
          {step === 0 && (
            <form onSubmit={handleSendCode}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Connect your account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Key className="inline w-3.5 h-3.5 mr-1" />
                    API ID
                  </label>
                  <input
                    type="text"
                    required
                    value={form.api_id}
                    onChange={(e) => setForm({ ...form, api_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                    placeholder="From my.telegram.org"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Key className="inline w-3.5 h-3.5 mr-1" />
                    API Hash
                  </label>
                  <input
                    type="text"
                    required
                    value={form.api_hash}
                    onChange={(e) => setForm({ ...form, api_hash: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                    placeholder="From my.telegram.org"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Smartphone className="inline w-3.5 h-3.5 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 dark:text-red-400 text-sm mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send Code <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleVerifyCode}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Enter verification code</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Code sent to {maskPhone(form.phone)}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg tracking-widest"
                  placeholder="_ _ _ _ _"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-500 dark:text-red-400 text-sm mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verify <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {needPassword && step === 2 && (
            <form onSubmit={handle2FA}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                <Shield className="inline w-5 h-5 mr-1" />
                Two-factor authentication
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter your 2FA password</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-500 dark:text-red-400 text-sm mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verify Password <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Need API credentials?{' '}
          <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">
            Get them here
          </a>
        </p>
      </div>
    </div>
  );
}
