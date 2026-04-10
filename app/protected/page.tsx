import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import ProfileTabs from '@/components/profile-tabs'
import SignOutButton from '@/components/signout-button'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  // Fetch captions the user has voted on
  const { data: votedItems } = await supabase
    .from('caption_votes')
    .select(`
      vote_value,
      modified_datetime_utc,
      captions (
        id,
        content,
        created_datetime_utc,
        profiles!captions_profile_id_fkey (id, first_name, last_name, email),
        images (id, url)
      )
    `)
    .eq('profile_id', user.id)
    .order('modified_datetime_utc', { ascending: false });

  // Fetch user's uploaded images
  const { data: uploadedImages } = await supabase
    .from('images')
    .select('id, url, created_datetime_utc')
    .eq('profile_id', user.id)
    .order('created_datetime_utc', { ascending: false });

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
      <Navbar />
      <div className="w-full max-w-6xl mx-auto flex flex-col px-4 py-2">
        {/* Profile Content */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-[#1a1a1b] p-6 rounded border border-gray-800 mb-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold text-gray-300">
              {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{user.email?.split('@')[0]}</h1>
                <SignOutButton />
              </div>
              <p className="text-[#818384] text-sm">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <ProfileTabs 
            votedItems={votedItems || []} 
            uploadedImages={uploadedImages || []} 
            scores={scores} 
            userId={user.id}
          />
        </div>
      </div>
    </main>
  )
}
