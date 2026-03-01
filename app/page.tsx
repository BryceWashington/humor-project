import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import InfiniteFeed from '@/components/infinite-feed';
import Navbar from '@/components/navbar';

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch caption IDs the user has already voted on to filter them out
  let votedCaptionIds: string[] = [];
  if (user) {
    const { data: userVotes } = await supabase
      .from('caption_votes')
      .select('caption_id')
      .eq('profile_id', user.id);
    
    if (userVotes) {
      votedCaptionIds = userVotes.map(v => v.caption_id);
    }
  }

  let query = supabase
    .from('captions')
    .select(`
      id, content, created_datetime_utc,
      profiles (id, first_name, last_name, email),
      images (url)
    `)
    .order('created_datetime_utc', { ascending: false });

  if (votedCaptionIds.length > 0) {
    query = query.not('id', 'in', `(${votedCaptionIds.join(',')})`);
  }

  const { data: captions, error: captionsError } = await query.limit(20);

  if (captionsError) {
    console.error('Error fetching captions:', captionsError);
    return <div className="p-8 text-center text-red-500">Failed to load content.</div>;
  }

  const captionIds = captions?.map((c) => c.id) || [];
  const { data: votes } = await supabase
    .from('caption_votes')
    .select('caption_id, vote_value, profile_id')
    .in('caption_id', captionIds);

  const initialVoteMap: Record<string, { score: number; userVote: number }> = {};
  captions?.forEach(c => initialVoteMap[c.id] = { score: 0, userVote: 0 });

  votes?.forEach((vote) => {
    const entry = initialVoteMap[vote.caption_id];
    if (entry) {
      entry.score += vote.vote_value;
      if (user && vote.profile_id === user.id) entry.userVote = vote.vote_value;
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#030303] text-[#d7dadc] font-sans">
      <Navbar />
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center px-4 py-2">
        {/* Content Area */}
        <div className="max-w-2xl w-full">
          {captions ? (
            <InfiniteFeed 
              initialCaptions={captions}
              initialVoteMap={initialVoteMap}
              initialVotedIds={votedCaptionIds}
              userId={user?.id}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">No captions found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
