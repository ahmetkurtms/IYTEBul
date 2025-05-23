/*
  Home sayfası, örnek olması içim yapıldı tam değil.
  Giriş yaptıktan sonra yönlendirilecek sayfa.
*/


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Post {
  id: number;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  category: string;
  location: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  imageBase64?: string;
  imageContentType?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'double' | 'single'>('double');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [postType, setPostType] = useState<'all' | 'lost' | 'found'>('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/posts?sortOrder=${sortOrder}&type=${postType !== 'all' ? postType.toUpperCase() : ''}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth');
        } else {
          throw new Error('İlanlar yüklenirken bir hata oluştu');
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('İlanlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [router, sortOrder, postType]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Üst Bar - Filtreler ve Butonlar */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Sol Taraf - Filtreler */}
              <div className="flex items-center space-x-4">
                {/* Post Tipi Seçimi */}
                <div className="flex items-center bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setPostType('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      postType === 'all' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setPostType('lost')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      postType === 'lost' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Kayıp
                  </button>
                  <button
                    onClick={() => setPostType('found')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      postType === 'found' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bulunan
                  </button>
                </div>

                {/* Sıralama */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                  className="px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9a0e20] bg-white"
                >
                  <option value="desc">En yeniden en eskiye</option>
                  <option value="asc">En eskiden en yeniye</option>
                </select>
              </div>

              {/* Sağ Taraf - Görünüm ve Yeni İlan */}
              <div className="flex items-center space-x-4">
                {/* Görünüm Seçenekleri */}
                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('double')}
                    className={`p-2 rounded-lg ${
                      viewMode === 'double' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    title="İkili Görünüm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('single')}
                    className={`p-2 rounded-lg ${
                      viewMode === 'single' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Tekli Görünüm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                  </button>
                </div>

                {/* Yeni İlan Butonu */}
                <button
                  onClick={() => router.push('/posts/create')}
                  className="bg-[#9a0e20] text-white px-4 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Yeni İlan</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* İlan Listesi */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Yükleniyor...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Henüz hiç ilan yok.</div>
            </div>
          ) : (
            <div className={viewMode === 'double' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "flex flex-col space-y-6 max-w-2xl mx-auto"
            }>
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Post İçeriği */}
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <img
                          src="/assets/default_avatar.png"
                          alt={`${post.userName} profil fotoğrafı`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{post.userName}</p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                        </p>
                      </div>
                      <span className={`ml-auto ${post.type === 'LOST' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} text-xs font-medium px-2.5 py-0.5 rounded`}>
                        {post.type === 'LOST' ? 'Kayıp' : 'Bulundu'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                    
                    {post.imageBase64 && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={`data:${post.imageContentType};base64,${post.imageBase64}`}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-4">{post.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {post.location}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {/* TODO: Mesajlaşma fonksiyonu eklenecek */}}
                        className="flex items-center space-x-2 bg-[#9a0e20] text-white px-4 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>Mesaj Gönder</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
