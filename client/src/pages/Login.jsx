import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

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
          <button
            onClick={() => navigate('/setup')}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all min-h-[48px] text-sm sm:text-base"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            Connect your Telegram account to get started
          </p>
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
