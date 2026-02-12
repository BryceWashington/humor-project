import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
        <div className="space-y-4 text-center">
          <p className="text-lg">
            Welcome back, <span className="font-semibold text-blue-500">{user.email}</span>!
          </p>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">User ID: {user.id}</p>
          </div>
          <p className="text-sm text-gray-500">You have successfully authenticated via Google.</p>
        </div>
      </div>
    </div>
  )
}
