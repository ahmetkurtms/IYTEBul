'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  // Step 1: Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('@std.iyte.edu.tr')) {
      setStatus('Please enter a valid IYTE student email.');
      return;
    }
    setStatus('Sending verification code...');
    try {
      const response = await fetch('http://localhost:8080/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.message === 'Verification code sent to your email.') {
        setStatus('Verification code sent to your email!');
        setTimeout(() => {
          setStep('verify');
          setStatus('');
        }, 1000);
      } else {
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
    setStatus('Checking code...');
    try {
      const response = await fetch('http://localhost:8080/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: '' }),
      });
      const data = await response.json();
      if (data.message === 'Code valid.') {
        setStep('reset');
        setStatus('');
      } else {
        setStatus(data.message || 'Invalid verification code.');
      }
    } catch (err) {
      setStatus('Verification failed.');
    }
  };

  const handleSendAgain = () => {
    setStatus('Verification code sent again!');
  };

  // Step 3: Reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatus('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }
    setStatus('Resetting password...');
    try {
      const response = await fetch('http://localhost:8080/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await response.json();
      if (data.message === 'Password reset successful. You can now log in.') {
        setStatus('Password reset successful! Redirecting...');
        setTimeout(() => router.push('/auth'), 1500);
      } else {
        setStatus(data.message || 'Password reset failed.');
      }
    } catch (err) {
      setStatus('Password reset failed.');
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
        <div className="rounded-full p-1">
          <Image
            src="/assets/iyte_logo_tr.png"
            alt="IYTE Logo"
            width={200}
            height={200}
            priority
            className="object-contain"
          />
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white">
          IYTEBul
        </h2>
      </div>
      <div className="mt-8 bg-white/90 backdrop-blur-md py-8 px-8 shadow-2xl rounded-2xl min-h-[100px] w-full max-w-xl flex flex-col justify-center items-center relative z-10">
        {step === 'email' && (
          <>
            <h2 className="text-2xl font-bold text-black text-center mb-6">Forgot Password</h2>
            <form onSubmit={handleSendCode} className="space-y-4 w-full">
              <label className="block text-gray-700 font-medium mb-1" htmlFor="email">
                Email
              </label>
              <div className="flex items-center border rounded-lg p-2 bg-white">
                <input
                  id="email"
                  type="email"
                  placeholder="@std.iyte.edu.tr"
                  className="flex-1 outline-none bg-transparent text-base text-gray-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!email.endsWith('@std.iyte.edu.tr') || email.trim() === ''}
                className={`w-full py-2 rounded-lg transition-colors text-lg font-semibold tracking-wide shadow-md
                  ${(!email.endsWith('@std.iyte.edu.tr') || email.trim() === '')
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#9a0e20] text-white hover:bg-[#7a0b19] cursor-pointer'}
                `}
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
                className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] hover:border-[#9a0e20]"
              />
              <button
                type="submit"
                disabled={code.length !== 6}
                className={`w-full py-2 rounded-lg transition-colors text-lg font-semibold tracking-wide shadow-md
                  ${code.length !== 6
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#9a0e20] text-white hover:bg-[#7a0b19] cursor-pointer'}
                `}
              >
                Verify Code
              </button>
              <button
                type="button"
                className="w-full py-2 rounded-lg transition-colors text-lg font-semibold tracking-wide shadow-md bg-[#9a0e20] text-white hover:bg-[#7a0b19] cursor-pointer"
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
        {step === 'reset' && (
          <>
            <h2 className="text-2xl font-bold text-center text-black mb-6">Reset Password</h2>
            <form onSubmit={handleReset} className="space-y-4 w-full">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] hover:border-[#9a0e20]"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] hover:border-[#9a0e20]"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg transition-colors text-lg font-semibold tracking-wide shadow-md bg-[#9a0e20] text-white hover:bg-[#7a0b19] cursor-pointer"
              >
                Reset Password
              </button>
              {status && <div className="text-center text-[#9a0e20] text-sm mt-2">{status}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
} 