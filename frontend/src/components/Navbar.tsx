'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSidebar } from './ui/Sidebar';
import { FiLogOut, FiUser, FiMenu } from 'react-icons/fi';
import { MdOutlineNotificationsNone } from "react-icons/md";

export default function Navbar() {
  const router = useRouter();
  const { setOpen } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  return (
    <nav className='bg-gradient-to-r from-[#9a0e20] to-[#7a0b19] text-white shadow-lg'>
      <div className='container mx-auto px-4 py-3'>
        <div className='flex justify-between items-center'>
          {/* Hamburger + Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setOpen(true)}
              className='p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <Link href='/home' className='flex items-center space-x-3 group'>
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
                IYTEBul
              </span>
            </Link>
          </div>

          {/* Sağ Taraf Butonları */}
          <div className='flex items-center space-x-4'>
            {/* Bildirimler */}
            <button
              className='p-2 rounded-lg hover:bg-white/10 transition-colors relative cursor-pointer'
              title='Bildirimler'
            >
              <MdOutlineNotificationsNone className='text-xl' />
              <span className='absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full'></span>
            </button>

            {/* Çıkış Butonu */}
            <button
              onClick={handleLogout}
              className='p-2 rounded-lg hover:bg-white/10 transition-colors relative cursor-pointer'
            >
              <FiLogOut className='text-xl' />
            </button>

            {/* Profil Butonu - Direkt Profil Sayfasına Yönlendirme */}
            <button
              onClick={() => router.push('/profile')}
              className='flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
            >
              <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center'>
                <FiUser className='text-xl' />
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
