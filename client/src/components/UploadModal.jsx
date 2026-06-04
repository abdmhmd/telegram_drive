import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import useStore from '../store/useStore';
import { filesApi } from '../api';
import { Upload, X, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function UploadModal() {
  const { setShowUpload, uploadFiles, currentFolder } = useStore();
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
    setTimeout(() => {
      setShowUpload(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-2 sm:mx-0">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Files</h2>
          <button onClick={() => setShowUpload(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
            {isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium">Drop files here...</p>
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
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <File className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatSize(file.size)}</p>
                    {progress[i] !== undefined && uploading && (
                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress[i]}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {completed.includes(i) ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : errors.find((e) => e.index === i) ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : uploading ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                  ) : (
                    <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                      <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{err.name}: {err.error}</p>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={() => setShowUpload(false)}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
