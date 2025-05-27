/*
  Home sayfası, örnek olması içim yapıldı tam değil.
  Giriş yaptıktan sonra yönlendirilecek sayfa.
*/


'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiMenu, FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filterSearch, setFilterSearch] = useState('');
  // Example categories and locations (replace with real data if available)
  const categories = ['Accessories', 'Clothing', 'Cards', 'Other'];
  const [locations, setLocations] = useState<{id: number, name: string, nameEn: string}[]>([]);
  // Add state for selected categories and locations
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sortSelectedOnOpen, setSortSelectedOnOpen] = useState(false);

  // Get today's date in yyyy-mm-dd format (local time)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams();
        params.append('sortOrder', sortOrder);
        if (postType !== 'all') params.append('type', postType.toUpperCase());
        if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
        if (selectedLocations.length > 0) params.append('location', selectedLocations.join(','));
        const response = await fetch(
          `http://localhost:8080/api/v1/posts?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const responseText = await response.text();
        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            setPosts(data);
          } catch (parseError) {
            setError('Error parsing response from server');
          }
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth');
        } else {
          let errorMessage;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || 'İlanlar yüklenirken bir hata oluştu';
          } catch (e) {
            errorMessage = responseText || 'Error loading posts';
          }
          setError(errorMessage);
        }
      } catch (error) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [router, sortOrder, postType, selectedCategories, selectedLocations]);

  // Fetch locations from backend (like Create Post)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:8080/api/v1/locations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(() => {});
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePopoverOpen && calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setDatePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [datePopoverOpen]);

  // Close filter popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterPopoverOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterPopoverOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-200">
      {/* Hamburger Menu Icon */}
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
                    All
                  </button>
                  <button
                    onClick={() => setPostType('lost')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      postType === 'lost' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lost
                  </button>
                  <button
                    onClick={() => setPostType('found')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      postType === 'found' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Found
                  </button>
                </div>
              </div>

              {/* Sağ Taraf - Search, Görünüm ve Yeni İlan Butonları */}
              <div className="flex items-center space-x-4 w-full justify-end">
                {/* Search Bar - Always Visible, Centered */}
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center w-full max-w-2xl bg-gray-100 rounded-xl border border-white/70 px-4 min-h-[38px] h-full focus-within:border-[#801d21] transition-colors relative">
                    <FiSearch className="text-2xl text-gray-600 mr-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search for lost items..."
                      className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 text-lg"
                    />
                    {/* Calendar Icon and Popover */}
                    <div className="relative flex items-center">
                      <FiCalendar
                        className="text-2xl text-gray-600 ml-3 cursor-pointer hover:text-gray-800 transition-colors"
                        onClick={() => setDatePopoverOpen(v => !v)}
                      />
                      {datePopoverOpen && (
                        <div ref={calendarRef} className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                          <div className="font-semibold text-gray-900 mb-2">Sort by Date</div>
                          <div className="flex flex-col gap-1 mb-4">
                            <button
                              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${sortOrder === 'desc' ? 'font-bold text-[#9a0e20]' : 'text-gray-700'}`}
                              onClick={() => setSortOrder('desc')}
                            >
                              {sortOrder === 'desc' ? <span>✓</span> : <span className="inline-block w-4" />} Newest to oldest
                            </button>
                            <button
                              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${sortOrder === 'asc' ? 'font-bold text-[#9a0e20]' : 'text-gray-700'}`}
                              onClick={() => setSortOrder('asc')}
                            >
                              {sortOrder === 'asc' ? <span>✓</span> : <span className="inline-block w-4" />} Oldest to newest
                            </button>
                          </div>
                          <hr className="my-2" />
                          <div className="font-semibold text-gray-900 mb-2">Date Range</div>
                          <div className="flex flex-col gap-2 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Start</label>
                              <input
                                type="date"
                                value={dateStart}
                                onChange={e => setDateStart(e.target.value)}
                                className="w-full border rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20]"
                                placeholder="gg.aa.yyyy"
                                max={dateEnd && dateEnd < today ? dateEnd : today}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">End</label>
                              <input
                                type="date"
                                value={dateEnd}
                                onChange={e => setDateEnd(e.target.value)}
                                className="w-full border rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20]"
                                placeholder="gg.aa.yyyy"
                                min={dateStart || undefined}
                                max={today}
                              />
                            </div>
                          </div>
                          <button
                            className="w-full bg-[#9a0e20] text-white rounded-lg py-2 font-semibold hover:bg-[#801d21] transition-colors"
                            onClick={() => setDatePopoverOpen(false)}
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Filter Icon and Popover */}
                    <div className="relative flex items-center">
                      <FiFilter
                        className={`text-2xl ml-2 cursor-pointer hover:text-gray-800 transition-colors ${
                          (selectedCategories.length > 0 || selectedLocations.length > 0) && !filterPopoverOpen ? 'text-[#761a1e]' : 'text-gray-600'
                        }`}
                        onClick={() => {
                          setFilterPopoverOpen(v => {
                            const next = !v;
                            if (next) {
                              setFilterSearch("");
                              setSortSelectedOnOpen(true);
                            }
                            return next;
                          });
                        }}
                      />
                      {filterPopoverOpen && (
                        <div ref={filterRef} className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-gray-900">Filters</div>
                            {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
                              <button
                                onClick={() => {
                                  setSelectedCategories([]);
                                  setSelectedLocations([]);
                                }}
                                className="text-sm text-[#9a0e20] hover:text-[#801d21] font-medium"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          {/* Small search input for filtering */}
                          <div className="flex items-center mb-3 bg-gray-100 rounded px-2 py-1">
                            <FiSearch className="text-gray-500 mr-2 text-sm" />
                            <input
                              type="text"
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search..."
                              className="bg-transparent border-none outline-none text-sm flex-1 text-gray-800 placeholder-gray-400"
                            />
                          </div>
                          <div className="mb-2">
                            <div className="font-semibold text-gray-700 text-sm mb-1">Categories</div>
                            <div className="max-h-32 overflow-y-auto border-b pb-2 mb-2">
                              {(() => {
                                const filtered = categories.filter(cat => cat.toLowerCase().includes(filterSearch.toLowerCase()));
                                let ordered;
                                if (sortSelectedOnOpen) {
                                  const selected = filtered.filter(cat => selectedCategories.includes(cat));
                                  const unselected = filtered.filter(cat => !selectedCategories.includes(cat));
                                  ordered = [...selected, ...unselected];
                                } else {
                                  ordered = filtered;
                                }
                                return ordered.map((cat) => (
                                  <div
                                    key={`category-${cat}`}
                                    className={`px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-gray-800 flex items-center justify-between ${selectedCategories.includes(cat) ? 'font-semibold text-[#9a0e20]' : ''}`}
                                    onClick={() => {
                                      setSelectedCategories(selectedCategories.includes(cat)
                                        ? selectedCategories.filter(c => c !== cat)
                                        : [...selectedCategories, cat]);
                                      setSortSelectedOnOpen(false);
                                    }}
                                  >
                                    <span>{cat}</span>
                                    {selectedCategories.includes(cat) && <span className="ml-2 text-[#9a0e20]">✓</span>}
                                  </div>
                                ));
                              })()}
                            </div>
                            <div className="font-semibold text-gray-700 text-sm mb-1 mt-2">Locations</div>
                            <div className="max-h-32 overflow-y-auto">
                              {(() => {
                                const filtered = locations.filter(loc => loc.nameEn.toLowerCase().includes(filterSearch.toLowerCase()));
                                let ordered;
                                if (sortSelectedOnOpen) {
                                  const selected = filtered.filter(loc => selectedLocations.includes(loc.nameEn));
                                  const unselected = filtered.filter(loc => !selectedLocations.includes(loc.nameEn));
                                  ordered = [...selected, ...unselected];
                                } else {
                                  ordered = filtered;
                                }
                                return ordered.map((loc) => (
                                  <div
                                    key={`location-${loc.id}`}
                                    className={`px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-gray-800 flex items-center justify-between ${selectedLocations.includes(loc.nameEn) ? 'font-semibold text-[#9a0e20]' : ''}`}
                                    onClick={() => {
                                      setSelectedLocations(selectedLocations.includes(loc.nameEn)
                                        ? selectedLocations.filter(l => l !== loc.nameEn)
                                        : [...selectedLocations, loc.nameEn]);
                                      setSortSelectedOnOpen(false);
                                    }}
                                  >
                                    <span>{loc.nameEn}</span>
                                    {selectedLocations.includes(loc.nameEn) && <span className="ml-2 text-[#9a0e20]">✓</span>}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                  <span>New Post</span>
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
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">No posts yet.</div>
            </div>
          ) : (
            <div className={viewMode === 'double' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "flex flex-col space-y-6 max-w-2xl mx-auto"
            }>
              {posts.map((post) => (
                <div key={`post-${post.id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}
                        </p>
                      </div>
                      <span className={`ml-auto ${post.type.toUpperCase() === 'LOST' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} text-xs font-medium px-2.5 py-0.5 rounded`}>
                        {post.type.toUpperCase() === 'LOST' ? 'Lost' : 'Found'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                    
                    {post.imageBase64 ? (
                      <div className="mb-4 flex justify-center items-center bg-white rounded-lg border border-black" style={{padding: '4px'}}>
                        <img
                          src={`data:${post.imageContentType};base64,${post.imageBase64}`}
                          alt={post.title}
                          className="object-contain w-full"
                          style={{ maxHeight: '320px', background: '#fff' }}
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex justify-center items-center bg-white rounded-lg border border-black" style={{padding: '4px'}}>
                        <img
                          src={
                            post.category === 'Electronics' ? '/assets/electronic.jpeg' :
                            post.category === 'Clothing' ? '/assets/clothes.jpeg' :
                            post.category === 'Cards' ? '/assets/wallet.jpeg' :
                            post.category === 'Other' ? '/assets/others.jpeg' :
                            post.category === 'Accessories' ? '/assets/accessories.jpeg' :
                            '/assets/others.jpeg'
                          }
                          alt="Default category image"
                          className="object-contain w-full"
                          style={{ maxHeight: '320px', background: '#fff' }}
                        />
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-4">{post.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        Category: {post.category}
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        Location: {post.location}
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
                        <span>Send Message</span>
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
