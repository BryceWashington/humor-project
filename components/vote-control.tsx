'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from './toast-context';

interface VoteControlProps {
  captionId: string;
  initialScore: number;
  initialUserVote: number;
  userId: string | undefined;
  onVote?: (newValue: number) => void;
}

export default function VoteControl({
  captionId,
  initialScore,
  initialUserVote,
  userId,
  onVote,
}: VoteControlProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  const handleVote = async (newValue: number) => {
    if (!userId) {
      showToast("You need to log in to vote");
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    const nextVote = userVote === newValue ? 0 : newValue;
    const scoreDiff = nextVote - userVote;
    
    setScore((prev) => prev + scoreDiff);
    setUserVote(nextVote);

    try {
      if (nextVote === 0) {
        await supabase
          .from('caption_votes')
          .delete()
          .match({ caption_id: captionId, profile_id: userId });
      } else {
        await supabase
          .from('caption_votes')
          .upsert({
            caption_id: captionId,
            profile_id: userId,
            vote_value: nextVote,
            created_by_user_id: userId,
            modified_by_user_id: userId,
          }, { onConflict: 'caption_id, profile_id' });
      }

      // Update like_count on the caption itself for faster sorting
      await supabase.rpc('increment_caption_score', { 
        cid: captionId, 
        val: scoreDiff 
      });

      if (onVote) onVote(nextVote);
    } catch (error) {
      console.error('Voting failed:', error);
      setScore((prev) => prev - scoreDiff);
      setUserVote(userVote);
    } finally {
      setIsVoting(false);
    }
  };

  return (
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
  );
}
