/*
  Home sayfası, örnek olması içim yapıldı tam değil.
  Giriş yaptıktan sonra yönlendirilecek sayfa.
*/


'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiMenu, FiSearch, FiFilter, FiCalendar, FiList } from 'react-icons/fi';
import { FaSort } from "react-icons/fa6";
import PostCard from '@/components/home/PostCard';
import { MdOutlineViewAgenda } from "react-icons/md";
import { MdOutlineViewDay } from "react-icons/md";
import { MdOutlineAdd } from "react-icons/md";

import { MdOutlineGridView } from "react-icons/md";
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { messageApi } from '@/lib/messageApi';
import SearchIsland from '@/components/SearchIsland';
import ScrollToTopButton from '@/components/ScrollToTopButton';

// Custom 4x4 grid icon component (16 squares)
const QuadGridIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="4" height="4" rx="0.5" />
    <rect x="8" y="2" width="4" height="4" rx="0.5" />
    <rect x="14" y="2" width="4" height="4" rx="0.5" />
    <rect x="20" y="2" width="2" height="4" rx="0.5" />
    <rect x="2" y="8" width="4" height="4" rx="0.5" />
    <rect x="8" y="8" width="4" height="4" rx="0.5" />
    <rect x="14" y="8" width="4" height="4" rx="0.5" />
    <rect x="20" y="8" width="2" height="4" rx="0.5" />
    <rect x="2" y="14" width="4" height="4" rx="0.5" />
    <rect x="8" y="14" width="4" height="4" rx="0.5" />
    <rect x="14" y="14" width="4" height="4" rx="0.5" />
    <rect x="20" y="14" width="2" height="4" rx="0.5" />
    <rect x="2" y="20" width="4" height="2" rx="0.5" />
    <rect x="8" y="20" width="4" height="2" rx="0.5" />
    <rect x="14" y="20" width="4" height="2" rx="0.5" />
    <rect x="20" y="20" width="2" height="2" rx="0.5" />
  </svg>
);

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
  userId: number;
  imageBase64?: string;
  imageContentType?: string;
  userProfilePhoto?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'quad' | 'double' | 'single'>('double');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [postType, setPostType] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false); // Sort popover'ı kapatma
  const sortRef = useRef<HTMLDivElement>(null);
  
  // Highlighted item from URL parameter
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);

  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const [reportPostTitle, setReportPostTitle] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Message form states
  const [openMessageForms, setOpenMessageForms] = useState<Set<number>>(new Set());

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle sending message to post owner
  const handleSendMessage = async (userId: number, userName: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Redirect to messages page with the user ID as a parameter
    router.push(`/messages?startWith=${userId}`);
  };

  // Handle toggling message form
  const handleToggleMessageForm = (postId: number) => {
    setOpenMessageForms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Handle sending message text (for now just show alert, later integrate with backend)
  const handleSendMessageText = async (userId: number, userName: string, message: string, postId?: number) => {
    try {
      await messageApi.sendMessage({
        receiverId: userId,
        messageText: message,
        imageBase64List: [],
        referencedItemId: postId
      });
      showNotification('success', `Message sent to ${userName}`);
      // İsteğe bağlı: mesajlar sayfasına yönlendir
      // router.push(`/messages?startWith=${userId}`);
    } catch (error) {
      showNotification('error', 'Failed to send message');
    }
  };

  // Handle reporting a post
  const handleReportPost = async (postId: number, postTitle: string) => {
    setReportPostId(postId);
    setReportPostTitle(postTitle);
    setShowReportModal(true);
  };

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Submit report
  const submitReport = async () => {
    if (!reportPostId || !reportReason.trim()) return;

    setIsSubmittingReport(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      console.log('Submitting report for post:', reportPostId, 'with reason:', reportReason);

      const response = await fetch('http://localhost:8080/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: reportPostId,
          reason: reportReason,
          description: reportDescription.trim() || null,
        }),
      });

      console.log('Report response status:', response.status);

      if (response.ok) {
        setShowReportModal(false);
        setReportPostId(null);
        setReportPostTitle('');
        setReportReason('');
        setReportDescription('');
        setError('');
        showNotification('success', 'Report submitted successfully');
      } else {
        let errorMessage = 'Failed to submit report';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        showNotification('error', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8080');
        showNotification('error', 'Cannot connect to server. Please make sure the backend is running.');
      } else if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError('Failed to submit report. Please try again.');
        showNotification('error', 'Failed to submit report. Please try again.');
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Close report modal
  const closeReportModal = () => {
    setShowReportModal(false);
    setReportPostId(null);
    setReportPostTitle('');
    setReportReason('');
    setReportDescription('');
  };

  // Function to highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    
    try {
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearchTerm, 'gi');
      
      // Find all matches with their positions
      const matches: { start: number; end: number; text: string }[] = [];
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        if (regex.lastIndex === match.index) {
          regex.lastIndex++;
        }
      }
      
      if (matches.length === 0) return text;
      
      const result = [];
      let lastIndex = 0;
      
      matches.forEach((match, index) => {
        // Add text before the match
        if (match.start > lastIndex) {
          result.push(
            <span key={`before-${index}`}>
              {text.substring(lastIndex, match.start)}
            </span>
          );
        }
        
        // Fazladan gözüken boşluk kaldırıldı.
        result.push(
          <span key={`highlight-${index}`} className="bg-yellow-200 text-yellow-900 font-semibold rounded">
            {match.text}
          </span>
        );
        
        lastIndex = match.end;
      });
      
      // Add remaining text after the last match
      if (lastIndex < text.length) {
        result.push(
          <span key="after">
            {text.substring(lastIndex)}
          </span>
        );
      }
      
      return <>{result}</>;
    } catch (error) {
      // If anything goes wrong, just return the original text
      return text;
    }
  };

  // Get today's date in yyyy-mm-dd format (local time)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  // Geliştirilmiş ban kontrolü fonksiyonu
  const checkUserBanStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return false;
      }

      // Backend'den fresh user bilgisi çek
      const response = await fetch('http://localhost:8080/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // LocalStorage'ı güncelle
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Ban kontrolü yap
        if (userData.isBanned) {
          const banExpiresAt = userData.banExpiresAt;
          const now = new Date();
          
          if (!banExpiresAt || new Date(banExpiresAt) > now) {
            // Kullanıcı hala banlı
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth');
            return false;
          }
          // Ban süresi bitmiş ama backend henüz güncellememiş olabilir
          // Bu durumda kullanıcıya devam etmesine izin ver
        }
        
        return true;
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking ban status:', error);
      return true; // Hata durumunda erişime izin ver
    }
  };

  // Admin kontrolü ekle
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Önce ban kontrolü yap
        const canAccess = await checkUserBanStatus();
        if (!canAccess) return;

        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        const response = await fetch('http://localhost:8080/api/v1/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Admin ise admin panel'e yönlendir
          router.push('/admin');
          return;
        }
      } catch (error) {
        // Admin değil, normal kullanıcı olarak devam et
      }
    };

    checkAdminStatus();
  }, [router]);

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
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (dateStart.trim()) params.append('dateStart', dateStart.trim());
        if (dateEnd.trim()) params.append('dateEnd', dateEnd.trim());
        
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
            // Posts now include userProfilePhoto from backend
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
  }, [router, sortOrder, postType, selectedCategories, selectedLocations, searchQuery, dateStart, dateEnd]);

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

  // Sort popover'ı kapatma
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortPopoverOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sortPopoverOpen]);

  // Handle highlightItem URL parameter
  useEffect(() => {
    const highlightItemParam = searchParams.get('highlightItem');
    if (highlightItemParam) {
      const itemId = parseInt(highlightItemParam);
      setHighlightedItemId(itemId);
      
      // Scroll to the highlighted item after posts are loaded
      setTimeout(() => {
        const itemElement = document.querySelector(`[data-post-id="${itemId}"]`);
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      // Clear the URL parameter after 3 seconds and remove highlight
      setTimeout(() => {
        setHighlightedItemId(null);
        // Remove the URL parameter without affecting browser history
        const url = new URL(window.location.href);
        url.searchParams.delete('highlightItem');
        window.history.replaceState({}, document.title, url.toString());
      }, 3000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-200">
      {/* Hamburger Menu Icon */}
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <SearchIsland
          postType={postType}
          setPostType={setPostType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          datePopoverOpen={datePopoverOpen}
          setDatePopoverOpen={setDatePopoverOpen}
          dateStart={dateStart}
          setDateStart={setDateStart}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          calendarRef={calendarRef as React.RefObject<HTMLDivElement | null>}
          filterPopoverOpen={filterPopoverOpen}
          setFilterPopoverOpen={setFilterPopoverOpen}
          filterSearch={filterSearch}
          setFilterSearch={setFilterSearch}
          categories={categories}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          locations={locations}
          selectedLocations={selectedLocations}
          setSelectedLocations={setSelectedLocations}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortPopoverOpen={sortPopoverOpen}
          setSortPopoverOpen={setSortPopoverOpen}
          sortRef={sortRef as React.RefObject<HTMLDivElement | null>}
          sortSelectedOnOpen={sortSelectedOnOpen}
          setSortSelectedOnOpen={setSortSelectedOnOpen}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onNewPost={() => router.push('/posts/create')}
        />
        <div className="flex flex-col space-y-6">
          {/* İlan Listesi ve diğer içerik ... */}
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
            <div className={
              viewMode === 'quad' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                : viewMode === 'double' 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "flex flex-col space-y-6 max-w-2xl mx-auto"
            }>
              {posts.map((post) => (
                <PostCard
                  key={`post-${post.id}`}
                  post={post}
                  searchQuery={searchQuery}
                  onSendMessage={handleSendMessage}
                  onReportPost={handleReportPost}
                  highlightText={highlightText}
                  showMessageForm={openMessageForms.has(post.id)}
                  onToggleMessageForm={handleToggleMessageForm}
                  onSendMessageText={handleSendMessageText}
                  viewMode={viewMode}
                  isHighlighted={highlightedItemId === post.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <ScrollToTopButton />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Report Post</h2>
              <button
                onClick={closeReportModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-800 mb-2">Post: <span className="font-semibold text-gray-900">"{reportPostTitle}"</span></p>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason for reporting *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent"
                  required
                >
                  <option value="" className="text-gray-500">Select a reason</option>
                  <option value="inappropriate_content" className="text-gray-900">Inappropriate Content</option>
                  <option value="spam" className="text-gray-900">Spam</option>
                  <option value="false_information" className="text-gray-900">False Information</option>
                  <option value="harassment" className="text-gray-900">Harassment</option>
                  <option value="other" className="text-gray-900">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent resize-none placeholder-gray-500"
                  placeholder="Provide additional details about why you're reporting this post..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeReportModal}
                  className="flex-1 bg-gray-700 text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={!reportReason.trim() || isSubmittingReport}
                  className="flex-1 bg-[#9a0e20] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#801d21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 animate-slide-in-right">
          <div className={`max-w-sm w-full rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="p-4 flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <BsCheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <BsXCircle className="w-4 h-4 text-red-600" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className={`ml-2 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none ${
                  notification.type === 'success' ? 'hover:text-green-600' : 'hover:text-red-600'
                }`}
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}