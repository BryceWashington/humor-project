'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import VoteControl from './vote-control';

interface InfiniteFeedProps {
  initialCaptions: any[];
  initialVoteMap: Record<string, { score: number; userVote: number }>;
  userId: string | undefined;
}

export default function InfiniteFeed({
  initialCaptions,
  initialVoteMap,
  userId,
}: InfiniteFeedProps) {
  const [captions, setCaptions] = useState(initialCaptions);
  const [voteMap, setVoteMap] = useState(initialVoteMap);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);
  const supabase = createClient();

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const lastCaption = captions[captions.length - 1];
    
    const { data: newCaptions, error } = await supabase
      .from('captions')
      .select(`
        id, content, created_datetime_utc,
        profiles (id, first_name, last_name, email),
        images (url)
      `)
      .order('created_datetime_utc', { ascending: false })
      .lt('created_datetime_utc', lastCaption.created_datetime_utc)
      .limit(20);

    if (error || !newCaptions || newCaptions.length === 0) {
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    const newCaptionIds = newCaptions.map((c) => c.id);
    const { data: votes } = await supabase
      .from('caption_votes')
      .select('caption_id, vote_value, profile_id')
      .in('caption_id', newCaptionIds);

    const updatedVoteMap = { ...voteMap };
    newCaptions.forEach(c => updatedVoteMap[c.id] = { score: 0, userVote: 0 });

    if (votes) {
      votes.forEach((vote) => {
        const entry = updatedVoteMap[vote.caption_id];
        if (entry) {
          entry.score += vote.vote_value;
          if (userId && vote.profile_id === userId) entry.userVote = vote.vote_value;
        }
      });
    }

    setCaptions((prev) => [...prev, ...newCaptions]);
    setVoteMap(updatedVoteMap);
    setIsLoading(false);
    if (newCaptions.length < 20) setHasMore(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [captions, hasMore, isLoading]);

  return (
    <div className="flex flex-col">
      {captions.map((post: any) => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        const email = profile?.email;
        const username = email ? email.split('@')[0] : 'anonymous';
        const time = new Date(post.created_datetime_utc).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const voteData = voteMap[post.id] || { score: 0, userVote: 0 };

        return (
          <div key={post.id} className="flex border border-gray-800 bg-[#1a1a1b] mb-3 rounded hover:border-[#343536] transition-colors overflow-hidden">
            {/* Left: Voting area */}
            <div className="bg-[#151516] w-10 flex flex-col items-center py-2">
              <VoteControl
                captionId={post.id}
                initialScore={voteData.score}
                initialUserVote={voteData.userVote}
                userId={userId}
              />
            </div>

            {/* Right: Content */}
            <div className="flex-1 p-2">
              <div className="flex items-center gap-1 text-[12px] text-[#818384] mb-1">
                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300">
                  {username[0]?.toUpperCase() || '?'}
                </div>
                <span className="font-bold text-[#d7dadc] hover:underline cursor-pointer">r/humor</span>
                <span>•</span>
                <span>{time}</span>
              </div>
              
              <h3 className="text-lg font-medium text-[#d7dadc] mb-2">{post.content}</h3>

              {post.images?.url && (
                <div className="rounded border border-gray-800 bg-black flex justify-center mb-2 overflow-hidden">
                  <img src={post.images.url} alt="Post content" className="max-w-full h-auto max-h-[512px] object-contain" />
                </div>
              )}

              <div className="mt-2" />
            </div>
          </div>
        );
      })}

      <div ref={observerTarget} className="h-20 flex items-center justify-center">
        {isLoading && <div className="w-6 h-6 border-2 border-[#818384] border-t-[#d7dadc] rounded-full animate-spin"></div>}
      </div>
    </div>
  );
}
