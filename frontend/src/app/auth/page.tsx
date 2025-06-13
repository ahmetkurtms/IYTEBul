'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// Form doğrulama şemaları, e-posta ve şifre için

const loginSchema = Yup.object().shape({
  identifier: Yup.string()
    .matches(
      /@(std\.)?iyte\.edu\.tr$/,
      'Only IYTE email addresses (@iyte.edu.tr or @std.iyte.edu.tr) are allowed'
    )
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const registerSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  middle_name: Yup.string(),
  surname: Yup.string().required('Surname is required'),
  nickname: Yup.string()
    .min(3, 'Nickname must be at least 3 characters')
    .max(30, 'Nickname must be at most 30 characters')
    .required('Nickname is required'),
  uniMail: Yup.string()
    .matches(
      /@(std\.)?iyte\.edu\.tr$/,
      'Only IYTE email addresses (@iyte.edu.tr or @std.iyte.edu.tr) are allowed'
    )
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Confirm Password is required'),
});

// Auth bileşeni

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Yardımcı fonksiyon: İlk harfi büyük yap
  function capitalizeFirstLetter(str: string) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const handleSubmit = async (values: any, { setSubmitting, setStatus }: any) => {
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/pre-register';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      let requestBody;
      if (isLogin) {
        requestBody = {
          uniMail: values.identifier, // Backend expects uniMail
          password: values.password
        };
      } else {
        // İsimlerin ilk harfini büyük yap
        requestBody = {
          name: capitalizeFirstLetter(values.name.trim()),
          middle_name: values.middle_name ? capitalizeFirstLetter(values.middle_name.trim()) : '',
          surname: capitalizeFirstLetter(values.surname.trim()),
          nickname: values.nickname.trim(),
          uniMail: values.uniMail.trim(),
          password: values.password
        };
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let responseData;
      let rawText = await response.text();
      try {
        responseData = JSON.parse(rawText);
      } catch (e) {
        responseData = { message: rawText };
      }
      // Nickname/email unique hatasını kullanıcıya göster
      if (!response.ok) {
        const msg = (responseData.message || responseData.error || rawText || '').toLowerCase();
        if (isLogin) {
          if (msg.includes('not verified')) {
            setStatus('Email is not verified. Please check your email.');
          } else if (msg.includes('password')) {
            setStatus('Incorrect password.');
          } else if (msg.includes('not found') || msg.includes('no user')) {
            setStatus('No account found with this email.');
          } else {
            setStatus(responseData.message || responseData.error || 'Login failed');
          }
        } else {
          if (msg.includes('email')) {
            setStatus('This email is already registered.');
          } else if (msg.includes('nickname')) {
            setStatus('This nickname is already taken.');
          } else {
            setStatus(responseData.message || responseData.error || 'An error occurred');
          }
        }
        setSubmitting(false);
        return;
      }

      if (response.ok) {
        if (!isLogin) {
          // Kayıt başarılıysa verify sayfasına email ile yönlendir
          router.push(`/auth/verify?email=${encodeURIComponent(values.uniMail)}`);
          return;
        } else {
          // Login başarılıysa token kaydet ve admin kontrolü yap
          const token = responseData.token;
          localStorage.setItem('token', token);
          if (responseData.user) {
            localStorage.setItem('user', JSON.stringify(responseData.user));
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Ban kontrolü yap
          if (responseData.user?.isBanned) {
            const banExpiresAt = responseData.user.banExpiresAt;
            const now = new Date();
            
            if (!banExpiresAt || new Date(banExpiresAt) > now) {
              // Kullanıcı hala banlı
              const banExpiry = banExpiresAt ? new Date(banExpiresAt).toLocaleString() : 'indefinitely';
              setStatus(`🚫 YOUR ACCOUNT IS BANNED until ${banExpiry}. Please contact administrators for more information.`);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setSubmitting(false);
              return;
            }
          }
          
          // Admin kontrolü yap
          try {
            const adminCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (adminCheckResponse.ok) {
              // Admin ise admin panel'e yönlendir
              router.push('/admin');
            } else {
              // Normal kullanıcı ise home'a yönlendir
              router.push('/home');
            }
          } catch (error) {
            // Hata durumunda normal kullanıcı olarak kabul et
            router.push('/home');
          }
          
          router.refresh();
        }
      } else {
        setStatus(responseData.message || 'An error occurred');
      }
    } catch (error) {
      setStatus('An error occurred: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSubmitting(false);
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
      {/* Karartma katmanı */}
      <div className="absolute inset-0 bg-black/75"></div>

      {/* İçerik */}
      <div className="sm:mx-auto w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center -mt-20">
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

        <div className="mt-8 bg-white/90 backdrop-blur-md py-8 px-8 shadow-2xl rounded-2xl min-h-[100px] flex flex-col justify-center">
          <Formik
            initialValues={{
              name: '',
              middle_name: '',
              surname: '',
              nickname: '',
              uniMail: '',
              identifier: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={isLogin ? loginSchema : registerSchema}
            onSubmit={handleSubmit}
            validateOnBlur={true}
            validateOnChange={true}
          >
            {({ errors, touched, isSubmitting, status, isValid, setStatus, handleChange }) => (
              <Form className='space-y-3'>
                {/* Genel hata mesajı - moved to top */}
                {status && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className='text-[#9a0e20] text-sm text-center font-medium'>
                      {status}
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <>
                    <div className="flex gap-3 justify-center">
                      <div className="flex-1">
                        <Field
                          name="name"
                          type="text"
                          placeholder="Name"
                          className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]"
                          onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                        />
                        <div className="h-5">
                          {errors.name && (touched.name || isSubmitting) && (
                            <div className='text-[#9a0e20] text-sm'>{errors.name}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Field
                          name="middle_name"
                          type="text"
                          placeholder="Middle Name (Optional)"
                          className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]"
                          onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                        />
                      </div>
                      <div className="flex-1">
                        <Field
                          name="surname"
                          type="text"
                          placeholder="Surname"
                          className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]"
                          onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                        />
                        <div className="h-5">
                          {errors.surname && (touched.surname || isSubmitting) && (
                            <div className='text-[#9a0e20] text-sm'>{errors.surname}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Field
                        name="nickname"
                        type="text"
                        placeholder="Nickname"
                        className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]"
                        onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                      />
                      <div className="h-5">
                        {errors.nickname && (touched.nickname || isSubmitting) && (
                          <div className='text-[#9a0e20] text-sm'>{errors.nickname}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Field
                        name="uniMail"
                        type="email"
                        placeholder="Email (@iyte.edu.tr or @std.iyte.edu.tr)"
                        className="w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]"
                        onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                      />
                      <div className="h-5">
                        {errors.uniMail && (touched.uniMail || isSubmitting) && (
                          <div className='text-[#9a0e20] text-sm'>{errors.uniMail}</div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {isLogin && (
                  <div>
                    <Field
                      name='identifier'
                      type='email'
                      placeholder='IYTE Email (@iyte.edu.tr or @std.iyte.edu.tr)'
                      className='w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]'
                      onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                    />
                    <div className="h-5">
                      {errors.identifier && (touched.identifier || isSubmitting) && (
                        <div className='text-[#9a0e20] text-sm'>{errors.identifier}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Field
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Password'
                    className='w-full p-2 pr-10 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]'
                    onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-800 focus:outline-none"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                  <div className="h-5">
                    {errors.password && (touched.password || isSubmitting) && (
                      <div className='text-[#9a0e20] text-sm'>{errors.password}</div>
                    )}
                  </div>
                  {isLogin && (
                    <button
                      type="button"
                      className="w-full text-xs text-[#9a0e20] hover:underline mb-2 text-right cursor-pointer"
                      onClick={() => router.push('/auth/forgot-password')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {!isLogin && (
                  <div>
                    <Field
                      name='confirmPassword'
                      type='password'
                      placeholder='Confirm Password'
                      className='w-full p-2 border rounded-lg bg-white text-gray-800 text-base transition-all duration-300 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20] outline-none hover:border-[#9a0e20]'
                      onChange={(e: React.ChangeEvent<any>) => { handleChange(e); setStatus(''); }}
                    />
                    <div className="h-5">
                      {errors.confirmPassword && (touched.confirmPassword || isSubmitting) && (
                        <div className='text-[#9a0e20] text-sm'>{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type='submit'
                  disabled={isSubmitting || !isValid}
                  className={`w-full py-2 rounded-lg transition-colors text-lg font-semibold tracking-wide shadow-md
                    ${isSubmitting || !isValid
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#9a0e20] text-white hover:bg-[#7a0b19] cursor-pointer'}
                  `}
                >
                  {isSubmitting ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                </button>
              </Form>
            )}
          </Formik>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className='w-full mt-4 text-sm text-gray-600 hover:text-[#9a0e20] cursor-pointer underline underline-offset-2'
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}


{/*
  public/assets klasörü, statik dosyaları barındırmak için kullanılır.
  logo, arka plan resimlerini oraya attık.

  app/components'de Navbar bileşeni oluşturduk sayfa icinde direkt Navbar/ şeklinde kullandık. (gelecekte birkac şey daha eklenebilir giriş yapılınca Navbar'da arama yeri, çıkış yap, profil gibi şeyler eklenebilir.)

  Formik ve Yup kütüphaneleri form doğrulama icinmiş gpt yaptı birazını, gelecekte bakılabilir.

  API eklenicek backend'den gelecek verileri almak için.

*/}
