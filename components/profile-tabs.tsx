'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import FeedItem from './feed-item';

interface ProfileTabsProps {
  votedItems: any[];
  uploadedImages: any[];
  scores: Record<string, number>;
  userId: string;
}

export default function ProfileTabs({ votedItems, uploadedImages, scores, userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'voting' | 'uploads'>('voting');
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [imageCaptions, setImageCaptions] = useState<any[]>([]);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);
  const supabase = createClient();

  const handleImageClick = async (img: any) => {
    setSelectedImage(img);
    setIsLoadingCaptions(true);
    
    const { data, error } = await supabase
      .from('captions')
      .select('*')
      .eq('image_id', img.id)
      .order('created_datetime_utc', { ascending: false });

    if (data) {
      setImageCaptions(data);
    }
    setIsLoadingCaptions(false);
  };

  const closeCaptionModal = () => {
    setSelectedImage(null);
    setImageCaptions([]);
  };

  return (
    <div className="w-full">
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('voting')}
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'voting' 
              ? 'text-white border-[#ff4500]' 
              : 'text-[#818384] border-transparent hover:text-white'
          }`}
        >
          Voting History
        </button>
        <button
          onClick={() => setActiveTab('uploads')}
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'uploads' 
              ? 'text-white border-[#ff4500]' 
              : 'text-[#818384] border-transparent hover:text-white'
          }`}
        >
          Uploaded Images
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {activeTab === 'voting' && (
          votedItems && votedItems.length > 0 ? (
            votedItems.map((item: any) => {
              const post = item.captions;
              if (!post) return null;
              const score = scores[post.id] || 0;

              return (
                <FeedItem
                  key={post.id}
                  post={post}
                  userId={userId}
                  initialScore={score}
                  initialUserVote={item.vote_value}
                  onVoteAction={() => {}} // Voting is handled internally by FeedItem
                />
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-500 bg-[#1a1a1b] rounded border border-gray-800 italic">
              No voting history yet. Go upvote some captions!
            </div>
          )
        )}

        {activeTab === 'uploads' && (
          uploadedImages && uploadedImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uploadedImages.map((img: any) => (
                <div 
                  key={img.id}
                  onClick={() => handleImageClick(img)}
                  className="border border-gray-800 bg-[#1a1a1b] rounded overflow-hidden hover:border-[#ff4500] transition-colors cursor-pointer group"
                >
                  <div className="aspect-square bg-black flex items-center justify-center overflow-hidden">
                    <img src={img.url} alt="Uploaded content" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3 bg-[#151516] flex justify-between items-center">
                    <p className="text-[12px] text-[#818384]">
                      {new Date(img.created_datetime_utc).toLocaleDateString()}
                    </p>
                    <span className="text-[10px] font-bold text-[#ff4500] uppercase">View Captions</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 bg-[#1a1a1b] rounded border border-gray-800 italic">
              No images uploaded yet. Use the "Upload Image" button to get started!
            </div>
          )
        )}
      </div>

      {/* Caption Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1b] w-full max-w-4xl rounded-md border border-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Captions for Image</h3>
              <button 
                onClick={closeCaptionModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Image Column */}
              <div className="md:w-1/2 p-4 bg-black flex items-center justify-center border-r border-gray-800">
                <img 
                  src={selectedImage.url} 
                  alt="Selected upload" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Captions Column */}
              <div className="md:w-1/2 flex flex-col">
                <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {isLoadingCaptions ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                      <div className="w-8 h-8 border-3 border-[#818384] border-t-[#ff4500] rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading captions...</p>
                    </div>
                  ) : imageCaptions.length > 0 ? (
                    imageCaptions.map((cap) => (
                      <div key={cap.id} className="p-3 bg-[#272729] rounded border border-gray-800 text-[#d7dadc] text-sm leading-relaxed">
                        {cap.content}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 italic text-sm">No captions found for this image.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-800 bg-[#151516]">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    Uploaded on {new Date(selectedImage.created_datetime_utc).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
