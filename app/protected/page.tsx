import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import VoteControl from '@/components/vote-control'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  // Fetch captions the user has voted on
  const { data: votedItems, error } = await supabase
    .from('caption_votes')
    .select(`
      vote_value,
      captions (
        id,
        content,
        created_datetime_utc,
        profiles (id, first_name, last_name, email),
        images (url)
      )
    `)
    .eq('profile_id', user.id)
    .order('created_datetime_utc', { foreignTable: 'captions', ascending: false });

  // Get all votes for these captions to show correct scores
  const captionIds = votedItems?.map(item => (item.captions as any)?.id).filter(Boolean) || [];
  const { data: allVotes } = await supabase
    .from('caption_votes')
    .select('caption_id, vote_value')
    .in('caption_id', captionIds);

  const scores: Record<string, number> = {};
  allVotes?.forEach(v => {
    scores[v.caption_id] = (scores[v.caption_id] || 0) + v.vote_value;
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
          <Link
            href="/"
            className="text-sm font-semibold bg-[#343536] text-[#d7dadc] px-6 py-1.5 rounded-full hover:bg-[#444546] transition-colors"
          >
            Home
          </Link>
        </div>

        {/* Profile Content */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <div className="bg-[#1a1a1b] p-6 rounded border border-gray-800 mb-6">
            <h1 className="text-2xl font-bold mb-2">u/{user.email?.split('@')[0]}</h1>
            <p className="text-gray-500 text-sm">Voted Captions History</p>
          </div>

          <div className="flex flex-col gap-3">
            {votedItems && votedItems.length > 0 ? (
              votedItems.map((item: any) => {
                const post = item.captions;
                if (!post) return null;
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                const email = profile?.email;
                const username = email ? email.split('@')[0] : 'anonymous';
                const time = new Date(post.created_datetime_utc).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const score = scores[post.id] || 0;

                return (
                  <div key={post.id} className="flex border border-gray-800 bg-[#1a1a1b] rounded overflow-hidden">
                    <div className="bg-[#151516] w-10 flex flex-col items-center py-2">
                      <VoteControl
                        captionId={post.id}
                        initialScore={score}
                        initialUserVote={item.vote_value}
                        userId={user.id}
                      />
                    </div>
                    <div className="flex-1 p-2">
                      <div className="flex items-center gap-1 text-[12px] text-[#818384] mb-1">
                        <span className="font-bold text-[#d7dadc]">r/humor</span>
                        <span>•</span>
                        <span>{time}</span>
                      </div>
                      <h3 className="text-lg font-medium text-[#d7dadc] mb-2">{post.content}</h3>
                      {post.images?.url && (
                        <div className="rounded border border-gray-800 bg-black flex justify-center mb-2 overflow-hidden max-h-[300px]">
                          <img src={post.images.url} alt="Post content" className="max-w-full h-auto object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 bg-[#1a1a1b] rounded border border-gray-800">
                No voting history yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
