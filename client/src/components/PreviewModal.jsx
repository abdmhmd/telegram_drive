import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { filesApi } from '../api';
import { X, Download, Loader2, File } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.93,
    transition: { duration: 0.15 },
  },
};

export default function PreviewModal() {
  const { previewItem, setPreviewItem } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!previewItem) return null;

  const isImage = previewItem.mime_type?.startsWith('image/');
  const isVideo = previewItem.mime_type?.startsWith('video/');
  const isPdf = previewItem.mime_type === 'application/pdf';
  const isText = previewItem.mime_type?.startsWith('text/') ||
    ['json', 'xml', 'csv', 'md', 'js', 'ts', 'py'].includes(previewItem.name?.split('.').pop());

  const previewUrl = filesApi.preview(previewItem.id);
  const downloadUrl = filesApi.download(previewItem.id);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        onClick={() => setPreviewItem(null)}
      >
        <motion.div
          className="relative max-w-4xl max-h-[90vh] w-full mx-auto"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="absolute top-0 right-0 z-10 flex gap-2 p-2">
            <motion.a
              href={downloadUrl}
              download={previewItem.name}
              className="p-2.5 bg-black/50 hover:bg-brand-500/80 rounded-lg text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Download"
            >
              <Download className="w-5 h-5" />
            </motion.a>
            <motion.button
              onClick={() => setPreviewItem(null)}
              className="p-2.5 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex items-center justify-center min-h-[200px]">
            {isImage ? (
              <img
                src={previewUrl}
                alt={previewItem.name}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError('Failed to load image'); }}
              />
            ) : isVideo ? (
              <video
                src={previewUrl}
                controls
                className="w-full h-auto max-h-[85vh] rounded-lg"
                onLoadedData={() => setLoading(false)}
                onError={() => { setLoading(false); setError('Failed to load video'); }}
              >
                Your browser does not support video playback.
              </video>
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] sm:h-[85vh] rounded-lg bg-white dark:bg-gray-800"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError('Failed to load PDF'); }}
                title={previewItem.name}
              />
            ) : isText ? (
              <TextPreview url={previewUrl} onLoad={() => setLoading(false)} onError={setError} />
            ) : (
              <div className="text-center text-white">
                <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Preview not available</p>
                <p className="text-sm opacity-50 mt-1">{previewItem.mime_type}</p>
                <motion.a
                  href={downloadUrl}
                  download={previewItem.name}
                  className="btn-primary inline-flex mt-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" /> Download
                </motion.a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TextPreview({ url, onLoad, onError }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => { setText(t); setLoading(false); onLoad(); })
      .catch((e) => { setLoading(false); onError('Failed to load text'); });
  }, [url]);

  if (loading) {
    return <Loader2 className="w-8 h-8 animate-spin text-brand-500" />;
  }

  return (
    <pre className="bg-gray-900 dark:bg-gray-950 text-brand-300 p-6 rounded-lg max-w-full max-h-[85vh] overflow-auto text-sm">
      {text}
    </pre>
  );
}
