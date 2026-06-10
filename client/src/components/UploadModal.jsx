import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import useStore from '../store/useStore';
import { filesApi } from '../api';
import { Upload, X, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function UploadModal() {
  const { setShowUpload, currentFolder } = useStore();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [completed, setCompleted] = useState([]);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: files.length > 0,
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((prev) => ({ ...prev, [i]: 0 }));
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) formData.append('parent_id', currentFolder);
        await filesApi.upload(formData, (e) => {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress((prev) => ({ ...prev, [i]: pct }));
        });
        setCompleted((prev) => [...prev, i]);
      } catch (err) {
        setErrors((prev) => [...prev, { index: i, name: file.name, error: err.response?.data?.error || err.message }]);
      }
    }
    setUploading(false);
    setTimeout(() => { setShowUpload(false); window.location.reload(); }, 1000);
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
      >
        <motion.div
          className="bg-white dark:bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-2 sm:mx-0"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-surface-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Files</h2>
            <button onClick={() => setShowUpload(false)} className="icon-btn">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 ${isDragActive ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'}`} />
              {isDragActive ? (
                <p className="text-brand-600 dark:text-brand-400 font-medium">Drop files here...</p>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Drag & drop files here</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">or click to browse</p>
                </>
              )}
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-[40vh] overflow-y-auto">
                {files.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <File className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatSize(file.size)}</p>
                      {progress[i] !== undefined && uploading && (
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <motion.div
                            className="bg-brand-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress[i]}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                    </div>
                    {completed.includes(i) ? (
                      <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
                    ) : errors.find((e) => e.index === i) ? (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : uploading ? (
                      <Loader2 className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" />
                    ) : (
                      <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg"
              >
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">{err.name}: {err.error}</p>
                ))}
              </motion.div>
            )}
          </div>

          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-surface-border flex gap-3">
            <button onClick={() => setShowUpload(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="btn-primary flex-1"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
