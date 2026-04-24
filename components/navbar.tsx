'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCaptionGenerator } from './caption-generation-context';
import LoginButton from './login-button';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const { openCaptionGenerator } = useCaptionGenerator();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      // @ts-ignore
      if (window.__TEST_SESSION__) {
        console.log('NAVBAR: Using test session', window.__TEST_SESSION__.user.id);
        // @ts-ignore
        setUser(window.__TEST_SESSION__.user);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // @ts-ignore
      if (window.__TEST_SESSION__) {
        // @ts-ignore
        setUser(window.__TEST_SESSION__.user);
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isProfilePage = pathname === '/protected';

  return (
    <nav className="sticky top-0 z-40 bg-[#1a1a1b] border-b border-gray-800 w-full mb-4">
      <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff4500] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">H</span>
            </div>
            Humor Social
          </Link>
        </div>

        <div className="flex gap-2 items-center">
          {user ? (
            <div className="flex gap-3 items-center">
              <button
                onClick={() => openCaptionGenerator()}
                className="flex items-center gap-2 text-sm font-semibold bg-[#343536] text-[#d7dadc] px-4 py-1.5 rounded-full hover:bg-[#444546] transition-colors"
                title="Upload Image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline">Upload</span>
              </button>
              
              {isProfilePage ? (
                <Link
                  href="/"
                  className="text-sm font-semibold bg-[#d7dadc] text-black px-6 py-1.5 rounded-full hover:bg-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
              ) : (
                <Link
                  href="/protected"
                  className="text-sm font-semibold bg-[#d7dadc] text-black px-6 py-1.5 rounded-full hover:bg-white transition-colors"
                >
                  Profile
                </Link>
              )}
            </div>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  );
}
