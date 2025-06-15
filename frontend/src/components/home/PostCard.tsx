import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiFlag, FiMoreVertical, FiTag, FiMapPin } from 'react-icons/fi';
import { FaPlug, FaTshirt, FaWallet, FaGem, FaBoxOpen } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  category: string;
  location: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userId: number;
  imageBase64?: string;
  imageContentType?: string;
  userProfilePhoto?: string;
}

interface PostCardProps {
  post: Post;
  searchQuery: string;
  onSendMessage: (userId: number, userName: string) => void;
  onReportPost: (postId: number, postTitle: string) => void;
  highlightText: (text: string, searchTerm: string) => React.ReactNode;
  showMessageForm?: boolean;
  onToggleMessageForm?: (postId: number) => void;
  onSendMessageText?: (userId: number, userName: string, message: string, postId?: number) => void;
  viewMode?: 'quad' | 'double' | 'single';
  isHighlighted?: boolean;
}

export default function PostCard({ 
  post, 
  searchQuery, 
  onSendMessage, 
  onReportPost, 
  highlightText,
  showMessageForm = false,
  onToggleMessageForm,
  onSendMessageText,
  viewMode = 'double',
  isHighlighted,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [messageText, setMessageText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleReportClick = () => {
    onReportPost(post.id, post.title);
    setShowMenu(false);
  };

  const handleSendMessageClick = () => {
    if (onToggleMessageForm) {
      onToggleMessageForm(post.id);
    } else {
      onSendMessage(post.userId, post.userName);
    }
  };

  const handleSendMessageText = () => {
    if (messageText.trim() && onSendMessageText) {
      onSendMessageText(post.userId, post.userName, messageText.trim(), post.id);
      setMessageText('');
      if (onToggleMessageForm) {
        onToggleMessageForm(post.id);
      }
    }
  };

  const handleCancelMessage = () => {
    setMessageText('');
    if (onToggleMessageForm) {
      onToggleMessageForm(post.id);
    }
  };

  // Limit title to 30 characters
  const truncatedTitle = post.title && post.title.length > 31 ? post.title.substring(0, 31) : (post.title || 'Untitled');

  return (
    <div 
      data-post-id={post.id}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative h-full flex flex-col ${
        isHighlighted ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-2xl transform scale-105 transition-all duration-1000' : ''
      }`}
    >
      {/* Report Flag - Only in top right corner */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => onReportPost(post.id, post.title)}
          className="p-1.5 hover:bg-white/20 transition-colors cursor-pointer"
          title="Report this post"
        >
          <FiFlag className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Post İçeriği */}
      <div className="p-3 sm:p-4 flex flex-col h-full">
        {/* User Info Section with Lost/Found badge below time */}
        <div className="flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-4 min-h-[64px]">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 overflow-hidden border border-black flex-shrink-0">
            <img
              src={post.userProfilePhoto || "/assets/default_avatar.png"}
              alt={`${post.userName} profil fotoğrafı`}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate text-sm sm:text-base">{post.userName}</p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}
            </p>
            <span className={`inline-block mt-1 ${post.type.toUpperCase() === 'LOST' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} text-xs font-medium px-2 py-1 rounded`}>
              {post.type.toUpperCase() === 'LOST' ? 'Lost' : 'Found'}
            </span>
          </div>
        </div>
        
        {/* Title Section - Limited to 30 characters */}
        <div className="mb-2 sm:mb-3 min-h-[32px] sm:min-h-[40px]">
          <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-800" title={post.title || 'Untitled'}>
            {highlightText(truncatedTitle, searchQuery)}
          </h3>
        </div>
        
        {/* Image Section - Instagram-like 4:3 aspect ratio with auto crop */}
        <div className="mb-2 sm:mb-3 flex justify-center items-center bg-white rounded-lg border border-black overflow-hidden post-image">
          {post.imageBase64 ? (
            <img
              src={`data:${post.imageContentType};base64,${post.imageBase64}`}
              alt={post.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <img
              src={
                post.category === 'Electronics' ? '/assets/electronic.jpeg' :
                post.category === 'Clothing' ? '/assets/clothes.jpeg' :
                post.category === 'Cards' ? '/assets/wallet.jpeg' :
                post.category === 'Other' ? '/assets/others.jpeg' :
                post.category === 'Accessories' ? '/assets/accessories.jpeg' :
                '/assets/others.jpeg'
              }
              alt="Default category image"
              className="object-cover w-full h-full"
            />
          )}
        </div>
        
        {/* Description Section - Responsive */}
        <div className="mb-2 sm:mb-3 flex-grow min-h-[40px] sm:min-h-[60px]">
          {post.description && post.description.trim() !== '' ? (
            <p className="text-gray-600 text-xs sm:text-sm line-clamp-3">{highlightText(post.description, searchQuery)}</p>
          ) : (
            <div className="w-full min-h-[20px]"></div>
          )}
        </div>
        
        {/* Tags Section - Responsive Layout with icons */}
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-wrap gap-1">
            <button 
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 hover:max-w-none group"
              title={`Category: ${post.category}`}
              onClick={(e) => {
                if (window.innerWidth < 640) { // Only for mobile
                  e.currentTarget.classList.toggle('max-w-[calc(50%-2px)]');
                }
              }}
            >
              {post.category === 'Electronics' && <FaPlug className="w-3 h-3 flex-shrink-0" />}
              {post.category === 'Clothing' && <FaTshirt className="w-3 h-3 flex-shrink-0" />}
              {post.category === 'Cards' && <FaWallet className="w-3 h-3 flex-shrink-0" />}
              {post.category === 'Accessories' && <FaGem className="w-3 h-3 flex-shrink-0" />}
              {post.category === 'Other' && <FaBoxOpen className="w-3 h-3 flex-shrink-0" />}
              <span className="hidden sm:inline">{post.category}</span>
              <span className="sm:hidden">{post.category}</span>
            </button>
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 whitespace-normal break-words" title={`Location: ${post.location}`}>
              <FiMapPin className="w-3 h-3 flex-shrink-0" />
              <span>{post.location}</span>
            </span>
          </div>
        </div>

        {/* Message Button Section - Always at Bottom */}
        <div className="mt-auto">
          {!showMessageForm ? (
            <button
              onClick={handleSendMessageClick}
              className="w-full bg-[#9a0e20] text-white px-3 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm">Send Message</span>
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Write a message to ${post.userName}...`}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#9a0e20] outline-none text-gray-900 placeholder-gray-500 resize-none text-sm"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelMessage}
                  className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessageText}
                  disabled={!messageText.trim()}
                  className="flex-1 bg-[#9a0e20] text-white px-3 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 