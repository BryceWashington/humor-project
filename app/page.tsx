import { createClient } from '@/utils/supabase/server';
import LoginButton from '@/components/login-button';
import Link from 'next/link';
import InfiniteFeed from '@/components/infinite-feed';

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: captions, error: captionsError } = await supabase
    .from('captions')
    .select(`
      id, content, created_datetime_utc,
      profiles (id, first_name, last_name, email),
      images (url)
    `)
    .order('created_datetime_utc', { ascending: false })
    .limit(20);

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
      <div className="w-full max-w-4xl min-h-screen flex flex-col px-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1a1a1b] border-b border-gray-800 px-4 py-2 flex justify-between items-center mb-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff4500] rounded-full flex items-center justify-center">
              <span className="text-white text-lg">H</span>
            </div>
            Humor
          </Link>
          <div className="flex gap-2">
            {user ? (
              <Link
                href="/protected"
                className="text-sm font-semibold bg-[#d7dadc] text-black px-6 py-1.5 rounded-full hover:bg-white transition-colors"
              >
                Profile
              </Link>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {captions && captions.length > 0 ? (
            <InfiniteFeed 
              initialCaptions={captions}
              initialVoteMap={initialVoteMap}
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
