'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/home'); // Eğer token varsa /home sayfasına yönlendir
    } else {
      router.push('/auth'); // Eğer token yoksa /auth sayfasına yönlendir
    }
  }, [router]);

  return null;
}
