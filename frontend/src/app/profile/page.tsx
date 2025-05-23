"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import { FaCamera } from "react-icons/fa"

const DEPARTMENTS = [
  "Bilgisayar Mühendisliği",
  "Biyomühendislik",
  "Çevre Mühendisliği",
  "Elektronik ve Haberleşme Mühendisliği",
  "Endüstriyel Tasarım",
  "Enerji Sistemleri Mühendisliği",
  "Fizik",
  "Fotonik",
  "Gıda Mühendisliği",
  "İnşaat Mühendisliği",
  "Kimya",
  "Kimya Mühendisliği",
  "Makina Mühendisliği",
  "Malzeme Bilimi ve Mühendisliği",
  "Matematik",
  "Mimarlık",
  "Moleküler Biyoloji ve Genetik",
  "Şehir ve Bölge Planlama",
].sort()

interface UserProfile {
  id: number
  name: string
  email: string
  department: string
  profilePhotoUrl: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  const fetchProfile = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth")
      return
    }

    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editedProfile) return

    try {
      const response = await fetch("http://localhost:8080/api/v1/users/profile", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: editedProfile.name,
          department: editedProfile.department
        }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditedProfile(updatedProfile)
        setIsEditing(false)
      } else {
        throw new Error("Profil güncellenirken bir hata oluştu")
      }
    } catch (error) {
      console.error("Profil güncellenirken hata:", error)
      setError("Profil güncellenirken bir hata oluştu")
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm bg-white/90">
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-[#9a0e20] to-[#c41230] relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full px-8 transform translate-y-1/2">
              <div className="flex items-end justify-between">
                <div className="flex items-end">
                  <div className="relative w-36 h-36 rounded-full border-4 border-white bg-white overflow-hidden shadow-2xl">
                    <Image
                      src="/assets/default_avatar.png"
                      alt="Profil Fotoğrafı"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                </div>
                <button
                  onClick={isEditing ? handleSubmit : () => setIsEditing(true)}
                  className="mb-4 px-6 py-2.5 bg-white text-[#9a0e20] rounded-xl font-medium shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl"
                >
                  {isEditing ? "Kaydet" : "Düzenle"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-28 p-8 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Kişisel Bilgiler</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">İsim</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile?.name || ""}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile!, name: e.target.value })
                      }
                      className="mt-1 w-full p-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] bg-white text-gray-800 font-medium"
                      placeholder="İsminiz"
                    />
                  ) : (
                    <p className="mt-1 text-lg text-gray-800 font-medium">
                      {profile?.name || "İsimsiz Kullanıcı"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">E-posta</label>
                  <p className="mt-1 text-lg text-gray-800 font-medium">
                    {profile?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Bölüm Bilgisi</h3>
              {isEditing ? (
                <select
                  value={editedProfile?.department || ""}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile!, department: e.target.value })
                  }
                  className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a0e20] bg-white text-gray-700"
                >
                  <option value="">Bölüm Seçiniz</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg text-gray-800 font-medium">
                  {profile?.department || "Henüz bir bölüm seçilmemiş."}
                </p>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProfile(profile)
                  }}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  İptal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
