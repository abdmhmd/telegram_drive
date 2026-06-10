import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { X, Link, Copy, Check, Clock } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.15 },
  },
};

export default function ShareModal() {
  const { setShowShare, selectedItem, createShareLink } = useStore();
  const [expires, setExpires] = useState(24);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    const result = await createShareLink(selectedItem.id, expires || null);
    if (result) {
      setShareUrl(result.url);
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.querySelector('#share-url-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={() => setShowShare(false)}
      >
        <motion.div
          className="bg-white dark:bg-surface-card rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-0"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-surface-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share File</h2>
            <button onClick={() => setShowShare(false)} className="icon-btn">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sharing</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{selectedItem?.name}</p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Link expiration
              </label>
              <select
                value={expires}
                onChange={(e) => setExpires(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
                <option value="">No expiration</option>
              </select>
            </div>

            {!shareUrl ? (
              <motion.button
                onClick={generateLink}
                disabled={loading}
                className="btn-primary w-full mt-5"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Share Link'}
              </motion.button>
            ) : (
              <motion.div
                className="mt-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-2">
                  <input id="share-url-input" type="text" value={shareUrl} readOnly />
                  <motion.button
                    onClick={copyToClipboard}
                    className="px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
                    whileTap={{ scale: 0.95 }}
                    aria-label="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-brand-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {copied && (
                    <motion.p
                      className="text-brand-500 text-xs mt-2"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      Link copied to clipboard!
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
