'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
  FiUsers, 
  FiFileText, 
  FiAlertTriangle, 
  FiSearch, 
  FiTrash2, 
  FiUserX, 
  FiEye,
  FiMoreVertical,
  FiShield,
  FiUserCheck,
  FiFilter,
  FiCalendar
} from 'react-icons/fi';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { FaSort } from 'react-icons/fa6';
import Image from 'next/image';
import ConfirmationModal from '@/components/ConfirmationModal';

interface User {
  id: number;
  name: string;
  nickname: string;
  email: string;
  department: string;
  createdAt: string;
  isBanned: boolean;
  isVerified: boolean;
  profilePhotoUrl?: string;
  lastLogin?: string;
  banExpiresAt?: string;
  phoneNumber?: string;
  studentId?: string;
  surname?: string;
}

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
  reportCount: number;
}

interface Report {
  id: number;
  type: 'post' | 'user';
  // Post report fields
  postId?: number;
  postTitle?: string;
  postType?: string;
  // User report fields
  userId?: number;
  userNickname?: string;
  userEmail?: string;
  // Common fields
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reportedMessages?: { id: number; senderId?: number; content: string; sentAt?: string }[];
}

type TabType = 'users' | 'posts' | 'reports';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState<string>('1h');
  const [banReason, setBanReason] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Additional filters for posts (from home page)
  const [postSortOrder, setPostSortOrder] = useState<'desc' | 'asc'>('desc');
  const [postDateStart, setPostDateStart] = useState('');
  const [postDateEnd, setPostDateEnd] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locations, setLocations] = useState<{id: number, name: string, nameEn: string}[]>([]);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  
  // User details modal state
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();

  // Categories list
  const categories = ['Accessories', 'Clothing', 'Cards', 'Other'];

  // Get today's date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  // Show notification function
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000); // Auto hide after 5 seconds
  };

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePopoverOpen && calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setDatePopoverOpen(false);
      }
      if (filterPopoverOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterPopoverOpen(false);
      }
      if (sortPopoverOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [datePopoverOpen, filterPopoverOpen, sortPopoverOpen]);

  // Reset filters when changing tabs
  useEffect(() => {
    setSearchQuery('');
    setFilterStatus('all');
    if (activeTab === 'posts') {
      // Keep post-specific filters
    } else {
      // Reset post-specific filters when not on posts tab
      setPostDateStart('');
      setPostDateEnd('');
      setSelectedCategories([]);
      setSelectedLocations([]);
      setPostSortOrder('desc');
    }
  }, [activeTab]);

  // Mock data
  useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

    // Fetch real data from backend
    fetchUsers();
    fetchPosts();
    fetchLocations();
    fetchReports();
    
    setLoading(false);
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Full user data from backend:', data);
        console.log('First user detailed:', JSON.stringify(data[0], null, 2));
        setUsers(data);
      } else if (response.status === 403) {
        showNotification('error', 'Access denied: Admin role required');
        router.push('/home');
      } else {
        showNotification('error', 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('error', 'Error connecting to server');
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else if (response.status === 403) {
        showNotification('error', 'Access denied: Admin role required');
        router.push('/home');
      } else {
        showNotification('error', 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      showNotification('error', 'Error connecting to server');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations`);
      if (response.ok) {
        const locationsData = await response.json();
        setLocations(locationsData);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const reportsData = await response.json();
        setReports(reportsData);
      } else {
        console.error('Failed to fetch reports:', response.status);
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  };

  const handleBanUser = async (userId: number, duration?: string, reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Calculate ban expiry time based on duration using local time
      let banExpiresAt = null;
      if (duration && duration !== 'permanent') {
        const now = new Date();
        switch (duration) {
          case '1h':
            banExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case '24h':
            banExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case '7d':
            banExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            banExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const requestBody: any = {};
      if (banExpiresAt) {
        // Send as ISO string, backend will handle timezone conversion
        requestBody.banExpiresAt = banExpiresAt.toISOString().slice(0, -1); // Remove 'Z'
      }
      if (reason) {
        requestBody.banReason = reason;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
      });
      
      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { 
            ...user, 
            isBanned: !user.isBanned,
            banExpiresAt: banExpiresAt?.toISOString()
          } : user
        ));
        
        const user = users.find(u => u.id === userId);
        if (user?.isBanned) {
          showNotification('success', `${user.nickname || user.name} has been unbanned successfully`);
        } else {
          const durationText = duration === 'permanent' ? 'permanently' : 
                              duration === '1h' ? 'for 1 hour' :
                              duration === '24h' ? 'for 24 hours' :
                              duration === '7d' ? 'for 7 days' :
                              duration === '30d' ? 'for 30 days' : '';
          showNotification('success', `${user?.nickname || user?.name} has been banned ${durationText}`);
        }
      } else {
        showNotification('error', 'Failed to update user ban status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showNotification('error', 'An error occurred while updating user status');
    }
  };

  const [activeReportIdForBan, setActiveReportIdForBan] = useState<number | null>(null);

  const openBanModal = (user: User, reportId?: number) => {
    setSelectedUser(user);
    setBanDuration('1h');
    setBanReason('');
    setShowBanModal(true);
    setActiveReportIdForBan(reportId ?? null);
  };

  const closeBanModal = () => {
    setShowBanModal(false);
    setSelectedUser(null);
    setBanDuration('1h');
    setBanReason('');
    setActiveReportIdForBan(null);
  };

  const confirmBanUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.isBanned) {
      await handleBanUser(selectedUser.id);
    } else {
      await handleBanUser(selectedUser.id, banDuration, banReason);
      if (activeReportIdForBan) {
        await handleReportAction(activeReportIdForBan, 'approve');
      }
    }
    closeBanModal();
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'post', id: number, name: string } | null>(null);

  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setItemToDelete({
      type: 'user',
      id: userId,
      name: user.nickname || user.name
    });
    setShowDeleteConfirm(true);
  };

  const handleDeletePost = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setItemToDelete({
      type: 'post',
      id: postId,
      name: post.title
    });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = itemToDelete.type === 'user' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${itemToDelete.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/posts/${itemToDelete.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Update local state
        if (itemToDelete.type === 'user') {
          setUsers(prev => prev.filter(user => user.id !== itemToDelete.id));
          showNotification('success', `${itemToDelete.name} has been deleted successfully`);
          // User silindiyse, ilgili user reportların status'unu hem frontend'de hem backend'de ACTION_TAKEN yap
          const relatedUserReports = reports.filter(r => r.type === 'user' && r.userId === itemToDelete.id && r.status !== 'ACTION_TAKEN');
          for (const report of relatedUserReports) {
            await handleReportAction(report.id, 'approve');
          }
        } else {
          setPosts(prev => prev.filter(post => post.id !== itemToDelete.id));
          showNotification('success', `Post "${itemToDelete.name}" has been deleted successfully`);
          // Post silindiyse, ilgili raporların status'unu hem frontend'de hem backend'de ACTION_TAKEN yap
          const relatedReports = reports.filter(r => r.type === 'post' && r.postId === itemToDelete.id && r.status !== 'ACTION_TAKEN');
          for (const report of relatedReports) {
            await handleReportAction(report.id, 'approve');
          }
        }
      } else {
        showNotification('error', `Failed to delete ${itemToDelete.type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      showNotification('error', `An error occurred while deleting ${itemToDelete.type}`);
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const handleReportAction = async (reportId: number, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      // Map actions to status values
      const statusMap: { [key: string]: string } = {
        'approve': 'ACTION_TAKEN',
        'reject': 'DISMISSED'
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusMap[action]
        }),
      });

      if (response.ok) {
        // Update the report status in the state
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: statusMap[action] as 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN' }
            : report
        ));
        
        showNotification('success', `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      } else {
        throw new Error('Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      showNotification('error', 'Failed to update report status');
    }
  };

  const handleViewReportedPost = async (postId: number, reportId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      // Önce raporun status'unu "REVIEWED" olarak güncelle (eğer PENDING ise)
      const report = reports.find(r => r.id === reportId);
      if (report && report.status === 'PENDING') {
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/reports/${reportId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'REVIEWED' }),
        });
        if (statusResponse.ok) {
          // Raporun status'unu state'de güncelle
          setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'REVIEWED' } : r));
        }
      }

      // Find the post in posts array first
      const foundPost = posts.find(p => p.id === postId);
      if (foundPost) {
        setSelectedPost(foundPost);
        setShowPostModal(true);
        return;
      }

      // If not found in posts array, fetch from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const allPosts = await response.json();
        const reportedPost = allPosts.find((p: any) => p.id === postId);
        
        if (reportedPost) {
          // Convert to our Post interface format
          const postForModal: Post = {
            id: reportedPost.id,
            title: reportedPost.title,
            description: reportedPost.description,
            type: reportedPost.type,
            category: reportedPost.category,
            location: reportedPost.location,
            createdAt: reportedPost.createdAt,
            userName: reportedPost.userName,
            userEmail: reportedPost.userEmail,
            imageBase64: reportedPost.imageBase64,
            reportCount: reportedPost.reportCount
          };
          
          setSelectedPost(postForModal);
          setShowPostModal(true);
        } else {
          showNotification('error', 'Post not found');
        }
      } else {
        showNotification('error', 'Failed to fetch post details');
      }
    } catch (error) {
      console.error('Error fetching reported post:', error);
      showNotification('error', 'Failed to fetch post details');
    }
  };

  const handleViewReportedUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserForDetails(user);
      setShowUserDetailsModal(true);
    } else {
      showNotification('error', 'User not found');
    }
  };

  const openUserDetailsModal = (user: User) => {
    setSelectedUserForDetails(user);
    setShowUserDetailsModal(true);
  };

  const closeUserDetailsModal = () => {
    setShowUserDetailsModal(false);
    setSelectedUserForDetails(null);
  };

  const [filterReportType, setFilterReportType] = useState<string>('all');
  const [filterReason, setFilterReason] = useState('all');

  const REPORT_REASONS = [
    { value: "inappropriate_content", label: "Inappropriate Content" },
    { value: "spam", label: "Spam" },
    { value: "false_information", label: "False Information" },
    { value: "harassment", label: "Harassment" },
    { value: "other", label: "Other" }
  ];

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending',
    REVIEWED: 'Reviewed',
    DISMISSED: 'Rejected',
    ACTION_TAKEN: 'Action Taken'
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.nickname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'banned') return matchesSearch && user.isBanned;
    if (filterStatus === 'active') return matchesSearch && !user.isBanned;
    return matchesSearch;
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.userName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Basic filter status - improved with debug logging and case insensitive comparison
    let matchesStatus = true;
    if (filterStatus === 'reported') {
      matchesStatus = post.reportCount > 0;
    } else if (filterStatus === 'lost') {
      matchesStatus = (post.type || '').toString().toUpperCase() === 'LOST';
    } else if (filterStatus === 'found') {
      matchesStatus = (post.type || '').toString().toUpperCase() === 'FOUND';
    }
    
    // Advanced filters
    const matchesCategories = selectedCategories.length === 0 || selectedCategories.includes(post.category);
    const matchesLocations = selectedLocations.length === 0 || selectedLocations.includes(post.location);
    
    // Date range filter
    let matchesDateRange = true;
    if (postDateStart || postDateEnd) {
      const postDate = new Date(post.createdAt);
      if (postDateStart) {
        const startDate = new Date(postDateStart);
        matchesDateRange = matchesDateRange && postDate >= startDate;
      }
      if (postDateEnd) {
        const endDate = new Date(postDateEnd + 'T23:59:59');
        matchesDateRange = matchesDateRange && postDate <= endDate;
      }
    }
    
    const result = matchesSearch && matchesStatus && matchesCategories && matchesLocations && matchesDateRange;
    
    return result;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return postSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const filteredReports = reports.filter(report => {
    if (filterStatus !== 'all') {
      const statusMap: { [key: string]: string } = {
        'pending': 'PENDING',
        'reviewed': 'REVIEWED',
        'dismissed': 'DISMISSED',
        'action_taken': 'ACTION_TAKEN'
      };
      const backendStatus = statusMap[filterStatus];
      if (report.status?.toUpperCase() !== backendStatus) return false;
    }
    if (filterReportType !== 'all' && report.type !== filterReportType) return false;
    if (filterReason !== 'all' && report.reason !== filterReason) return false;
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      (report.postTitle?.toLowerCase().includes(q) ||
       report.userNickname?.toLowerCase().includes(q) ||
       report.userEmail?.toLowerCase().includes(q) ||
       report.reporterName?.toLowerCase().includes(q) ||
       report.reason?.toLowerCase().includes(q) ||
       report.description?.toLowerCase().includes(q))
    );
  });

  function getDefaultImageForCategory(category: string) {
    switch (category?.toLowerCase()) {
      case 'clothing':
        return '/assets/clothes.jpeg';
      case 'accessories':
        return '/assets/accessories.jpeg';
      case 'cards':
        return '/assets/wallet.jpeg';
      default:
        return '/assets/others.jpeg';
      case 'electronic':
        return '/assets/electronic.jpeg';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9a0e20] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage users, posts, and reports</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors cursor-pointer ${
                  activeTab === 'users'
                    ? 'text-[#9a0e20] border-b-2 border-[#9a0e20] bg-[#f8d7da]/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiUsers className="w-5 h-5" />
                <span>Users ({users.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors cursor-pointer ${
                  activeTab === 'posts'
                    ? 'text-[#9a0e20] border-b-2 border-[#9a0e20] bg-[#f8d7da]/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiFileText className="w-5 h-5" />
                <span>Posts ({posts.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'text-[#9a0e20] border-b-2 border-[#9a0e20] bg-[#f8d7da]/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiAlertTriangle className="w-5 h-5" />
                <span>Reports ({reports.filter(r => r.status === 'PENDING').length})</span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-200">
              {activeTab === 'reports' ? (
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Search reports by post, user, reason..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] text-gray-900 font-medium"
                  />
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="all" className="cursor-pointer">All Statuses</option>
                    <option value="pending" className="cursor-pointer">Pending</option>
                    <option value="reviewed" className="cursor-pointer">Reviewed</option>
                    <option value="dismissed" className="cursor-pointer">Rejected</option>
                    <option value="action_taken" className="cursor-pointer">Action Taken</option>
                  </select>
                  <select
                    value={filterReportType}
                    onChange={e => setFilterReportType(e.target.value)}
                    className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="all" className="cursor-pointer">All Types</option>
                    <option value="post" className="cursor-pointer">Post Reports</option>
                    <option value="user" className="cursor-pointer">User Reports</option>
                  </select>
                  <select
                    value={filterReason}
                    onChange={e => setFilterReason(e.target.value)}
                    className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="all" className="cursor-pointer">All Reasons</option>
                    {REPORT_REASONS.map(reason => (
                      <option key={reason.value} value={reason.value} className="cursor-pointer">{reason.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent text-gray-900 placeholder-gray-600 font-medium`}
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                  </div>
                  {/* ... diğer filtreler ... */}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                          {user.profilePhotoUrl ? (
                            <Image
                              src={user.profilePhotoUrl}
                              alt={user.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            <span className="text-sm text-gray-500">@{user.nickname}</span>
                            {user.isVerified && (
                              <BsCheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {user.isBanned && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Banned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: enUS })}
                            {user.lastLogin && (
                              <span> • Last login {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: enUS })}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUserDetailsModal(user)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openBanModal(user)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            user.isBanned
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          }`}
                          title={user.isBanned ? 'Unban User' : 'Ban User'}
                        >
                          {user.isBanned ? <FiUserCheck className="w-4 h-4" /> : <FiUserX className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{post.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              post.type === 'LOST' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {post.type}
                            </span>
                            {post.reportCount > 0 && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                {post.reportCount} reports
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{post.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>By {post.userName}</span>
                            <span>•</span>
                            <span>{post.category}</span>
                            <span>•</span>
                            <span>{post.location}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleViewPost(post)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer"
                            title="View Post"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                            title="Delete Post"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {filteredReports.map((report, idx) => {
                    const reasonLabel = REPORT_REASONS.find(r => r.value === report.reason)?.label || report.reason;
                    return (
                      <div key={`${report.type}-${report.id}`}
                        className={`bg-gray-50 rounded-lg p-4${idx !== filteredReports.length - 1 ? ' border-b border-gray-300' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{reasonLabel}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                report.status === 'PENDING' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : report.status === 'REVIEWED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : report.status === 'DISMISSED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {STATUS_LABELS[report.status] || report.status}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
                                {report.type === 'post' ? 'Post Report' : 'User Report'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Reporter: {report.reporterName}</span>
                              <span>•</span>
                              {report.type === 'post' ? (
                                <>
                                  <span>Post: {report.postTitle}</span>
                                  <span>•</span>
                                </>
                              ) : (
                                <>
                                  <span>User: {report.userNickname} ({report.userEmail})</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: enUS })}</span>
                            </div>
                            {report.type === 'user' && report.reportedMessages && report.reportedMessages.length > 0 && (
                              <div className="mt-2 bg-gray-100 rounded p-2">
                                <div className="font-semibold text-xs text-gray-700 mb-1">Reported Messages:</div>
                                <ul className="text-xs text-gray-800 space-y-1">
                                  {report.reportedMessages.map((msg: any) => (
                                    <li key={msg.id} className="border-b border-gray-200 pb-1 mb-1 last:border-b-0 last:mb-0">
                                      <span className="font-medium">{msg.content}</span>
                                      <span className="ml-2 text-gray-500">({new Date(msg.sentAt).toLocaleString()})</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {report.type === 'post' && (
                              <button
                                onClick={() => handleViewReportedPost(report.postId!, report.id)}
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer"
                                title="View Reported Post"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            )}
                            {report.type === 'user' && (
                              <button
                                onClick={() => openBanModal(users.find(u => u.id === report.userId)!, report.id)}
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer"
                                title="View Reported User"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            )}
                            {(report.status === 'PENDING' || report.status === 'REVIEWED') && (
                              <>
                                <button
                                  onClick={() => handleReportAction(report.id, 'reject')}
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                                  title="Reject Report"
                                >
                                  <BsXCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Post View Modal */}
      {showPostModal && selectedPost && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closePostModal}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Post Details</h2>
              <button
                onClick={closePostModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative">
                    {selectedPost.imageBase64 ? (
                      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={selectedPost.imageBase64.startsWith('data:') ? selectedPost.imageBase64 : `data:image/jpeg;base64,${selectedPost.imageBase64}`}
                          alt={selectedPost.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                          src={getDefaultImageForCategory(selectedPost.category)}
                          alt="No image available"
                          className="w-32 h-32 object-contain opacity-60"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedPost.title}
                    </h3>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPost.type === 'LOST' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedPost.type}
                    </div>
                    {selectedPost.reportCount > 0 && (
                      <div className="ml-2 inline-flex px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {selectedPost.reportCount} reports
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedPost.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#9a0e20] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">C</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Category</p>
                        <p className="text-sm text-gray-600">{selectedPost.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#9a0e20] rounded-full flex items-center justify-center mr-3">
                        <FiUsers className="text-white text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Posted by</p>
                        <p className="text-sm text-gray-600">{selectedPost.userName} ({selectedPost.userEmail})</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#9a0e20] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">L</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{selectedPost.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#9a0e20] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Posted</p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true, locale: enUS })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        handleDeletePost(selectedPost.id);
                        closePostModal();
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <FiTrash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </button>
                    <button
                      onClick={closePostModal}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeBanModal}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
              </h2>
              <button
                onClick={closeBanModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedUser.nickname || selectedUser.name}
                </h3>
                <p className="text-lg text-gray-800 font-semibold">{selectedUser.email}</p>
              </div>

              {selectedUser.isBanned ? (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-lg font-bold text-red-800 mb-2">
                    This user is currently banned. Click unban to restore their access.
                  </p>
                  {selectedUser.banExpiresAt && (
                    <p className="text-base font-bold text-red-700">
                      Ban expires: {new Date(selectedUser.banExpiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6 mb-6">
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Ban Duration
                    </label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent font-semibold text-gray-900 cursor-pointer"
                    >
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent resize-none text-gray-900"
                      placeholder="Enter reason for ban..."
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closeBanModal}
                  className="flex-1 px-6 py-3 text-lg font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBanUser}
                  className={`flex-1 px-6 py-3 text-lg font-bold text-white rounded-lg transition-colors cursor-pointer ${
                    selectedUser.isBanned 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUserForDetails && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeUserDetailsModal}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">

              <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
              <button
                onClick={closeUserDetailsModal}
                className="p-2 text-2xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Profile Photo Section */}
                <div className="lg:col-span-1">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mb-4">
                      {selectedUserForDetails.profilePhotoUrl ? (
                        <Image
                          src={selectedUserForDetails.profilePhotoUrl}
                          alt={selectedUserForDetails.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-4xl">
                          {selectedUserForDetails.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        {selectedUserForDetails.isVerified && (
                          <BsCheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {selectedUserForDetails.isBanned && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                            Banned
                          </span>
                        )}
                      </div>
                      
                      {selectedUserForDetails.isBanned && selectedUserForDetails.banExpiresAt && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <p className="font-medium">Ban expires:</p>
                          <p>{new Date(selectedUserForDetails.banExpiresAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedUserForDetails.name} {selectedUserForDetails.surname || ''}
                    </h3>
                    <p className="text-lg text-gray-600 mb-1">@{selectedUserForDetails.nickname}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <p><span className="text-gray-600 truncate overflow-hidden whitespace-nowrap" title={selectedUserForDetails.email}>{selectedUserForDetails.email}</span></p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          {selectedUserForDetails.phoneNumber ? (
                            <p className="text-gray-600">{selectedUserForDetails.phoneNumber}</p>
                          ) : (
                            <p className="text-gray-500 italic">Not provided</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Academic Information</h4>
                      <div className="space-y-2 text-sm">
                        {selectedUserForDetails.studentId && (
                          <div>
                            <span className="font-medium text-gray-700">Student ID:</span>
                            <p className="text-gray-600">{selectedUserForDetails.studentId}</p>
                          </div>
                        )}
                        {!selectedUserForDetails.studentId && (
                          <div>
                            <span className="font-medium text-gray-700">Student ID:</span>
                            <p className="text-gray-500 italic">Not provided</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Account Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedUserForDetails.isBanned 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {selectedUserForDetails.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Account Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Joined:</span>
                          <p className="text-gray-600">
                            {formatDistanceToNow(new Date(selectedUserForDetails.createdAt), { 
                              addSuffix: true, 
                              locale: enUS 
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(selectedUserForDetails.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedUserForDetails.lastLogin && (
                          <div>
                            <span className="font-medium text-gray-700">Last Login:</span>
                            <p className="text-gray-600">
                              {formatDistanceToNow(new Date(selectedUserForDetails.lastLogin), { 
                                addSuffix: true, 
                                locale: enUS 
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-lg sm:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-2">Statistics & System Info</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">User ID:</span>
                        <span className="text-gray-600">#{selectedUserForDetails.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Total Posts:</span>
                        <span className="text-gray-600">
                          {posts.filter(post => post.userEmail === selectedUserForDetails.email).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Lost Posts:</span>
                        <span className="text-gray-600">
                          {posts.filter(
                            post =>
                              post.userEmail?.toLowerCase().trim() === selectedUserForDetails.email?.toLowerCase().trim() &&
                              post.type?.toUpperCase().trim() === 'LOST'
                          ).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Found Posts:</span>
                        <span className="text-gray-600">
                          {posts.filter(
                            post =>
                              post.userEmail?.toLowerCase().trim() === selectedUserForDetails.email?.toLowerCase().trim() &&
                              post.type?.toUpperCase().trim() === 'FOUND'
                          ).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        openBanModal(selectedUserForDetails);
                        closeUserDetailsModal();
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedUserForDetails.isBanned
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      {selectedUserForDetails.isBanned ? 'Unban User' : 'Ban User'}
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteUser(selectedUserForDetails.id);
                        closeUserDetailsModal();
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
                    >
                      Delete User
                    </button>
                    <button
                      onClick={closeUserDetailsModal}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`max-w-sm w-full rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="p-4">
              <div className="flex items-start">
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
                  } cursor-pointer`}
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemToDelete?.type === 'user' ? 'User' : 'Post'}`}
        message={`Are you sure you want to delete ${itemToDelete?.type === 'user' ? 'user' : 'post'} "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}
