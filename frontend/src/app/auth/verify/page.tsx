'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function VerifyRegistration() {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      setStep('verify');
    }
  }, [searchParams]);

  // Step 1: Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/@(std\.)?iyte\.edu\.tr$/)) {
      setStatus('Please enter a valid IYTE email address (@iyte.edu.tr or @std.iyte.edu.tr).');
      return;
    }
    setStatus('Sending verification code...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/pre-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniMail: email }),
      });
      if (response.ok) {
        setStatus('Verification code sent to your email!');
        setTimeout(() => {
          setStep('verify');
          setStatus('');
        }, 1000);
      } else {
        const data = await response.json();
        setStatus(data.message || 'Failed to send code.');
      }
    } catch (err) {
      setStatus('Failed to send code.');
    }
  };

  // Step 2: Verification code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setStatus('Please enter a valid 6-digit code.');
      return;
    }
    setStatus('Verifying...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (data.message === 'Email verified. You can now log in.') {
        setStatus('Email verified! Redirecting...');
        setTimeout(() => router.push('/auth'), 1500);
      } else {
        setStatus(data.message || 'Verification failed.');
      }
    } catch (err) {
      setStatus('Verification failed.');
    }
  };

  const handleSendAgain = async () => {
    console.log("Send Again tıklandı, email:", email);
    setStatus('Resending code...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('Verification code sent again!');
      } else {
        setStatus(data.message || 'Failed to resend code.');
      }
    } catch (err) {
      setStatus('Failed to resend code.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: "url('/assets/login_page_bg1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/75 z-0"></div>
      {/* Logo above the card */}
      <div className="flex flex-col items-center -mt-20 z-10">
        <Image
          src="/assets/iyte_logo_tr.png"
          alt="IYTE Logo"
          width={120}
          height={120}
          className="object-contain"
          style={{ background: 'transparent', borderRadius: 0 }}
        />
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10 flex flex-col items-center mt-4">
        {step === 'email' && (
          <>
            <h2 className="text-2xl font-bold text-black text-center mb-6">Verify Your Email</h2>
            <form onSubmit={handleSendCode} className="space-y-4 w-full">
              <label className="block text-gray-700 font-medium mb-1" htmlFor="email">
                Email
              </label>
              <div className="flex items-center border rounded-lg p-2 bg-white">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm8 4v1a3 3 0 01-3 3H7a3 3 0 01-3-3v-1a9 9 0 0118 0z" /></svg>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your IYTE email (@iyte.edu.tr or @std.iyte.edu.tr)"
                  className="flex-1 outline-none bg-transparent text-base text-gray-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#9a0e20] text-white py-2 rounded-lg font-semibold hover:bg-[#7a0b19] transition-colors cursor-pointer"
              >
                Send Verification Code
              </button>
              <button
                type="button"
                className="w-full text-sm text-gray-600 hover:text-[#9a0e20] mt-2 underline cursor-pointer"
                onClick={() => router.push('/auth')}
              >
                Back to Login
              </button>
              {status && <div className="text-center text-[#9a0e20] text-sm mt-2">{status}</div>}
            </form>
          </>
        )}
        {step === 'verify' && (
          <>
            <h2 className="text-2xl font-bold text-black text-center mb-6">Verification Code</h2>
            <form onSubmit={handleVerify} className="space-y-4 w-full">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full p-2 border rounded-lg text-base text-gray-700"
              />
              <button
                type="submit"
                className="w-full bg-[#9a0e20] text-white py-2 rounded-lg font-semibold hover:bg-[#7a0b19] transition-colors cursor-pointer"
              >
                Verify Code
              </button>
              <button
                type="button"
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                onClick={handleSendAgain}
              >
                Send Again
              </button>
              <button
                type="button"
                className="w-full text-sm text-gray-600 hover:text-[#9a0e20] mt-2 underline cursor-pointer"
                onClick={() => router.push('/auth')}
              >
                Back to Login
              </button>
              {status && <div className="text-center text-[#9a0e20] text-sm mt-2">{status}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
} 