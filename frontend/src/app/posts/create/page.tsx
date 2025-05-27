'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

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
          <h1 className="text-3xl font-bold text-[#9a0e20] mb-8">Create New Post</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Post Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="LOST"
                    checked={formData.type === 'LOST'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-4 w-4 text-[#9a0e20] focus:ring-[#9a0e20]"
                  />
                  <span className="ml-2 text-gray-900">Lost</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="FOUND"
                    checked={formData.type === 'FOUND'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-4 w-4 text-[#9a0e20] focus:ring-[#9a0e20]"
                  />
                  <span className="ml-2 text-gray-900">Found</span>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Black Apple AirPods"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900 placeholder-gray-500"
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
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg ${isDragActive ? 'border-[#9a0e20] bg-red-50' : ''}`}
              >
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative w-full h-48 mb-4">
                      <img
                        src={imagePreview}
                        alt="Uploaded photo"
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
                          <span>Upload Photo</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1 text-gray-900">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-900">PNG, JPG, GIF up to 10MB</p>
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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900"
                required
              >
                <option value="" className="text-gray-500">Select Category</option>
                {categories.map((category, index) => (
                  <option key={`${category}-${index}`} value={category} className="text-gray-900">
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] text-gray-900"
                required
              >
                <option value="" className="text-gray-500">Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.nameEn} className="text-gray-900">
                    {location.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-white bg-[#9a0e20] rounded-lg hover:bg-[#7a0b19] transition-colors disabled:opacity-50"
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