import { useState } from 'react';
import useStore from '../store/useStore';
import { X, Link, Copy, Check, Clock } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Share File</h2>
          <button onClick={() => setShowShare(false)} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-1">Sharing</p>
          <p className="font-medium text-gray-900 truncate">{selectedItem?.name}</p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Link expiration
            </label>
            <select
              value={expires}
              onChange={(e) => setExpires(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value={1}>1 hour</option>
              <option value={24}>24 hours</option>
              <option value={168}>7 days</option>
              <option value={720}>30 days</option>
              <option value="">No expiration</option>
            </select>
          </div>

          {!shareUrl ? (
            <button
              onClick={generateLink}
              disabled={loading}
              className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Link className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Share Link'}
            </button>
          ) : (
            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  id="share-url-input"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
              {copied && <p className="text-green-600 text-xs mt-2">Link copied to clipboard!</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
