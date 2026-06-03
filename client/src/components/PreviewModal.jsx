import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { filesApi } from '../api';
import { X, Download, Loader2, File, FileText, FileImage } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 right-0 z-10 flex gap-2 p-2">
          <a
            href={downloadUrl}
            download={previewItem.name}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={() => setPreviewItem(null)}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center min-h-[200px]">
          {isImage ? (
            <img
              src={previewUrl}
              alt={previewItem.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError('Failed to load image'); }}
            />
          ) : isVideo ? (
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-[85vh] rounded-lg"
              onLoadedData={() => setLoading(false)}
              onError={() => { setLoading(false); setError('Failed to load video'); }}
            >
              Your browser does not support video playback.
            </video>
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="w-full h-[85vh] rounded-lg bg-white"
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
              <a
                href={downloadUrl}
                download={previewItem.name}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
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
    return <Loader2 className="w-8 h-8 animate-spin text-white" />;
  }

  return (
    <pre className="bg-gray-900 text-green-400 p-6 rounded-lg max-w-full max-h-[85vh] overflow-auto text-sm">
      {text}
    </pre>
  );
}
