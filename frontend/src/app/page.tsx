'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
// Melik commit denemesi
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/home'); // If there is a token, redirect to /home
    } else {
      router.push('/auth'); // If there is no token, redirect to /auth
    }
  }, [router]);

  return null;
}
