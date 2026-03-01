'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import FeedItem from './feed-item';
import { useRouter } from 'next/navigation';
import SortOptions from './sort-options';

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

  return (
    <div className="flex flex-col">
      {/* Mobile Sort Bar */}
      <SortOptions currentSort={currentSort} isMobile={true} />

      <div className="flex flex-col">
        {captions.map((post: any) => {
          const voteData = voteMap[post.id] || { score: 0, userVote: 0 };
          
          return (
            <FeedItem
              key={post.id}
              post={post}
              userId={userId}
              initialScore={voteData.score}
              initialUserVote={voteData.userVote}
              onVoteAction={(captionId, newValue) => {
                if (newValue !== 0) {
                  setVotedIds((prev) => Array.from(new Set([...prev, captionId])));
                } else {
                  setVotedIds((prev) => prev.filter(id => id !== captionId));
                }
              }}
            />
          );
        })}
      </div>

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
