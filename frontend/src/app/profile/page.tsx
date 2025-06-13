"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/ui/Navbar"
import { messageApi } from "@/lib/messageApi"
import { FaCamera, FaMapMarkerAlt, FaCalendarAlt, FaPhone, FaEnvelope, FaEdit, FaCheck, FaTimes, FaTrash, FaEye, FaIdCard } from "react-icons/fa"



interface UserProfile {
  id: number
  name: string
  email: string
  department: string
  profilePhotoUrl: string
  phoneNumber?: string
  createdAt: string
  studentId?: string
  bio?: string
  nickname?: string
  emailNotifications?: boolean
  postNotifications?: boolean
}

interface BlockedUser {
  id: number
  nickname: string
  name: string
  profilePhotoUrl?: string
}

interface UserPost {
  id: number
  title: string
  description: string
  type: string
  category: string
  location: string
  createdAt: string
  imageBase64?: string
  imageContentType?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("posts")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<UserPost | null>(null)
  const [updatingNotifications, setUpdatingNotifications] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false)
  const [unblockingUserId, setUnblockingUserId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Admin kontrolü ekle
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        // Profil bilgisini çek ve ban kontrolü yap
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          
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
              return;
            }
          }
        } else if (profileResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth');
          return;
        }

        // Admin kontrolü yap
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users`, {
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

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditedProfile(data)
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }

    } catch (error) {
      console.error("Profil yüklenirken hata:", error)
      setError("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    if (!profile?.id) return

    setPostsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/items/user/id/${profile.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const posts = await response.json()
        // Transform the posts to match our interface
        const transformedPosts: UserPost[] = posts.map((post: any) => ({
          id: post.item_id,
          title: post.title,
          description: post.description,
          type: post.type,
          category: post.category,
          location: post.location?.nameEn || "Unknown Location",
          createdAt: post.dateShared,
          imageBase64: post.image,
        }))
        setUserPosts(transformedPosts)
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        setUserPosts([])
      }
    } catch (error) {
      console.error("Postlar yüklenirken hata:", error)
      setUserPosts([])
    } finally {
      setPostsLoading(false)
    }
  }

  const deletePost = async (postId: number) => {
    if (!profile?.id) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/items/${postId}/user/${profile.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove the post from the state
        setUserPosts(userPosts.filter(post => post.id !== postId))
        console.log("Post deleted successfully")
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        console.error("Failed to delete post:", response.status)
        setError("Post silinemedi")
      }
    } catch (error) {
      console.error("Post silinirken hata:", error)
      setError("Post silinirken bir hata oluştu")
    }
  }

  const showDeleteConfirmation = (post: UserPost) => {
    setPostToDelete(post)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return

    await deletePost(postToDelete.id)
    setShowDeleteConfirm(false)
    setPostToDelete(null)
    // Close the main modal if it's open
    if (showModal) {
      closeModal()
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setPostToDelete(null)
  }

  const openPostModal = (post: UserPost) => {
    setSelectedPost(post)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPost(null)
  }

  useEffect(() => {
    fetchProfile()
  }, [router])

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    setLoadingBlockedUsers(true)
    try {
      const blockedUsersData = await messageApi.getBlockedUsers()
      setBlockedUsers(blockedUsersData)
    } catch (error) {
      console.error("Error fetching blocked users:", error)
    } finally {
      setLoadingBlockedUsers(false)
    }
  }

  // Handle unblocking a user
  const handleUnblockUser = async (userId: number, userNickname: string) => {
    setUnblockingUserId(userId)
    try {
      await messageApi.unblockUser(userId)
      // Remove user from blocked users list
      setBlockedUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      // Show success message (you can add a toast notification here)
      console.log(`Successfully unblocked ${userNickname}`)
    } catch (error) {
      console.error("Error unblocking user:", error)
      // Show error message (you can add a toast notification here)
    } finally {
      setUnblockingUserId(null)
    }
  }

  useEffect(() => {
    if (profile?.id && activeTab === "posts") {
      fetchUserPosts()
    } else if (activeTab === "settings") {
      fetchBlockedUsers()
    }
  }, [profile?.id, activeTab])

  const handleFieldSave = async (field: string) => {
    if (!editedProfile) return

    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const updateData: any = {}
      if (field === "nickname") {
        updateData.nickname = editedProfile.nickname
      } else if (field === "phoneNumber") {
        updateData.phoneNumber = editedProfile.phoneNumber
      } else if (field === "bio") {
        updateData.bio = editedProfile.bio
      } else if (field === "studentId") {
        updateData.studentId = editedProfile.studentId
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
        setEditingField(null)
        console.log(`${field} updated successfully`)
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        throw new Error(`Failed to update ${field}: ${response.status}`)
      }

    } catch (error) {
      console.error("Profil güncellenirken hata:", error)
      setError(error instanceof Error ? error.message : "Profil güncellenirken bir hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldCancel = () => {
    setEditedProfile(profile)
    setEditingField(null)
  }

  const handleEmailNotificationToggle = async () => {
    if (!profile) return

    setUpdatingNotifications(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const newValue = !profile.emailNotifications
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile/email-notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emailNotifications: newValue }),
      })

      if (response.ok) {
        const updatedProfile = { ...profile, emailNotifications: newValue }
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
        console.log("Email notifications updated successfully")
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        throw new Error(`Failed to update email notifications: ${response.status}`)
      }

    } catch (error) {
      console.error("Email notification ayarı güncellenirken hata:", error)
      setError(error instanceof Error ? error.message : "Email notification ayarı güncellenirken bir hata oluştu")
    } finally {
      setUpdatingNotifications(false)
    }
  }

  const handlePostNotificationToggle = async () => {
    if (!profile) return

    setUpdatingNotifications(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const newValue = !profile.postNotifications
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile/post-notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postNotifications: newValue }),
      })

      if (response.ok) {
        const updatedProfile = { ...profile, postNotifications: newValue }
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
        console.log("Post notifications updated successfully")
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        throw new Error(`Failed to update post notifications: ${response.status}`)
      }

    } catch (error) {
      console.error("Post notification ayarı güncellenirken hata:", error)
      setError(error instanceof Error ? error.message : "Post notification ayarı güncellenirken bir hata oluştu")
    } finally {
      setUpdatingNotifications(false)
    }
  }

  const handleProfilePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya boyutu kontrolü (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found. Please login again.")
        router.push("/auth")
        return
      }

      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

      const formData = new FormData()
      formData.append('profilePhoto', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
        console.log("Profile photo updated successfully")
      } else if (response.status === 401) {
        setError("Authentication failed. Please login again.")
        localStorage.removeItem("token")
        router.push("/auth")
      } else {
        const errorText = await response.text()
        console.error("Upload failed:", response.status, errorText)
        setError(`Photo upload failed: ${response.status} - ${errorText || 'Unknown error'}`)
      }

    } catch (error) {
      console.error("Profile photo update error:", error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:8080")
      } else {
        setError(error instanceof Error ? error.message : "Failed to update profile photo")
      }
    } finally {
      setIsSaving(false)
      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="flex justify-center items-center h-[80vh]">
          <div className="text-xl text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#9a0e20] to-[#c41230] rounded-t-lg h-48 relative">
            {/* User Name in Header */}
            <div className="absolute bottom-1 left-44">
              <h1 className="text-3xl font-bold text-white">
                {profile?.nickname || profile?.name || "İsimsiz Kullanıcı"}
              </h1>
            </div>
          </div>

          {/* Profile Content */}
          <div className="bg-white rounded-b-lg shadow-lg relative">
            <div className="px-8 pt-8 pb-8">
              {/* Profile Photo */}
              <div className="absolute -top-16 left-8">
                <div className="relative w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                  <Image
                    src={profile?.profilePhotoUrl || "/assets/default_avatar.png"}
                    alt="Profil Fotoğrafı"
                    fill
                    className="object-cover rounded-full"
                  />
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                </div>
                
                {/* Edit Button - Outside the photo, positioned at top-right */}
                {activeTab === "settings" && (
                  <button
                    onClick={handleProfilePhotoClick}
                    disabled={isSaving}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-[#9a0e20] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#7a0b19] hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white cursor-pointer"
                    title="Change profile photo"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg 
                        className="w-5 h-5" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="ml-40">

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt">
                  <div className="flex items-center text-gray-600">
                    <FaIdCard className="w-4 h-4 mr-3" />
                    <span>{profile?.studentId || "Student ID not provided"}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <FaCalendarAlt className="w-4 h-4 mr-3" />
                    <span>
                      Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Unknown"}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="w-4 h-4 mr-3" />
                    <span>{profile?.phoneNumber ? `+90 ${profile.phoneNumber}` : "Phone number not provided"}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <FaEnvelope className="w-4 h-4 mr-3" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
              </div>


            </div>

            {/* Navigation Tabs */}
            <div className="border-t border-gray-200">
              <nav className="flex space-x-8 px-8">
                <button 
                  onClick={() => setActiveTab("posts")}
                  className={`py-4 px-1 border-b-2 font-medium ${
                    activeTab === "posts" 
                      ? "border-[#9a0e20] text-[#9a0e20]" 
                      : "border-transparent text-gray-500 hover:text-gray-700 cursor-pointer"
                  }`}
                >
                  My Posts
                </button>
                <button 
                  onClick={() => setActiveTab("settings")}
                  className={`py-4 px-1 border-b-2 font-medium ${
                    activeTab === "settings" 
                      ? "border-[#9a0e20] text-[#9a0e20]" 
                      : "border-transparent text-gray-500 hover:text-gray-700 cursor-pointer"
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "posts" && (
              <div className="p-8 border-t border-gray-200">
                <div className="mb-8 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">My Posts</h2>
                    <p className="text-gray-600 mt-1">View and manage your posts</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {userPosts.length} post{userPosts.length !== 1 ? 's' : ''} total
                  </div>
                </div>

                {postsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-[#9a0e20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your posts...</p>
                    </div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaCamera className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-600 mb-6">You haven't shared any posts yet. Start sharing to help others find their lost items!</p>
                    <button
                      onClick={() => router.push('/posts/create')}
                      className="bg-[#9a0e20] text-white px-6 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors cursor-pointer"
                    >
                      Share Your First Post
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPosts.map((post) => (
                      <div key={post.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        {/* Post Image */}
                        <div className="relative h-48 rounded-t-lg overflow-hidden bg-gray-100">
                          {post.imageBase64 ? (
                            <>
                              <img
                                src={post.imageBase64.startsWith('data:') ? post.imageBase64 : `data:image/jpeg;base64,${post.imageBase64}`}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, hide it
                                  e.currentTarget.style.display = 'none';
                                  // Show the fallback placeholder
                                  const parent = e.currentTarget.parentElement;
                                  const fallback = parent?.querySelector('.fallback-placeholder') as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              {/* Fallback placeholder (hidden by default) */}
                              <div className="fallback-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100" style={{ display: 'none' }}>
                                <FaCamera className="w-12 h-12 text-gray-400" />
                              </div>
                            </>
                          ) : (
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
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* Post Type Badge */}
                          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                            post.type === 'Lost' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {post.type}
                          </div>
                        </div>
                        
                        {/* Post Content */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                              {post.title}
                            </h3>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => openPostModal(post)}
                                className="p-1.5 text-gray-400 hover:text-[#9a0e20] transition-colors cursor-pointer"
                                title="View post"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => showDeleteConfirmation(post)}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete post"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {post.description}
                          </p>
                          
                          {/* Post Meta Info */}
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="font-medium mr-2">Category:</span>
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {post.category}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <FaMapMarkerAlt className="w-3 h-3 mr-1" />
                              <span>{post.location}</span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <FaCalendarAlt className="w-3 h-3 mr-1" />
                              <span>
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="p-8 border-t border-gray-200">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Profile Settings</h2>
                  <p className="text-gray-600 mt-1">Update your personal information</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nickname */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Nickname
                      </label>
                      {editingField === "nickname" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editedProfile?.nickname || ""}
                            onChange={(e) =>
                              setEditedProfile({ ...editedProfile!, nickname: e.target.value })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900"
                            placeholder="Enter your nickname"
                            autoFocus
                          />
                          <button
                            onClick={() => handleFieldSave("nickname")}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleFieldCancel}
                            className="p-2 text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            {profile?.nickname || "No nickname set"}
                          </p>
                          <button
                            onClick={() => setEditingField("nickname")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9a0e20] transition-colors cursor-pointer"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email
                      </label>
                      <p className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                        {profile?.email}
                      </p>
                    </div>

                    {/* Student ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Student ID
                      </label>
                      {editingField === "studentId" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editedProfile?.studentId || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                              setEditedProfile({ ...editedProfile!, studentId: value })
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900"
                            placeholder="Enter your student ID"
                            maxLength={11}
                            autoFocus
                          />
                          <button
                            onClick={() => handleFieldSave("studentId")}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleFieldCancel}
                            className="p-2 text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            {profile?.studentId || "Not provided"}
                          </p>
                          <button
                            onClick={() => setEditingField("studentId")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9a0e20] transition-colors cursor-pointer"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone
                      </label>
                      {editingField === "phoneNumber" ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-1">
                            <select className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900 border-r-0 cursor-pointer">
                              <option value="+90">🇹🇷 +90</option>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+44">🇬🇧 +44</option>
                              <option value="+49">🇩🇪 +49</option>
                              <option value="+33">🇫🇷 +33</option>
                              <option value="+39">🇮🇹 +39</option>
                              <option value="+34">🇪🇸 +34</option>
                              <option value="+31">🇳🇱 +31</option>
                              <option value="+46">🇸🇪 +46</option>
                              <option value="+47">🇳🇴 +47</option>
                              <option value="+45">🇩🇰 +45</option>
                              <option value="+41">🇨🇭 +41</option>
                              <option value="+43">🇦🇹 +43</option>
                              <option value="+32">🇧🇪 +32</option>
                              <option value="+351">🇵🇹 +351</option>
                              <option value="+30">🇬🇷 +30</option>
                            </select>
                            <input
                              type="tel"
                              value={editedProfile?.phoneNumber || ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                                setEditedProfile({ ...editedProfile!, phoneNumber: value })
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900"
                              placeholder="5XX XXX XX XX"
                              maxLength={11}
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => handleFieldSave("phoneNumber")}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleFieldCancel}
                            className="p-2 text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            {profile?.phoneNumber ? `+90 ${profile.phoneNumber}` : "Not provided"}
                          </p>
                          <button
                            onClick={() => setEditingField("phoneNumber")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9a0e20] transition-colors cursor-pointer"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About Me */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      About Me
                    </label>
                    {editingField === "bio" ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedProfile?.bio || ""}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile!, bio: e.target.value })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900 resize-none"
                          placeholder="Tell us about yourself..."
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleFieldSave("bio")}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleFieldCancel}
                            className="p-2 text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-900 min-h-[100px]">
                          {profile?.bio || "No bio provided"}
                        </p>
                        <button
                          onClick={() => setEditingField("bio")}
                          className="absolute right-3 top-3 text-gray-400 hover:text-[#9a0e20] transition-colors cursor-pointer"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Notification Settings</h3>
                    <p className="text-gray-600 mt-1">Manage your notification preferences</p>
                  </div>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive emails for ban notifications and account updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={profile?.emailNotifications ?? true}
                          onChange={handleEmailNotificationToggle}
                          disabled={updatingNotifications}
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9a0e20]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9a0e20] ${updatingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        {updatingNotifications && (
                          <div className="ml-2 w-4 h-4 border-2 border-[#9a0e20] border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </label>
                    </div>

                    {/* Post Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Post Message Notifications</h4>
                        <p className="text-sm text-gray-500">Receive emails when someone sends a message about your posts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={profile?.postNotifications ?? true}
                          onChange={handlePostNotificationToggle}
                          disabled={updatingNotifications}
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9a0e20]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9a0e20] ${updatingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        {updatingNotifications && (
                          <div className="ml-2 w-4 h-4 border-2 border-[#9a0e20] border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Blocked Users Section */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Blocked Users</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage users you have blocked from messaging you</p>
                    </div>

                    {loadingBlockedUsers ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="w-6 h-6 border-2 border-[#9a0e20] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-gray-600">Loading blocked users...</span>
                      </div>
                    ) : blockedUsers.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <FaTimes className="w-6 h-6 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No blocked users</h4>
                        <p className="text-gray-600">You haven't blocked anyone yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {blockedUsers.map((blockedUser) => (
                          <div key={blockedUser.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                <Image
                                  src={blockedUser.profilePhotoUrl || "/assets/default_avatar.png"}
                                  alt={blockedUser.nickname}
                                  width={40}
                                  height={40}
                                  className="object-cover rounded-full"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{blockedUser.nickname}</h4>
                                <p className="text-sm text-gray-600">{blockedUser.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblockUser(blockedUser.id, blockedUser.nickname)}
                              disabled={unblockingUserId === blockedUser.id}
                              className="px-4 py-2 bg-[#9a0e20] text-white rounded-lg hover:bg-[#7a0b19] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {unblockingUserId === blockedUser.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Unblocking...</span>
                                </>
                              ) : (
                                <>
                                  <FaCheck className="w-4 h-4" />
                                  <span>Unblock</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      {showModal && selectedPost && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Post Details</h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Image */}
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
                      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={
                            selectedPost.category === 'Electronics' ? '/assets/electronic.jpeg' :
                            selectedPost.category === 'Clothing' ? '/assets/clothes.jpeg' :
                            selectedPost.category === 'Cards' ? '/assets/wallet.jpeg' :
                            selectedPost.category === 'Other' ? '/assets/others.jpeg' :
                            selectedPost.category === 'Accessories' ? '/assets/accessories.jpeg' :
                            '/assets/others.jpeg'
                          }
                          alt="Default category image"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedPost.title}
                    </h3>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPost.type === 'Lost' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedPost.type}
                    </div>
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
                        <FaMapMarkerAlt className="text-white text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{selectedPost.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#9a0e20] rounded-full flex items-center justify-center mr-3">
                        <FaCalendarAlt className="text-white text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Posted</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedPost.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => showDeleteConfirmation(selectedPost)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <FaTrash className="w-4 h-4 mr-2" />
                      Delete Post
                    </button>
                    <button
                      onClick={closeModal}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && postToDelete && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleDeleteCancel}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Postu Sil</h2>
              <button
                onClick={handleDeleteCancel}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">"{postToDelete.title}"</h3>
                <p className="text-gray-600">Bu postu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
