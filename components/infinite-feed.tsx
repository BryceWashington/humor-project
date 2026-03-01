'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import VoteControl from './vote-control';
import { useRouter, useSearchParams } from 'next/navigation';

interface InfiniteFeedProps {
  initialCaptions: any[];
  initialVoteMap: Record<string, { score: number; userVote: number }>;
  initialVotedIds: string[];
  userId: string | undefined;
  currentSort: string;
}

export default function InfiniteFeed({
  initialCaptions,
  initialVoteMap,
  initialVotedIds,
  userId,
  currentSort,
}: InfiniteFeedProps) {
  const [captions, setCaptions] = useState(initialCaptions);
  const [voteMap, setVoteMap] = useState(initialVoteMap);
  const [votedIds, setVotedIds] = useState(initialVotedIds);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);
  const supabase = createClient();
  const router = useRouter();

  // Reset state when sort changes
  useEffect(() => {
    setCaptions(initialCaptions);
    setVoteMap(initialVoteMap);
    setHasMore(initialCaptions.length >= 20);
    setIsLoading(false);
  }, [currentSort, initialCaptions, initialVoteMap]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const lastCaption = captions[captions.length - 1];
    
    let query = supabase
      .from('captions')
      .select(`
        id, content, created_datetime_utc, like_count,
        profiles (id, first_name, last_name, email),
        images (url)
      `);

    if (currentSort === 'new') {
      query = query
        .order('created_datetime_utc', { ascending: false })
        .lt('created_datetime_utc', lastCaption.created_datetime_utc);
    } else {
      // Top Sorting
      const now = new Date();
      let startDate = new Date();
      
      if (currentSort === 'top_day') startDate.setDate(now.getDate() - 1);
      else if (currentSort === 'top_week') startDate.setDate(now.getDate() - 7);
      else if (currentSort === 'top_month') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 10);

      query = query
        .order('like_count', { ascending: false })
        .order('created_datetime_utc', { ascending: false })
        .gte('created_datetime_utc', startDate.toISOString())
        .range(captions.length, captions.length + 19);
    }

    if (votedIds.length > 0) {
      query = query.not('id', 'in', `(${votedIds.join(',')})`);
    }

    const { data: newCaptions, error } = await query.limit(20);

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

    setCaptions((prev) => {
      const existingIds = new Set(prev.map(c => c.id));
      const filteredNew = newCaptions.filter(c => !existingIds.has(c.id));
      return [...prev, ...filteredNew];
    });
    setVoteMap(updatedVoteMap);
    setIsLoading(false);
    if (newCaptions.length < 20) setHasMore(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [captions, hasMore, isLoading]);

  const handleSortChange = (sort: string) => {
    router.push(`/?sort=${sort}`);
  };

  return (
    <div className="flex flex-col">
      {/* Sort Bar */}
      <div className="flex justify-between items-center mb-4 bg-[#1a1a1b] p-2 px-4 rounded border border-gray-800">
        <span className="text-xs font-bold text-[#818384] uppercase tracking-wider">Sort By</span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="appearance-none bg-[#272729] text-[#d7dadc] text-xs font-bold py-1.5 pl-3 pr-8 rounded-md border border-gray-700 hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff4500] cursor-pointer transition-colors"
          >
            <option value="new">Newest</option>
            <option value="top_day">Top (Day)</option>
            <option value="top_week">Top (Week)</option>
            <option value="top_month">Top (Month)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#818384]">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {captions.map((post: any) => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        const email = profile?.email;
        const username = email ? email.split('@')[0] : 'anonymous';
        const time = new Date(post.created_datetime_utc).toLocaleString(undefined, { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
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
                onVote={(newValue) => {
                  if (newValue !== 0) {
                    setVotedIds((prev) => Array.from(new Set([...prev, post.id])));
                  } else {
                    setVotedIds((prev) => prev.filter(id => id !== post.id));
                  }
                }}
              />
            </div>

            {/* Right: Content */}
            <div className="flex-1 p-2">
              <div className="flex items-center gap-1 text-[12px] text-[#818384] mb-1">
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

      <div ref={observerTarget} className="py-8 flex flex-col items-center justify-center gap-4">
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-[#818384] border-t-[#d7dadc] rounded-full animate-spin"></div>
        ) : hasMore ? (
          <button
            onClick={() => loadMore()}
            className="px-6 py-2 rounded-full border border-[#818384] text-[#d7dadc] hover:bg-[#272729] transition-colors text-sm font-semibold"
          >
            Load More
          </button>
        ) : captions.length > 0 ? (
          <div className="text-[#818384] text-sm italic">You've reached the bottom. No more fresh captions!</div>
        ) : null}
      </div>
    </div>
  );
}
