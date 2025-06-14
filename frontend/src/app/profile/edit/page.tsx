'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function EditProfile() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    profileImage: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Mevcut profil bilgilerini yükle
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        const response = await fetch('http://localhost:8080/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Profil bilgileri alınamadı');
        }

        const data = await response.json();
        setFormData({
          name: data.name || '',
          department: data.department || '',
          profileImage: data.profileImage || ''
        });
      } catch (error) {
        console.error('Profil bilgileri yüklenemedi:', error);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth');
            return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Profil güncellenirken bir hata oluştu');
        }

        const updatedUser = await response.json();
        setUser(updatedUser);
        router.push('/profile');
        toast.success('Profil başarıyla güncellendi');
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        toast.error(error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Profili Düzenle</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profil Fotoğrafı */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32">
              <Image
                src={formData.profileImage || '/default-avatar.png'}
                alt="Profil fotoğrafı"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="w-full max-w-xs"
            />
          </div>

          {/* İsim */}
          <div>
            <label className="block text-sm font-medium text-gray-700">İsim</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9a0e20] focus:ring-[#9a0e20]"
            />
          </div>

          {/* Bölüm */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Bölüm</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9a0e20] focus:ring-[#9a0e20]"
            />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#9a0e20] rounded-md hover:bg-[#7a0b19] disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
