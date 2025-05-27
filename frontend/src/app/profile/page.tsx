"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import { FaCamera, FaMapMarkerAlt, FaCalendarAlt, FaPhone, FaEnvelope, FaEdit, FaCheck, FaTimes } from "react-icons/fa"



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
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("posts")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const fetchProfile = async () => {
    // Backend olmadığı için mock data kullanıyoruz
    try {
      // Simüle edilmiş profil verisi
      const mockProfile: UserProfile = {
        id: 1,
        name: "İsimsiz Kullanıcı",
        email: "user@std.iyte.edu.tr",
        department: "Bilgisayar Mühendisliği",
        profilePhotoUrl: "/assets/default_avatar.png",
        phoneNumber: "",
        createdAt: "2023-09-01T00:00:00Z",
        studentId: "290201027",
        bio: ""
      }

      // 500ms bekle (API çağrısını simüle et)
      await new Promise(resolve => setTimeout(resolve, 500))

      setProfile(mockProfile)
      setEditedProfile(mockProfile)

      // Backend entegrasyonu için hazır kod (şimdilik yorum satırında):
      /*
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const response = await fetch("http://localhost:8080/api/v1/users/profile", {
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
      }
      */

    } catch (error) {
      console.error("Profil yüklenirken hata:", error)
      setError("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [router])

  const handleFieldSave = async (field: string) => {
    if (!editedProfile) return

    setIsSaving(true)
    setError("")

    // Backend olmadığı için simüle ediyoruz
    try {
      console.log(`Simulating ${field} update:`, editedProfile[field as keyof UserProfile])

      // 500ms bekle (API çağrısını simüle et)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Local state'i güncelle (backend olmadığı için)
      setProfile(editedProfile)
      setEditingField(null)
      
      console.log(`${field} updated successfully (simulated)`)

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
      // Dosyayı base64'e çevir (preview için)
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string
        
        console.log("Simulating profile photo update:", file.name)
        
        // 1 saniye bekle (API çağrısını simüle et)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Local state'i güncelle (backend olmadığı için)
        const updatedProfile = { ...profile!, profilePhotoUrl: imageDataUrl }
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
        
        console.log("Profile photo updated successfully (simulated)")
      }
      reader.readAsDataURL(file)

      // Backend entegrasyonu için hazır kod (şimdilik yorum satırında):
      /*
      const formData = new FormData()
      formData.append('profilePhoto', file)

      const response = await fetch("http://localhost:8080/api/v1/users/profile/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
      } else {
        throw new Error(`Photo upload failed: ${response.status}`)
      }
      */

    } catch (error) {
      console.error("Profile photo update error:", error)
      setError(error instanceof Error ? error.message : "Failed to update profile photo")
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
                {profile?.name || "İsimsiz Kullanıcı"}
              </h1>
            </div>
          </div>

          {/* Profile Content */}
          <div className="bg-white rounded-b-lg shadow-lg relative">
            <div className="px-8 pt-16 pb-8">
              {/* Profile Photo */}
              <div className="absolute -top-16 left-8">
                <div className="relative w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                  <Image
                    src={profile?.profilePhotoUrl || "/assets/default_avatar.png"}
                    alt="Profil Fotoğrafı"
                    fill
                    className="object-cover rounded-full"
                  />
                  {/* Edit Button - Only show in Settings tab */}
                  {activeTab === "settings" && (
                    <button
                      onClick={handleProfilePhotoClick}
                      disabled={isSaving}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-[#9a0e20] hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change profile photo"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#9a0e20] rounded-full animate-spin"></div>
                      ) : (
                        <FaEdit className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="ml-40">

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="w-4 h-4 mr-3" />
                    <span>İzmir, Turkey</span>
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
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  My Posts
                </button>
                <button 
                  onClick={() => setActiveTab("settings")}
                  className={`py-4 px-1 border-b-2 font-medium ${
                    activeTab === "settings" 
                      ? "border-[#9a0e20] text-[#9a0e20]" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
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
                      {editingField === "name" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editedProfile?.name || ""}
                            onChange={(e) =>
                              setEditedProfile({ ...editedProfile!, name: e.target.value })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900"
                            placeholder="Enter your nickname"
                            autoFocus
                          />
                          <button
                            onClick={() => handleFieldSave("name")}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleFieldCancel}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            {profile?.name || "No nickname set"}
                          </p>
                          <button
                            onClick={() => setEditingField("name")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9a0e20] transition-colors"
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
                      <p className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                        {profile?.studentId || "Not provided"}
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone
                      </label>
                      {editingField === "phoneNumber" ? (
                        <div className="space-y-2">
                          <div className="flex">
                            <select className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#9a0e20] focus:border-transparent bg-white text-gray-900 border-r-0">
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
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleFieldSave("phoneNumber")}
                              disabled={isSaving}
                              className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleFieldCancel}
                              className="p-2 text-red-600 hover:text-red-700"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                            {profile?.phoneNumber ? `+90 ${profile.phoneNumber}` : "Not provided"}
                          </p>
                          <button
                            onClick={() => setEditingField("phoneNumber")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#9a0e20] transition-colors"
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
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleFieldCancel}
                            className="p-2 text-red-600 hover:text-red-700"
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
                          className="absolute right-3 top-3 text-gray-400 hover:text-[#9a0e20] transition-colors"
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
                    {/* New Message Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">New Message Notifications</h4>
                        <p className="text-sm text-gray-500">Get notified when you receive a new message</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9a0e20]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9a0e20]"></div>
                      </label>
                    </div>

                    {/* Post Responses */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Post Responses</h4>
                        <p className="text-sm text-gray-500">Get notified when someone responds to your posts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9a0e20]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9a0e20]"></div>
                      </label>
                    </div>

                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive emails for important updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9a0e20]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9a0e20]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
