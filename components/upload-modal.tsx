'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { uploadImagePipeline, generateCaptions, CaptionRecord } from '@/lib/api-service';
import VoteControl from './vote-control';

interface HumorFlavor {
  id: string;
  slug: string;
  description: string;
  is_pinned: boolean;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageId?: string;
  initialImageUrl?: string;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  initialImageId, 
  initialImageUrl 
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [captions, setCaptions] = useState<CaptionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [imageId, setImageId] = useState<string | null>(initialImageId || null);
  const [flavorId, setFlavorId] = useState<string>('');
  const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const fetchFlavors = async () => {
      const { data, error } = await supabase
        .from('humor_flavors')
        .select('id, slug, description, is_pinned')
        .order('is_pinned', { ascending: false })
        .order('slug', { ascending: true });
      
      if (data && data.length > 0) {
        setFlavors(data);
        // Try to find 'standard' or use the first one
        const standardFlavor = data.find(f => f.slug === 'standard');
        setFlavorId(standardFlavor ? standardFlavor.id : data[0].id);
      }
    };
    if (isOpen) {
      fetchFlavors();
    }
  }, [supabase, isOpen]);

  useEffect(() => {
    if (initialImageId) setImageId(initialImageId);
    if (initialImageUrl) setPreviewUrl(initialImageUrl);
  }, [initialImageId, initialImageUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setImageId(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setCaptions([]);
    setLoadingProgress(0);

    // Simulate progress while generating
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 400);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        clearInterval(progressInterval);
        throw new Error('You must be logged in to upload an image.');
      }

      const result = await uploadImagePipeline(file, token, (message) => {
        setLoadingMessage(message);
      }, flavorId);

      setLoadingProgress(100);
      setTimeout(() => {
        setCaptions(result.captions);
        setImageId(result.imageId);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during the upload process.');
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleRegenerate = async () => {
    if (!imageId) return;

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Generating more captions...');
    setLoadingProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 300);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        clearInterval(progressInterval);
        throw new Error('You must be logged in to generate captions.');
      }

      const newCaptions = await generateCaptions(imageId, token, flavorId);
      setLoadingProgress(100);
      setTimeout(() => {
        setCaptions(newCaptions);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during caption generation.');
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleClose = () => {
    setCaptions([]);
    setFile(null);
    setPreviewUrl(null);
    setImageId(null);
    onClose();
  };

  const renderFlavorDropdown = (isSmall = false) => (
    <div className="space-y-2">
      <label className={`text-[#818384] font-bold uppercase tracking-wider ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
        Humor Flavor:
      </label>
      <select
        value={flavorId}
        onChange={(e) => setFlavorId(e.target.value)}
        className="w-full bg-[#272729] border border-gray-700 text-[#d7dadc] rounded p-2 text-sm focus:outline-none focus:border-[#ff4500]"
      >
        {flavors.map((f) => (
          <option key={f.id} value={f.id}>
            {f.slug.charAt(0).toUpperCase() + f.slug.slice(1)} {f.is_pinned ? '📌' : ''}
          </option>
        ))}
      </select>
      {!isSmall && flavors.find(f => f.id === flavorId)?.description && (
        <p className="text-xs text-gray-500 italic">
          {flavors.find(f => f.id === flavorId)?.description}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1b] w-full max-w-2xl rounded-md border border-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {imageId ? 'Generate Captions' : 'Upload Image'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!isLoading && captions.length === 0 && (
            <div className="space-y-6">
              {!imageId && (
                <div 
                  className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-[#ff4500] transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded" />
                      <p className="text-[#d7dadc] font-medium">{file?.name || 'Current Image'}</p>
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
              )}

              {imageId && previewUrl && (
                <div className="flex justify-center">
                  <img src={previewUrl} alt="Current" className="max-h-64 rounded border border-gray-800" />
                </div>
              )}

              {renderFlavorDropdown()}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                disabled={(!imageId && !file) || flavors.length === 0}
                onClick={imageId ? handleRegenerate : handleUpload}
                className="w-full bg-[#d7dadc] text-black font-bold py-3 rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {imageId ? 'Generate Captions' : 'Upload & Generate'}
              </button>
            </div>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-8">
              {previewUrl && (
                <div className="relative max-w-sm mx-auto overflow-hidden rounded-lg border border-gray-800 shadow-2xl">
                  {/* Grayscale Base */}
                  <img 
                    src={previewUrl} 
                    alt="Loading Grayscale" 
                    className="max-h-64 w-full object-contain grayscale opacity-40" 
                  />
                  {/* Colored Overlay (Clipping from bottom up) */}
                  <div 
                    className="absolute inset-0 transition-all duration-500 ease-out"
                    style={{ 
                      clipPath: `inset(${100 - loadingProgress}% 0 0 0)`,
                    }}
                  >
                    <img 
                      src={previewUrl} 
                      alt="Loading Color" 
                      className="max-h-64 w-full object-contain" 
                    />
                  </div>
                  {/* Percentage Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tabular-nums">
                      {Math.round(loadingProgress)}%
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#818384] border-t-[#ff4500] rounded-full animate-spin"></div>
                  <p className="text-[#d7dadc] font-medium text-lg tracking-wide">{loadingMessage}</p>
                </div>
                <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#ff4500] transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {captions.length > 0 && !isLoading && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 space-y-4">
                {previewUrl && (
                  <img src={previewUrl} alt="Uploaded image" className="w-full h-auto rounded border border-gray-800" />
                )}
                
                <div className="space-y-4 pt-2">
                  {renderFlavorDropdown(true)}
                  <button
                    onClick={handleRegenerate}
                    className="w-full bg-[#343536] text-[#d7dadc] text-sm font-bold py-2 rounded-full hover:bg-[#444546] transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 flex flex-col h-full">
                <h3 className="text-[#d7dadc] font-bold border-b border-gray-800 pb-2 mb-4">Generated Captions:</h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {captions.map((cap) => (
                    <div key={cap.id} className="bg-[#272729] rounded text-[#d7dadc] border border-gray-800 flex overflow-hidden">
                      <div className="bg-[#151516] border-r border-gray-800">
                        <VoteControl 
                          captionId={cap.id} 
                          initialScore={0} 
                          initialUserVote={0} 
                          userId={userId} 
                        />
                      </div>
                      <div className="p-3 flex-1 flex items-center">
                        {cap.content}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full bg-[#d7dadc] text-black font-bold py-2 rounded-full hover:bg-white transition-colors mt-6"
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
