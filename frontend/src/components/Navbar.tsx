'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiLogOut, FiSearch, FiUser } from 'react-icons/fi';
import { MdOutlineNotificationsNone } from "react-icons/md";

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Token'ı kaldır
    router.push('/auth'); // Auth sayfasına yönlendir
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Arama yapılıyor:', searchQuery); // Arama yapılacak ?? yakında
    setIsSearchOpen(false);
  };

  return (
    <nav className='bg-gradient-to-r from-[#9a0e20] to-[#7a0b19] text-white shadow-lg'>
      <div className='container mx-auto px-4 py-3'>
        <div className='flex justify-between items-center'>
          {/* Logo ve IYTEBul */}
          <Link href='/' className='flex items-center space-x-3 group'>
            <div className='relative w-12 h-12 overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20'>
              <Image
                src='/assets/iyte_logo_tr.png'
                alt='İYTE Logo'
                fill
                className='object-contain p-1' // padding 1
                sizes='(max-width: 48px) 100vw'
                priority
              />
            </div>
            <span className='text-2xl font-bold tracking-wide group-hover:text-gray-200 transition-colors'>
              IYTEBul
            </span>
          </Link>

          {/* Sağ Taraf Butonları */}
          <div className='flex items-center space-x-4'>
            {/* Arama Butonu ve Form */}
            <div className='relative'>
              {isSearchOpen ? (
                <form
                  onSubmit={handleSearch}
                  className='absolute right-0 top-1/2 -translate-y-1/2'
                >
                  <div className='flex items-center bg-white/10 rounded-lg border border-white/20'>
                    <input
                      type='text'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Ara...'
                      className='w-64 px-4 py-2 bg-transparent border-none outline-none placeholder-white/70'
                      autoFocus
                      onBlur={() =>
                        setTimeout(() => setIsSearchOpen(false), 200)
                      }
                    />
                    <button
                      type='submit'
                      className='px-4 py-2 hover:text-white/80 cursor-pointer'
                    >
                      <FiSearch className='text-xl' />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className='p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
                  title='Ara'
                >
                  <FiSearch className='text-xl' />
                </button>
              )}
            </div>

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

            {/* Profil Menüsü */}
            <div className='relative'>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} // Profil menüsünü aç/kapat, kapatıldığında false yapar
                className='flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer'
              >
                <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center'>
                  <FiUser className='text-xl' />
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className='absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg py-1 z-50'>
                  <Link
                    href='/profile'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-100'
                  >
                    Profil
                  </Link>
                  <Link
                    href='/settings'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-100'
                  >
                    Ayarlar
                  </Link>
                  <hr className='my-1' />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
