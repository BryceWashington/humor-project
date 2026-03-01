'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { uploadImagePipeline, CaptionRecord } from '@/lib/api-service';

export default function UploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [captions, setCaptions] = useState<CaptionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setCaptions([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('You must be logged in to upload an image.');
      }

      const generatedCaptions = await uploadImagePipeline(file, token, (message) => {
        setLoadingMessage(message);
      });

      setCaptions(generatedCaptions);
    } catch (err: any) {
      setError(err.message || 'An error occurred during the upload process.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleClose = () => {
    setCaptions([]);
    setFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1b] w-full max-w-2xl rounded-md border border-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Upload Image</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!isLoading && captions.length === 0 && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-[#ff4500] transition-colors overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded" />
                    <p className="text-[#d7dadc] font-medium">{file?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[#d7dadc]">Click or drag to select an image</p>
                    <p className="text-xs text-gray-500">JPG, PNG, WEBP, GIF, HEIC</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                disabled={!file}
                onClick={handleUpload}
                className="w-full bg-[#d7dadc] text-black font-bold py-2 rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload & Generate Captions
              </button>
            </div>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="max-h-48 rounded opacity-50 grayscale" />
              )}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#818384] border-t-[#ff4500] rounded-full animate-spin"></div>
                <p className="text-[#d7dadc] font-medium">{loadingMessage}</p>
              </div>
            </div>
          )}

          {captions.length > 0 && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                {previewUrl && (
                  <img src={previewUrl} alt="Uploaded image" className="w-full h-auto rounded border border-gray-800" />
                )}
              </div>
              <div className="md:w-1/2 space-y-4">
                <h3 className="text-[#d7dadc] font-bold border-b border-gray-800 pb-2">Generated Captions:</h3>
                <div className="space-y-2">
                  {captions.map((cap, idx) => (
                    <div key={idx} className="bg-[#272729] p-3 rounded text-[#d7dadc] border border-gray-800">
                      {cap.content}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full bg-[#343536] text-[#d7dadc] font-bold py-2 rounded-full hover:bg-[#444546] transition-colors mt-4"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
