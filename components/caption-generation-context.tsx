'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import UploadModal from './upload-modal';

interface CaptionGenerationContextType {
  openCaptionGenerator: (imageId?: string, imageUrl?: string) => void;
}

const CaptionGenerationContext = createContext<CaptionGenerationContextType | undefined>(undefined);

export function CaptionGenerationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageId, setImageId] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const openCaptionGenerator = (id?: string, url?: string) => {
    console.log('CONTEXT: openCaptionGenerator called', { id, url });
    setImageId(id);
    setImageUrl(url);
    setIsOpen(true);
  };

  const handleClose = () => {
    console.log('CONTEXT: handleClose called');
    setIsOpen(false);
    setImageId(undefined);
    setImageUrl(undefined);
  };

  return (
    <CaptionGenerationContext.Provider value={{ openCaptionGenerator }}>
      {children}
      <UploadModal 
        isOpen={isOpen} 
        onClose={handleClose} 
        initialImageId={imageId} 
        initialImageUrl={imageUrl} 
      />
    </CaptionGenerationContext.Provider>
  );
}

export function useCaptionGenerator() {
  const context = useContext(CaptionGenerationContext);
  if (context === undefined) {
    throw new Error('useCaptionGenerator must be used within a CaptionGenerationProvider');
  }
  return context;
}
