import React, { useEffect, useState } from 'react';

const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 p-3 cursor-pointer rounded-full bg-[#9a0e20] text-white shadow-lg transition-opacity duration-300 hover:bg-[#7a0b19] focus:outline-none focus:ring-2 focus:ring-[#9a0e20] ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-label="Scroll to top"
    >
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d="M12 19V5M12 5L6 11M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton; 