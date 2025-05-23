'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

const CATEGORIES = [
  'Elektronik',
  'Kırtasiye',
  'Giyim',
  'Aksesuar',
  'Kitap',
  'Diğer'
].sort();

const LOCATIONS = [
  'Kütüphane',
  'Yemekhane',
  'A1',
  'A2',
  'A3',
  'A4',
  'B',
  'C',
  'D',
  'E',
  'F',
  'Merkezi Derslik',
  'Spor Salonu',
  'Diğer'
].sort();

export default function CreatePost() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LOST',
    category: '',
    location: ''
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      if (image) {
        formDataToSend.append('image', image);
      }

      console.log('Sending request with form data:', Object.fromEntries(formDataToSend.entries()));

      const response = await fetch('http://localhost:8080/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        router.push('/home');
      } else if (response.status === 401) {
        console.log('Unauthorized - removing token and redirecting to auth');
        localStorage.removeItem('token');
        router.push('/auth');
      } else if (response.status === 403) {
        console.log('Forbidden - user does not have permission');
        throw new Error('Bu işlem için yetkiniz bulunmuyor');
      } else {
        let errorMessage;
        try {
          const errorData = await response.text();
          console.log('Error response:', errorData);
          errorMessage = errorData || 'İlan oluşturulurken bir hata oluştu';
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = 'İlan oluşturulurken bir hata oluştu';
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#9a0e20] mb-8">Yeni İlan Oluştur</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* İlan Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">İlan Tipi</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="LOST"
                    checked={formData.type === 'LOST'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-4 w-4 text-[#9a0e20] focus:ring-[#9a0e20]"
                  />
                  <span className="ml-2 text-gray-900">Kayıp</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="FOUND"
                    checked={formData.type === 'FOUND'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-4 w-4 text-[#9a0e20] focus:ring-[#9a0e20]"
                  />
                  <span className="ml-2 text-gray-900">Bulundu</span>
                </label>
              </div>
            </div>

            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Başlık</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Siyah Apple AirPods"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Fotoğraf Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Fotoğraf</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative w-full h-48 mb-4">
                      <img
                        src={imagePreview}
                        alt="Yüklenen fotoğraf"
                        className="rounded-lg object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-900">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#9a0e20] hover:text-[#7a0b19] focus-within:outline-none">
                          <span>Fotoğraf Yükle</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1 text-gray-900">veya sürükleyip bırakın</p>
                      </div>
                      <p className="text-xs text-gray-900">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaylı açıklama yazın..."
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900"
                required
              >
                <option value="" className="text-gray-500">Kategori Seçin</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-gray-900">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Konum */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Konum</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900"
                required
              >
                <option value="" className="text-gray-500">Konum Seçin</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location} className="text-gray-900">
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-white bg-[#9a0e20] rounded-lg hover:bg-[#7a0b19] transition-colors disabled:opacity-50"
              >
                {loading ? 'Oluşturuluyor...' : 'İlan Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 