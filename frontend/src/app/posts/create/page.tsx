'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Image from 'next/image';
import Select from 'react-select';
import customSelectStyles from '@/lib/customSelectStyles';

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
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<{id: number, name: string, nameEn: string}[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Admin kontrolü ekle
    const checkAdminStatus = async () => {
      try {
        // Fresh user bilgisini çek ve ban kontrolü yap
        const profileResponse = await fetch('http://localhost:8080/api/v1/users/profile', {
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

    // Fetch categories and locations
    const fetchData = async () => {
      try {
        const [categoriesRes, locationsRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8080/api/v1/locations', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (categoriesRes.ok && locationsRes.ok) {
          const [categoriesData, locationsData] = await Promise.all([
            categoriesRes.json(),
            locationsRes.json()
          ]);
          setCategories(categoriesData);
          setLocations(locationsData);
        } else {
          throw new Error('Failed to fetch categories or locations');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load form data');
      }
    };

    fetchData();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageBase64((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleImageChange(event);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
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

      const payload: any = {
        title: formData.title,
        type: formData.type.charAt(0).toUpperCase() + formData.type.slice(1).toLowerCase(),
        category: formData.category,
        location: formData.location,
        description: formData.description,
        image: imageBase64
      };

      const response = await fetch('http://localhost:8080/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        router.push('/home');
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth');
      } else if (response.status === 403) {
        throw new Error('You do not have permission for this action');
      } else {
        let errorMessage;
        try {
          const errorData = await response.text();
          errorMessage = errorData || 'An error occurred while creating the post';
        } catch (e) {
          errorMessage = 'An error occurred while creating the post';
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#9a0e20] mb-8 text-center">Create New Post</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Post Type */}
            <div className="flex flex-col items-center mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
              <div className="flex space-x-4 justify-center w-full">
                <label className={`flex items-center justify-center px-8 py-3 rounded-lg cursor-pointer transition-colors text-lg font-semibold ${formData.type === 'LOST' ? 'bg-[#9a0e20] text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                  style={{ minWidth: 120 }}>
                  <input
                    type="radio"
                    value="LOST"
                    checked={formData.type === 'LOST'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="hidden"
                  />
                  <span>Lost</span>
                </label>
                <label className={`flex items-center justify-center px-8 py-3 rounded-lg cursor-pointer transition-colors text-lg font-semibold ${formData.type === 'FOUND' ? 'bg-[#9a0e20] text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                  style={{ minWidth: 120 }}>
                  <input
                    type="radio"
                    value="FOUND"
                    checked={formData.type === 'FOUND'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="hidden"
                  />
                  <span>Found</span>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Title <span className="text-red-600">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Black Apple AirPods"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#9a0e20] outline-none text-gray-900 placeholder-gray-500"
                required
                maxLength={100}
              />
              {formData.title.length === 100 && (
                <div className="text-xs text-red-600 mt-1">Title cannot be longer than 100 characters.</div>
              )}
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Photo</label>
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-upload')?.click()}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer ${isDragActive ? 'border-[#9a0e20] bg-red-50' : ''}`}
                style={{ userSelect: 'none' }}
              >
                <div className="space-y-1 text-center w-full">
                  {imagePreview ? (
                    <div className="relative w-full h-48 mb-4">
                      <img
                        src={imagePreview}
                        alt="Uploaded photo"
                        className="rounded-lg object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setImage(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <label htmlFor="file-upload" className="cursor-pointer w-full block">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-900 justify-center mt-2">
                          <span className="text-[#9a0e20] hover:text-[#7a0b19]">Upload Photo</span>
                          <p className="pl-1 text-gray-900">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-900 mt-1">PNG, JPG, GIF up to 10MB</p>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Write detailed description..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#9a0e20] outline-none text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Category <span className="text-red-600">*</span></label>
              <Select
                options={categories.map(cat => ({ value: cat, label: formatCategoryName(cat) }))}
                value={formData.category ? { value: formData.category, label: formatCategoryName(formData.category) } : null}
                onChange={option => setFormData({ ...formData, category: option ? option.value : '' })}
                placeholder="Select Category..."
                isClearable
                classNamePrefix="react-select"
                styles={customSelectStyles}
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Location <span className="text-red-600">*</span></label>
              <Select
                options={locations.map(loc => ({ value: loc.nameEn, label: loc.nameEn }))}
                value={formData.location ? { value: formData.location, label: formData.location } : null}
                onChange={option => setFormData({ ...formData, location: option ? option.value : '' })}
                placeholder="Select Location..."
                isClearable
                classNamePrefix="react-select"
                styles={customSelectStyles}
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-white bg-[#9a0e20] rounded-lg hover:bg-[#7a0b19] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 