'use client';

import { useEffect, useState } from 'react';
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
  FiFilter
} from 'react-icons/fi';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';
import Image from 'next/image';

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
  reporterName: string;
  reportedUserName: string;
  reportedUserId: number;
  reason: string;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  postId?: number;
  postTitle?: string;
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
  const router = useRouter();

  // Show notification function
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000); // Auto hide after 5 seconds
  };

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
    // fetchReports(); // TODO: Implement when report system is ready
    
    // Mock reports data until backend implementation
    const mockReports: Report[] = [
      {
        id: 1,
        reporterName: 'Ahmet Yılmaz',
        reportedUserName: 'Mehmet Kaya',
        reportedUserId: 3,
        reason: 'Inappropriate Content',
        description: 'User posted inappropriate content in their lost item description',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        postId: 3,
        postTitle: 'Lost Student ID'
      },
      {
        id: 2,
        reporterName: 'Elif Demir',
        reportedUserName: 'Mehmet Kaya',
        reportedUserId: 3,
        reason: 'Spam',
        description: 'User is posting too many fake lost items',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'REVIEWED'
      },
      {
        id: 3,
        reporterName: 'Anonymous',
        reportedUserName: 'Test User',
        reportedUserId: 4,
        reason: 'Harassment',
        description: 'User is sending inappropriate messages',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'RESOLVED'
      }
    ];
    setReports(mockReports);
    
    setLoading(false);
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/v1/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
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
      const response = await fetch('http://localhost:8080/api/v1/admin/posts', {
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

  const handleBanUser = async (userId: number, duration?: string, reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Calculate ban expiry time based on duration
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
        // Format for Java LocalDateTime (no 'Z' at the end, use 'T' format)
        requestBody.banExpiresAt = banExpiresAt.toISOString().slice(0, -1); // Remove 'Z'
      }
      if (reason) {
        requestBody.banReason = reason;
      }

      const response = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}/ban`, {
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

  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setBanDuration('1h');
    setBanReason('');
    setShowBanModal(true);
  };

  const closeBanModal = () => {
    setShowBanModal(false);
    setSelectedUser(null);
    setBanDuration('1h');
    setBanReason('');
  };

  const confirmBanUser = async () => {
    if (!selectedUser) return;
    
    if (selectedUser.isBanned) {
      // Unban user
      await handleBanUser(selectedUser.id);
    } else {
      // Ban user with duration and reason
      await handleBanUser(selectedUser.id, banDuration, banReason);
    }
    
    closeBanModal();
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete ${user.nickname || user.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Update local state
        setUsers(prev => prev.filter(user => user.id !== userId));
        showNotification('success', `${user.nickname || user.name} has been deleted successfully`);
      } else {
        showNotification('error', 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', 'An error occurred while deleting user');
    }
  };

  const handleDeletePost = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!confirm(`Are you sure you want to delete the post "${post.title}"?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/v1/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Update local state
        setPosts(prev => prev.filter(post => post.id !== postId));
        showNotification('success', `Post "${post.title}" has been deleted successfully`);
      } else {
        showNotification('error', 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showNotification('error', 'An error occurred while deleting post');
    }
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const handleReportAction = (reportId: number, action: 'approve' | 'reject') => {
    // TODO: Implement when report system is ready
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'approve' ? 'RESOLVED' : 'REVIEWED' }
        : report
    ));
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
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'reported') return matchesSearch && post.reportCount > 0;
    if (filterStatus === 'lost') return matchesSearch && post.type === 'LOST';
    if (filterStatus === 'found') return matchesSearch && post.type === 'FOUND';
    return matchesSearch;
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.reporterName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (report.reportedUserName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (report.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && (report.status || '').toLowerCase() === filterStatus.toLowerCase();
  });

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
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
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
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
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
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
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
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent"
                  >
                    {activeTab === 'users' && (
                      <>
                        <option value="all">All Users</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                      </>
                    )}
                    {activeTab === 'posts' && (
                      <>
                        <option value="all">All Posts</option>
                        <option value="lost">Lost Items</option>
                        <option value="found">Found Items</option>
                        <option value="reported">Reported</option>
                      </>
                    )}
                    {activeTab === 'reports' && (
                      <>
                        <option value="all">All Reports</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
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
                          <p className="text-sm text-gray-500">{user.department}</p>
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
                          onClick={() => openBanModal(user)}
                          className={`p-2 rounded-lg transition-colors ${
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
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title="View Post"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
                  {filteredReports.map((report) => (
                    <div key={report.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{report.reason}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : report.status === 'REVIEWED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Reporter: {report.reporterName}</span>
                            <span>•</span>
                            <span>Reported: {report.reportedUserName}</span>
                            {report.postTitle && (
                              <>
                                <span>•</span>
                                <span>Post: {report.postTitle}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: enUS })}</span>
                          </div>
                        </div>
                        {report.status === 'PENDING' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleReportAction(report.id, 'approve')}
                              className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              title="Approve Report"
                            >
                              <BsCheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'reject')}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              title="Reject Report"
                            >
                              <BsXCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                        <FiFileText className="w-16 h-16 text-gray-400" />
                        <span className="text-gray-500 text-sm ml-2">No image available</span>
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
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <FiTrash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </button>
                    <button
                      onClick={closePostModal}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
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
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {selectedUser.nickname || selectedUser.name}
                </h3>
                <p className="text-base text-gray-600 font-medium">{selectedUser.email}</p>
              </div>

              {selectedUser.isBanned ? (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-base font-medium text-red-800 mb-2">
                    This user is currently banned. Click unban to restore their access.
                  </p>
                  {selectedUser.banExpiresAt && (
                    <p className="text-sm font-bold text-red-700">
                      Ban expires: {new Date(selectedUser.banExpiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6 mb-6">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-3">
                      Ban Duration
                    </label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent font-medium"
                    >
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-3">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent resize-none"
                      placeholder="Enter reason for ban..."
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closeBanModal}
                  className="flex-1 px-6 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBanUser}
                  className={`flex-1 px-6 py-3 text-base font-semibold text-white rounded-lg transition-colors ${
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
                  }`}
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
