import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

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
  highlightText: (text: string, searchTerm: string) => React.ReactNode;
}

export default function PostCard({ post, searchQuery, onSendMessage, highlightText }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Post İçeriği */}
      <div className="p-4 flex flex-col min-h-[500px]">
        {/* User Info Section - Fixed Height */}
        <div className="flex items-center space-x-3 mb-4 h-12">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-black">
            <img
              src={post.userProfilePhoto || "/assets/default_avatar.png"}
              alt={`${post.userName} profil fotoğrafı`}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <p className="font-medium text-gray-800">{post.userName}</p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}
            </p>
          </div>
          <span className={`ml-auto ${post.type.toUpperCase() === 'LOST' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} text-xs font-medium px-2.5 py-0.5 rounded`}>
            {post.type.toUpperCase() === 'LOST' ? 'Lost' : 'Found'}
          </span>
        </div>
        
        {/* Title Section - Fixed Height */}
        <div className="mb-4 min-h-[40px]">
          <h3 className="text-xl font-semibold text-gray-800">{highlightText(post.title, searchQuery)}</h3>
        </div>
        
        {/* Image Section - Fixed Height */}
        <div className="mb-4 flex justify-center items-center bg-white rounded-lg border border-black" style={{ minHeight: '320px', height: '320px', padding: '4px' }}>
          {post.imageBase64 ? (
            <img
              src={`data:${post.imageContentType};base64,${post.imageBase64}`}
              alt={post.title}
              className="object-contain w-full h-full"
              style={{ maxHeight: '312px', background: '#fff' }}
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
              className="object-contain w-full h-full"
              style={{ maxHeight: '312px', background: '#fff' }}
            />
          )}
        </div>
        
        {/* Description Section - Flexible Height with Min */}
        <div className="mb-4 min-h-[60px] flex-grow flex items-center" style={{ minHeight: '60px' }}>
          {post.description && post.description.trim() !== '' ? (
            <p className="text-gray-600 w-full">{highlightText(post.description, searchQuery)}</p>
          ) : (
            <div className="w-full" style={{ minHeight: '24px' }}></div>
          )}
        </div>
        
        {/* Tags & Message Button Section - Same Row */}
        <div className="flex items-center min-h-[40px] mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
              Category: {post.category}
            </span>
            <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
              Location: {post.location}
            </span>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => onSendMessage(post.userId, post.userName)}
              className="flex items-center space-x-2 bg-[#9a0e20] text-white px-4 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 