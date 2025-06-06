'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/Sidebar';
import { FiLogOut, FiUser, FiMenu, FiShield } from 'react-icons/fi';


interface UserProfile {
  profilePhotoUrl?: string;
  nickname?: string;
  name?: string;
}

export default function Navbar() {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:8080/api/v1/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Failed to check admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  // Fetch user profile for profile photo
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:8080/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  return (
    <>
      <nav className='bg-gradient-to-r from-[#9a0e20] to-[#7a0b19] text-white shadow-lg'>
        <div className='container mx-auto px-4 py-3'>
          <div className='flex justify-between items-center'>
            {/* Logo */}
            <div className="flex items-center space-x-4">
              {/* Hamburger sadece admin değilse göster */}
              {!isAdmin && (
                <button
                  onClick={() => setOpen(true)}
                  className='p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
                >
                  <FiMenu className="h-6 w-6" />
                </button>
              )}
              
              <Link href={isAdmin ? '/admin' : '/home'} className='flex items-center space-x-3 group'>
                <div className='relative w-12 h-12 overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20'>
                  <Image
                    src='/assets/iyte_logo_tr.png'
                    alt='İYTE Logo'
                    fill
                    className='object-contain p-1'
                    sizes='(max-width: 48px) 100vw'
                    priority
                  />
                </div>
                <span className='text-2xl font-bold tracking-wide group-hover:text-gray-200 transition-colors'>
                  {isAdmin ? 'IYTEBul Admin' : 'IYTEBul'}
                </span>
              </Link>
            </div>

            {/* Sağ Taraf Butonları */}
           
            <div className="flex items-center space-x-2">
              {/* Admin badge */}
              {isAdmin && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg">
                  <FiShield className="text-yellow-300" />
                  <span className="text-sm font-medium">Administrator</span>
                </div>
              )}

              {/* Çıkış Butonu */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className='p-2 rounded-lg hover:bg-white/10 transition-colors relative cursor-pointer'
              >
                <FiLogOut className='text-xl' />
              </button>

              {/* Profil Butonu - Sadece admin değilse göster */}
              {!isAdmin && (
                <button
                  onClick={() => router.push('/profile')}
                  className='flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
                  title={userProfile?.nickname || userProfile?.name || 'Profile'}
                >
                  <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30'>
                    {userProfile?.profilePhotoUrl ? (
                      <Image
                        src={userProfile.profilePhotoUrl}
                        alt='Profil Fotoğrafı'
                        width={32}
                        height={32}
                        className='w-full h-full object-cover rounded-full'
                      />
                    ) : (
                      <FiUser className='text-xl text-white' />
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="mb-4">
                <FiLogOut className="mx-auto text-4xl text-[#9a0e20] mb-2" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Logout
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to logout from your account?
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 text-white bg-[#9a0e20] rounded-lg hover:bg-[#7a0b19] transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}