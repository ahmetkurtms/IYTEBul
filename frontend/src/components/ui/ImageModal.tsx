import { useEffect, useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ImageModalProps {
  isOpen: boolean;
  imageUrls: string[];
  currentIndex: number;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  altText?: string;
}

export default function ImageModal({
  isOpen,
  imageUrls,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  altText = 'Image'
}: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setImageLoaded(false);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrevious && imageUrls.length > 1) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && onNext && imageUrls.length > 1) {
        onNext();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onPrevious, onNext, imageUrls.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && onNext && imageUrls.length > 1) {
      onNext();
    }
    if (isRightSwipe && onPrevious && imageUrls.length > 1) {
      onPrevious();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black bg-opacity-60 text-white hover:bg-opacity-80 transition-all duration-200 md:p-2 cursor-pointer"
        title="Close (Esc)"
      >
        <FiX className="w-6 h-6 md:w-5 md:h-5" />
      </button>

      {/* Previous Button - Desktop only */}
      {imageUrls.length > 1 && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="hidden md:block absolute left-4 z-10 p-3 rounded-full bg-black bg-opacity-60 text-white hover:bg-opacity-80 transition-all duration-200 cursor-pointer"
          title="Previous image (←)"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next Button - Desktop only */}
      {imageUrls.length > 1 && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="hidden md:block absolute right-4 z-10 p-3 rounded-full bg-black bg-opacity-60 text-white hover:bg-opacity-80 transition-all duration-200 cursor-pointer"
          title="Next image (→)"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image Container - Only wraps the actual image */}
      <div 
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image with loading state */}
        <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          <img
            src={imageUrls[currentIndex]}
            alt={altText}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        </div>
      </div>

      {/* Image Counter */}
      {imageUrls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-black bg-opacity-60 text-white text-sm font-medium">
          {currentIndex + 1} / {imageUrls.length}
        </div>
      )}

      {/* Mobile swipe hint */}
      {imageUrls.length > 1 && (
        <div className="md:hidden absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black bg-opacity-40 text-white text-xs">
          Swipe to navigate
        </div>
      )}
    </div>
  );
} 