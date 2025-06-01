'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiSearch, FiSend, FiMoreVertical, FiPaperclip, FiSmile, FiMessageCircle, FiX, FiImage, FiChevronUp, FiChevronDown, FiCamera } from 'react-icons/fi';
import { BsCheck, BsCheckAll } from 'react-icons/bs';
import Image from 'next/image';
import { messageApi, MessageResponse, ConversationResponse, UserProfile } from '@/lib/messageApi';

interface User {
  id: number;
  nickname: string;
  name: string;
  profilePhotoUrl?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  isSent: boolean;
  imageBase64List?: string[];
}

interface Conversation {
  id: number;
  user: User;
  lastMessage?: Message;
  unreadCount: number;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileSendLoading, setFileSendLoading] = useState(false);
  const [fileSendError, setFileSendError] = useState<string | null>(null);

  // Fix hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Admin kontrolü ekle
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        // Fresh user bilgisini çek ve ban kontrolü yap
        const profileResponse = await fetch('http://localhost:8080/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          
          // LocalStorage'ı güncelle
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Ban kontrolü yap
          if (userData.isBanned) {
            const banExpiresAt = userData.banExpiresAt;
            const now = new Date();
            
            if (!banExpiresAt || new Date(banExpiresAt) > now) {
              // Kullanıcı hala banlı
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/auth');
              return;
            }
          }
        } else if (profileResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth');
          return;
        }

        // Admin kontrolü yap
        const response = await fetch('http://localhost:8080/api/v1/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Admin ise admin panel'e yönlendir
          router.push('/admin');
          return;
        }
      } catch (error) {
        // Admin değil, normal kullanıcı olarak devam et
      }
    };

    checkAdminStatus();
  }, [router]);

  // Function to refresh conversations
  const refreshConversations = async () => {
    try {
      console.log('Refreshing conversations...');
      const conversationsData = await messageApi.getConversations();
      
      // Convert backend data to frontend format
      const convertedConversations: Conversation[] = conversationsData.map(conv => ({
        id: conv.conversationId,
        user: {
          id: conv.otherUserId,
          nickname: conv.otherUserNickname,
          name: conv.otherUserName,
          profilePhotoUrl: conv.otherUserProfilePhoto,
          isOnline: conv.otherUserIsOnline,
          lastSeen: conv.otherUserLastSeen
        },
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage.messageId,
          senderId: conv.lastMessage.senderId,
          receiverId: conv.lastMessage.receiverId,
          content: conv.lastMessage.messageText,
          timestamp: conv.lastMessage.sentAt,
          isRead: conv.lastMessage.isRead,
          isSent: true,
          imageBase64List: conv.lastMessage.imageBase64List || []
        } : undefined,
        unreadCount: conv.unreadCount
      }));

      // Remove duplicates based on user.id
      const uniqueConversations = convertedConversations.filter((conv, index, self) => 
        index === self.findIndex(c => c.user.id === conv.user.id)
      );
      
      console.log('Conversations refreshed:', uniqueConversations);
      setConversations(uniqueConversations);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  // Function to clear messages
  const handleClearMessages = async () => {
    if (!selectedConversation) return;
    setShowOptionsMenu(false);
    setShowClearModal(true);
  };

  // Function to confirm clearing messages
  const confirmClearMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      console.log('Clearing messages with user:', selectedConversation.user.id);
      
      // Call backend API to clear messages
      await messageApi.clearMessages(selectedConversation.user.id);
      
      // Clear messages in local state
      setMessages([]);
      
      // Refresh conversations to update the conversation list
      await refreshConversations();
      
      // Exit the chat by clearing selected conversation
      setSelectedConversation(null);
      
      console.log('Messages cleared successfully and exited chat');
      
    } catch (error) {
      console.error('Error clearing messages:', error);
      alert('Failed to clear messages. Please try again.');
    }
  };

  // Load conversations from backend
  useEffect(() => {
    if (!isMounted) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const loadConversations = async () => {
      try {
        console.log('Loading conversations...');
        setConnectionError(null);
        
        // Load current user and conversations in parallel
        const [userProfile, conversationsData] = await Promise.all([
          messageApi.getCurrentUser(),
          messageApi.getConversations()
        ]);
        
        console.log('User profile:', userProfile);
        console.log('Conversations data:', conversationsData);
        
        // Set current user from API
        const currentUserData = {
          id: userProfile.userId,
          nickname: userProfile.nickname,
          name: userProfile.name,
          profilePhotoUrl: userProfile.profilePhotoUrl,
          isOnline: true
        };
        setCurrentUser(currentUserData);
        console.log('Current user set:', currentUserData);
        
        // Convert backend data to frontend format
        const convertedConversations: Conversation[] = conversationsData.map(conv => ({
          id: conv.conversationId,
          user: {
            id: conv.otherUserId,
            nickname: conv.otherUserNickname,
            name: conv.otherUserName,
            profilePhotoUrl: conv.otherUserProfilePhoto,
            isOnline: conv.otherUserIsOnline,
            lastSeen: conv.otherUserLastSeen
          },
          lastMessage: conv.lastMessage ? {
            id: conv.lastMessage.messageId,
            senderId: conv.lastMessage.senderId,
            receiverId: conv.lastMessage.receiverId,
            content: conv.lastMessage.messageText,
            timestamp: conv.lastMessage.sentAt,
            isRead: conv.lastMessage.isRead,
            isSent: true,
            imageBase64List: conv.lastMessage.imageBase64List || []
          } : undefined,
          unreadCount: conv.unreadCount
        }));

        console.log('Converted conversations:', convertedConversations);
        
        // Remove duplicates based on user.id
        const uniqueConversations = convertedConversations.filter((conv, index, self) => 
          index === self.findIndex(c => c.user.id === conv.user.id)
        );
        
        console.log('Unique conversations after deduplication:', uniqueConversations);

        setConversations(uniqueConversations);
        
        // Check if we need to start a conversation with a specific user
        const startWithUserId = searchParams.get('startWith');
        console.log('StartWith parameter:', startWithUserId);
        
        if (startWithUserId) {
          const targetUserId = parseInt(startWithUserId);
          console.log('Target user ID:', targetUserId);
          
          const existingConversation = uniqueConversations.find(
            conv => conv.user.id === targetUserId
          );
          
          if (existingConversation) {
            console.log('Found existing conversation:', existingConversation);
            // Select existing conversation
            setSelectedConversation(existingConversation);
          } else {
            console.log('Creating new conversation for user:', targetUserId);
            // Fetch user info and create a new conversation placeholder
            try {
              const targetUser = await messageApi.getUserById(targetUserId);
              console.log('Target user details:', targetUser);
              
              const newConversation: Conversation = {
                id: 0, // Use 0 for new conversations
                user: {
                  id: targetUserId,
                  nickname: targetUser.nickname,
                  name: targetUser.name,
                  profilePhotoUrl: targetUser.profilePhotoUrl,
                  isOnline: false,
                  lastSeen: new Date().toISOString()
                },
                lastMessage: undefined,
                unreadCount: 0
              };
              setSelectedConversation(newConversation);
              // Also add to conversations list, but prevent duplicates
              setConversations(prev => {
                const exists = prev.some(c => c.user.id === newConversation.user.id);
                if (exists) return prev;
                return [newConversation, ...prev];
              });
              console.log('New conversation created and selected');
            } catch (error) {
              console.error('Error fetching user info:', error);
              // Fallback to basic conversation
              const newConversation: Conversation = {
                id: 0, // Use 0 for new conversations
                user: {
                  id: targetUserId,
                  nickname: 'Unknown User',
                  name: 'Unknown User',
                  profilePhotoUrl: undefined,
                  isOnline: false,
                  lastSeen: new Date().toISOString()
                },
                lastMessage: undefined,
                unreadCount: 0
              };
              setSelectedConversation(newConversation);
              console.log('Fallback conversation created');
            }
          }
          
          // Clear the URL parameter
          router.replace('/messages', { scroll: false });
        }
        
      } catch (error) {
        console.error('Error loading conversations:', error);
        
        // Check if it's a network error (backend not running)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setConnectionError('Backend server is not running. Please start the backend.');
        } else if (error instanceof Error && error.message.includes('token')) {
          setConnectionError('Authentication error. Please login again.');
          localStorage.removeItem('token');
          router.push('/auth');
        } else {
          setConnectionError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [router, searchParams, isMounted]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const loadMessages = async () => {
        try {
          const messagesData = await messageApi.getMessagesWithUser(selectedConversation.user.id);
          
          // Convert backend data to frontend format
          const convertedMessages: Message[] = messagesData.map(msg => ({
            id: msg.messageId,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.messageText,
            timestamp: msg.sentAt,
            isRead: msg.isRead,
            isSent: true,
            imageBase64List: msg.imageBase64List || []
          }));

          setMessages(convertedMessages);
          console.log('Messages loaded:', convertedMessages);
          console.log('Current user ID for comparison:', currentUser?.id);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedConversation, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Attachment icon click handler
  const handleAttachmentClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // File input change handler for multiple images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Prevent duplicates
    const newFiles = files.filter(
      file => !selectedFiles.some(f => f.name === file.name && f.size === file.size)
    );
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
  };

  // Remove a selected file
  const removeFile = (idx: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  // Send message with multiple images
  const handleSend = async () => {
    if (!selectedConversation || !currentUser) return;
    setFileSendLoading(true);
    setFileSendError(null);
    try {
      const base64List = await Promise.all(selectedFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve((e.target?.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));
      await messageApi.sendMessage({
        receiverId: selectedConversation.user.id,
        messageText: newMessage,
        imageBase64List: base64List
      });
      const message = {
        id: Date.now(),
        senderId: currentUser.id,
        receiverId: selectedConversation.user.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
        isSent: true,
        imageBase64List: base64List
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setSelectedFiles([]);
      setPreviews([]);
      setFileSendError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setConversations(prev => prev.map(conv =>
        conv.user.id === selectedConversation.user.id
          ? { ...conv, lastMessage: message }
          : conv
      ));
      await refreshConversations();
    } catch (error) {
      setFileSendError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setFileSendLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      // Send message to backend using the correct format
      await messageApi.sendMessage({
        receiverId: selectedConversation.user.id,
        messageText: newMessage.trim(),
        imageBase64List: []
      });

      // Add message to local state immediately for better UX
      const message: Message = {
        id: Date.now(),
        senderId: currentUser.id,
        receiverId: selectedConversation.user.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        isSent: true
      };

      console.log('Sending message:', message);
      console.log('Current user ID:', currentUser.id);

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Update the conversation's last message locally first for immediate feedback
      setConversations(prev => prev.map(conv => 
        conv.user.id === selectedConversation.user.id
          ? { ...conv, lastMessage: message }
          : conv
      ));

      // Refresh conversations from backend to get accurate data
      await refreshConversations();

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedFiles.length > 0) {
        handleSend();
      } else {
        handleSendMessage();
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close options menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showOptionsMenu && optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOptionsMenu]);

  // Filter messages based on search query (reverse order - newest first)
  const filteredMessages = messages
    .filter(message => message.content.toLowerCase().includes(messageSearchQuery.toLowerCase()))
    .reverse(); // Start from bottom (newest/latest messages)

  // Function to scroll to a specific message
  const scrollToMessage = (messageId: number) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      setHighlightedMessageId(messageId);
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  };

  // Handle message search
  const handleMessageSearch = (query: string) => {
    setMessageSearchQuery(query);
    setCurrentSearchIndex(0); // Reset to first result
    if (query.trim()) {
      // Recalculate filtered messages for the new query
      const newFilteredMessages = messages
        .filter(message => message.content.toLowerCase().includes(query.toLowerCase()))
        .reverse();
      
      if (newFilteredMessages.length > 0) {
        // Scroll to the first matching message (newest/bottom first)
        setTimeout(() => {
          scrollToMessage(newFilteredMessages[0].id);
        }, 100);
      }
    } else {
      setHighlightedMessageId(null);
    }
  };

  // Navigate to next search result
  const navigateToNextResult = () => {
    if (filteredMessages.length === 0) return;
    
    // Don't go beyond the last result
    if (currentSearchIndex < filteredMessages.length - 1) {
      const nextIndex = currentSearchIndex + 1;
      setCurrentSearchIndex(nextIndex);
      scrollToMessage(filteredMessages[nextIndex].id);
    }
  };

  // Navigate to previous search result
  const navigateToPreviousResult = () => {
    if (filteredMessages.length === 0) return;
    
    // Don't go before the first result
    if (currentSearchIndex > 0) {
      const prevIndex = currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      scrollToMessage(filteredMessages[prevIndex].id);
    }
  };

  // Clear search
  const clearSearch = () => {
    setMessageSearchQuery('');
    setCurrentSearchIndex(0);
    setHighlightedMessageId(null);
  };

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            {connectionError ? (
              <>
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-4xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h3>
                <p className="text-gray-600 mb-4">{connectionError}</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">To fix this issue:</p>
                  <ol className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                    <li>1. Open terminal in backend folder</li>
                    <li>2. Run: <code className="bg-gray-100 px-2 py-1 rounded">./gradlew bootRun</code></li>
                    <li>3. Wait for "Started Application" message</li>
                    <li>4. Refresh this page</li>
                  </ol>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-[#9a0e20] text-white rounded-lg hover:bg-[#7a0b19] transition-colors"
                >
                  Retry Connection
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9a0e20] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading messages...</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className="w-80 bg-[#f7f7f7] border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-[#f7f7f7]">
            <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9a0e20]/30 focus:border-transparent bg-white placeholder-gray-600 font-medium text-gray-800"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.user.id === conversation.user.id;
              return (
                <div
                  key={`conv-${conversation.user.id}`}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`relative flex items-stretch border-b border-gray-100 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#ffe5e9]' : 'hover:bg-gray-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute right-0 top-0 h-full w-1 bg-[#9a0e20] rounded-l" />
                  )}
                  <div className="flex items-center space-x-3 flex-1 p-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {conversation.user.profilePhotoUrl ? (
                          <Image
                            src={conversation.user.profilePhotoUrl}
                            alt={conversation.user.nickname}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {conversation.user.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {conversation.user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.user.nickname}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage && formatDistanceToNow(
                            new Date(conversation.lastMessage.timestamp),
                            { addSuffix: true, locale: enUS }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.content
                            ? conversation.lastMessage.content
                            : (conversation.lastMessage?.imageBase64List && conversation.lastMessage.imageBase64List.length > 0
                                ? (<span className="flex items-center gap-1 text-gray-600"><FiCamera className="inline-block" /> Photo</span>)
                                : null)
                          }
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-[#9a0e20] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center shadow">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-[#f7f7f7] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {selectedConversation.user.profilePhotoUrl ? (
                        <Image
                          src={selectedConversation.user.profilePhotoUrl}
                          alt={selectedConversation.user.nickname}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {selectedConversation.user.nickname.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {selectedConversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.user.nickname}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.user.isOnline ? 'Online' : 
                        `Last seen: ${formatDistanceToNow(new Date(selectedConversation.user.lastSeen || ''), { addSuffix: true, locale: enUS })}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Message Search Button */}
                  <button 
                    onClick={() => setShowMessageSearch(!showMessageSearch)}
                    className={`p-2 rounded-lg transition-colors ${
                      showMessageSearch ? 'bg-[#A6292A] text-white' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <FiSearch className="w-5 h-5" />
                  </button>
                  
                  <div className="relative" ref={optionsMenuRef}>
                    <button 
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiMoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Options Dropdown Menu */}
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={handleClearMessages}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                        >
                          <span>🗑️</span>
                          <span>Clear Messages</span>
                        </button>
                        <button
                          onClick={() => {
                            alert(`${selectedConversation?.user.nickname} has been blocked`);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                        >
                          <span>🚫</span>
                          <span>Block User</span>
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => {
                            alert(`${selectedConversation?.user.nickname} has been reported`);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors flex items-center space-x-2"
                        >
                          <span>⚠️</span>
                          <span>Report User</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Search Bar */}
              {showMessageSearch && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search messages in this conversation..."
                      value={messageSearchQuery}
                      onChange={(e) => handleMessageSearch(e.target.value)}
                      className="w-full pl-10 pr-32 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A6292A] focus:border-transparent placeholder-gray-500 text-gray-700 text-sm"
                      autoFocus
                    />
                    
                    {/* Search Results Navigation */}
                    {messageSearchQuery && filteredMessages.length > 0 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {currentSearchIndex + 1} of {filteredMessages.length}
                        </span>
                        
                        {filteredMessages.length > 1 && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={navigateToNextResult}
                              disabled={currentSearchIndex >= filteredMessages.length - 1}
                              className={`p-1 rounded transition-colors ${
                                currentSearchIndex >= filteredMessages.length - 1 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title={currentSearchIndex >= filteredMessages.length - 1 ? 'Already at oldest result' : 'Go to older result'}
                            >
                              <FiChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={navigateToPreviousResult}
                              disabled={currentSearchIndex === 0}
                              className={`p-1 rounded transition-colors ${
                                currentSearchIndex === 0 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title={currentSearchIndex === 0 ? 'Already at newest result' : 'Go to newer result'}
                            >
                              <FiChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        
                        <button
                          onClick={clearSearch}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          title="Clear search"
                        >
                          <FiX className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                    
                    {/* No results message */}
                    {messageSearchQuery && filteredMessages.length === 0 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <span className="text-xs text-red-500 font-medium">
                          No results
                        </span>
                        <button
                          onClick={clearSearch}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <FiX className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                {messages.map((message, messageIndex) => {
                  const isCurrentUser = message.senderId === currentUser?.id;
                  const isHighlighted = highlightedMessageId === message.id;
                  const isMatchingSearch = messageSearchQuery && 
                    message.content.toLowerCase().includes(messageSearchQuery.toLowerCase());
                  
                  // Check if this is the currently selected search result
                  const isCurrentSearchResult = messageSearchQuery && 
                    filteredMessages.length > 0 && 
                    filteredMessages[currentSearchIndex]?.id === message.id;
                  
                  return (
                    <div
                      key={`msg-${message.id}-${message.timestamp}`}
                      ref={(el) => {
                        if (el) messageRefs.current[message.id] = el;
                      }}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} transition-all duration-300 ${
                        isHighlighted ? 'scale-105' : ''
                      }`}
                    >
                      <div
                        className={`relative max-w-xs lg:max-w-md px-2 py-1 shadow transition-all duration-300 ${
                          isCurrentUser
                            ? 'bg-[#A6292A] text-white self-end rounded-tl-lg rounded-tr-2xl rounded-bl-lg rounded-br-md'
                            : 'bg-[#f1f0f0] text-gray-900 self-start rounded-tl-2xl rounded-tr-lg rounded-br-lg rounded-bl-2xl'
                        } ${
                          isCurrentSearchResult ? 'ring-4 ring-[#A6292A]/40 ring-offset-2 scale-105' : 
                          isHighlighted ? 'ring-4 ring-[#A6292A]/30 ring-offset-2' : ''
                        } ${
                          isMatchingSearch && !isCurrentSearchResult && !isHighlighted ? 'ring-2 ring-yellow-400/30' : ''
                        }`}
                      >
                        <div className="relative">
                          <p className="text-sm leading-relaxed break-words pr-15">
                            {isMatchingSearch && messageSearchQuery ? (
                              // Highlight search terms
                              message.content.split(new RegExp(`(${messageSearchQuery})`, 'gi')).map((part, index) =>
                                part.toLowerCase() === messageSearchQuery.toLowerCase() ? (
                                  <mark
                                    key={index}
                                    className={`rounded px-1 ${
                                      isCurrentSearchResult
                                        ? 'bg-yellow-400 text-gray-900 font-semibold'
                                        : 'bg-yellow-300 text-gray-900'
                                    }`}
                                  >
                                    {part}
                                  </mark>
                                ) : (
                                  part
                                )
                              )
                            ) : (
                              message.content
                            )}
                          </p>
                          {Array.isArray(message.imageBase64List) && message.imageBase64List.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.imageBase64List.map((base64, idx) => (
                                <img
                                  key={idx}
                                  src={`data:image/jpeg;base64,${base64}`}
                                  alt="Mesaj fotoğrafı"
                                  className="w-32 h-32 object-cover rounded-lg border"
                                  style={{ maxWidth: '100%', height: 'auto' }}
                                />
                              ))}
                            </div>
                          )}
                          <div className="absolute right-[-4px] bottom-[-2px] flex items-center gap-1 text-xs text-gray-400">
                            <span>
                              {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isCurrentUser && (
                              <span>
                                {message.isRead ? (
                                  <BsCheckAll className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <BsCheck className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {isCurrentUser ? (
                          <span className="absolute right-0 top-0 w-0 h-0 border-t-[16px] border-t-transparent border-l-[16px] border-l-[#A6292A] rotate-180"></span>
                        ) : (
                          <span className="absolute left-0 top-0 w-0 h-0 border-t-[16px] border-t-transparent border-r-[16px] border-r-[#f1f0f0] rotate-180"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-[#f7f7f7]">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    onClick={handleAttachmentClick}
                    aria-label="Dosya ekle"
                  >
                    <FiPaperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Choose Photo"
                  />
                  {previews.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-2 px-4 pt-4">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                          <button
                            aria-label="Remove Photo"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-700"
                            onClick={() => removeFile(idx)}
                            tabIndex={0}
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full bg-white rounded-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#A6292A] focus:border-[#A6292A] placeholder-gray-500 text-gray-900 outline-none"
                    />
                  </div>
                  <button
                    onClick={selectedFiles.length > 0 ? handleSend : handleSendMessage}
                    disabled={fileSendLoading || (!newMessage.trim() && selectedFiles.length === 0)}
                    className={`p-2 rounded-full ml-2 transition-colors ${
                      (newMessage.trim() || selectedFiles.length > 0)
                        ? 'bg-[#A6292A] text-white hover:bg-[#8a1f1f]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label="Mesajı gönder"
                  >
                    {fileSendLoading ? (
                      <span className="loader w-5 h-5" />
                    ) : (
                      <FiSend className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start Messaging
                </h3>
                <p className="text-gray-600">
                  Select a conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearMessages}
        title="Clear Messages"
        message={`Are you sure you want to clear all messages with ${selectedConversation?.user.nickname}? This action cannot be undone and messages will be removed from your view.`}
        confirmText="Clear Messages"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
