'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from './toast-context';
import { useCaptionGenerator } from './caption-generation-context';

interface FeedItemProps {
  post: any;
  userId: string | undefined;
  initialScore: number;
  initialUserVote: number;
  onVoteAction: (captionId: string, newValue: number) => void;
}

export default function FeedItem({
  post,
  userId,
  initialScore,
  initialUserVote,
  onVoteAction,
}: FeedItemProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const { showToast } = useToast();
  const { openCaptionGenerator } = useCaptionGenerator();
  const supabase = createClient();

  const handleVote = async (newValue: number) => {
    if (!userId) {
      showToast("You need to log in to vote");
      return;
    }
    if (isVoting) return;

    const nextVote = userVote === newValue ? 0 : newValue;
    const scoreDiff = nextVote - userVote;
    
    // Optimistic UI
    setScore((prev) => prev + scoreDiff);
    setUserVote(nextVote);
    setIsVoting(true);

    try {
      if (nextVote === 0) {
        await supabase
          .from('caption_votes')
          .delete()
          .match({ caption_id: post.id, profile_id: userId });
      } else {
        await supabase
          .from('caption_votes')
          .upsert({
            caption_id: post.id,
            profile_id: userId,
            vote_value: nextVote,
            created_by_user_id: userId,
            modified_by_user_id: userId,
          }, { onConflict: 'caption_id, profile_id' });
      }

      onVoteAction(post.id, nextVote);
    } catch (error) {
      console.error('Voting failed:', error);
      // Rollback
      setScore((prev) => prev - scoreDiff);
      setUserVote(userVote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleGenerateMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      showToast("You need to log in to generate captions");
      return;
    }
    if (post.images?.id && post.images?.url) {
      openCaptionGenerator(post.images.id, post.images.url);
    }
  };

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const email = profile?.email;
  const username = email ? email.split('@')[0] : 'anonymous';
  const time = new Date(post.created_datetime_utc).toLocaleString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex border border-gray-800 bg-[#1a1a1b] mb-3 rounded hover:border-[#343536] transition-colors overflow-hidden">
      {/* Left: Voting area */}
      <div className="bg-[#151516] w-10 flex flex-col items-center py-2">
        <div className="flex flex-col items-center w-12 pt-1">
          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className={`p-1 rounded hover:bg-[#1a1a1b] transition-colors cursor-pointer ${
              userVote === 1 ? 'text-[#ff4500]' : 'text-[#818384] hover:text-[#d7dadc]'
            }`}
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 4l8 8H4l8-8z" />
            </svg>
          </button>

          <span className={`text-xs font-bold my-1 ${
            userVote === 1 ? 'text-[#ff4500]' : 
            userVote === -1 ? 'text-[#7193ff]' : 'text-[#d7dadc]'
          }`}>
            {Intl.NumberFormat('en-US', { notation: "compact" }).format(score)}
          </span>

          <button
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            className={`p-1 rounded hover:bg-[#1a1a1b] transition-colors cursor-pointer ${
              userVote === -1 ? 'text-[#7193ff]' : 'text-[#818384] hover:text-[#d7dadc]'
            }`}
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 20l-8-8h16l-8 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex-1 p-3">
        <div className="flex items-center justify-between text-[12px] text-[#818384] mb-1">
          <span>{time}</span>
          <button 
            onClick={handleGenerateMore}
            className="flex items-center gap-1 hover:text-[#ff4500] transition-colors"
            title="Generate more captions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Generate</span>
          </button>
        </div>
        
        <h3 className="text-lg font-medium text-[#d7dadc] mb-2">{post.content}</h3>

        {post.images?.url && (
          <div className="relative group rounded border border-gray-800 bg-black flex justify-center mb-2 overflow-hidden h-[450px]">
            {/* Left side overlay (Downvote) */}
            <div 
              className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-500/20 bg-gradient-to-r from-black/40 to-transparent"
              onClick={() => handleVote(-1)}
            >
              <div className={`transform transition-transform group-hover:scale-110 scale-90`}>
                <svg className={`w-16 h-16 fill-current drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${userVote === -1 ? 'text-[#7193ff]' : 'text-white/80'}`} viewBox="0 0 24 24">
                  <path d="M12 20l-8-8h16l-8 8z" />
                </svg>
              </div>
            </div>

            {/* Right side overlay (Upvote) */}
            <div 
              className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-orange-500/20 bg-gradient-to-l from-black/40 to-transparent"
              onClick={() => handleVote(1)}
            >
              <div className={`transform transition-transform group-hover:scale-110 scale-90`}>
                <svg className={`w-16 h-16 fill-current drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${userVote === 1 ? 'text-[#ff4500]' : 'text-white/80'}`} viewBox="0 0 24 24">
                  <path d="M12 4l8 8H4l8-8z" />
                </svg>
              </div>
            </div>

            <img src={post.images.url} alt="Post content" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="mt-2" />
      </div>
    </div>
  );
}
