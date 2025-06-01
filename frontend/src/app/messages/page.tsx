'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { FiSearch, FiSend, FiMoreVertical, FiPaperclip, FiSmile, FiMessageCircle, FiX } from 'react-icons/fi';
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

  // Fix hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          isSent: true
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
            isSent: true
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
            isSent: true
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      // Send message to backend
      await messageApi.sendMessage(selectedConversation.user.id, newMessage.trim());

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
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter messages based on search query
  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
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

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            {connectionError ? (
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-red-400 text-3xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-semibold text-red-500 mb-4">Connection Error</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{connectionError}</p>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">To fix this issue:</p>
                  <ol className="text-sm text-gray-600 text-left space-y-2">
                    <li className="flex items-start">
                      <span className="bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                      Open terminal in backend folder
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                      Run: <code className="bg-gray-200 px-2 py-1 rounded ml-1">./gradlew bootRun</code>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                      Wait for "Started Application" message
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                      Refresh this page
                    </li>
                  </ol>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-400 border-t-transparent mx-auto mb-6"></div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Loading Messages</h3>
                <p className="text-gray-500">Please wait while we load your conversations...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-[calc(100vh-80px)] max-w-7xl mx-auto">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-medium text-gray-800">Messages</h1>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <FiMessageCircle className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all placeholder-gray-400 text-gray-700"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No conversations yet</h3>
                  <p className="text-gray-400 text-sm">Start a new conversation to begin messaging</p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={`conv-${conversation.user.id}`}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`group p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    selectedConversation?.user.id === conversation.user.id 
                      ? 'bg-gray-50 border-r-4 border-r-gray-400' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {conversation.user.profilePhotoUrl ? (
                          <Image
                            src={conversation.user.profilePhotoUrl}
                            alt={conversation.user.nickname}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium text-base">
                            {conversation.user.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {conversation.user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-800 truncate text-base">
                          {conversation.user.nickname}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-400 font-normal">
                              {formatDistanceToNow(
                                new Date(conversation.lastMessage.timestamp),
                                { addSuffix: false, locale: enUS }
                              )}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="bg-[#A6292A] text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-normal">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {conversation.lastMessage?.content || 'Start a conversation...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {selectedConversation.user.profilePhotoUrl ? (
                          <Image
                            src={selectedConversation.user.profilePhotoUrl}
                            alt={selectedConversation.user.nickname}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium text-base">
                            {selectedConversation.user.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {selectedConversation.user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <h2 className="font-medium text-gray-800 text-base">
                        {selectedConversation.user.nickname}
                      </h2>
                      <p className="text-sm font-normal">
                        {selectedConversation.user.isOnline ? (
                          <span className="text-green-500">● Online</span>
                        ) : (
                          <span className="text-gray-400">
                            Last seen {formatDistanceToNow(new Date(selectedConversation.user.lastSeen || ''), { addSuffix: true, locale: enUS })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Message Search */}
                    <button 
                      onClick={() => setShowMessageSearch(!showMessageSearch)}
                      className={`p-2 rounded-lg transition-colors ${showMessageSearch ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    >
                      <FiSearch className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    <div className="relative" ref={optionsMenuRef}>
                      <button 
                        onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FiMoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      
                      {/* Options Dropdown Menu */}
                      {showOptionsMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20">
                          <button
                            onClick={handleClearMessages}
                            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                          >
                            <span className="text-base">🗑️</span>
                            <span className="font-normal">Clear Messages</span>
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => {
                              alert(`${selectedConversation?.user.nickname} has been blocked`);
                              setShowOptionsMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center space-x-3"
                          >
                            <span className="text-base">🚫</span>
                            <span className="font-normal">Block User</span>
                          </button>
                          <button
                            onClick={() => {
                              alert(`${selectedConversation?.user.nickname} has been reported`);
                              setShowOptionsMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-orange-500 hover:bg-orange-50 transition-colors flex items-center space-x-3"
                          >
                            <span className="text-base">⚠️</span>
                            <span className="font-normal">Report User</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Message Search Bar */}
                {showMessageSearch && (
                  <div className="mt-4 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all placeholder-gray-400 text-gray-700 text-sm"
                    />
                    {messageSearchQuery && (
                      <button
                        onClick={() => setMessageSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <FiX className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {(messageSearchQuery ? filteredMessages : messages).length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {messageSearchQuery ? (
                          <FiSearch className="w-8 h-8 text-gray-400" />
                        ) : (
                          <FiMessageCircle className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        {messageSearchQuery ? 'No messages found' : 'No messages yet'}
                      </h3>
                      <p className="text-gray-500">
                        {messageSearchQuery 
                          ? 'Try searching with different keywords'
                          : 'Send a message to start the conversation'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  (messageSearchQuery ? filteredMessages : messages).map((message) => {
                    const isCurrentUser = message.senderId === currentUser?.id;
                    
                    return (
                      <div
                        key={`msg-${message.id}-${message.timestamp}`}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {/* Avatar for other user */}
                          {!isCurrentUser && (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {selectedConversation.user.profilePhotoUrl ? (
                                <Image
                                  src={selectedConversation.user.profilePhotoUrl}
                                  alt={selectedConversation.user.nickname}
                                  width={28}
                                  height={28}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-500 font-medium text-xs">
                                  {selectedConversation.user.nickname.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isCurrentUser
                                ? 'bg-[#A6292A] text-white rounded-br-md'
                                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                            <div className={`flex items-center justify-end mt-2 space-x-1 ${
                              isCurrentUser ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              <span className="text-xs font-normal">
                                {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isCurrentUser && (
                                <div className="text-xs ml-1">
                                  {message.isRead ? (
                                    <BsCheckAll className="w-3 h-3 text-blue-300" />
                                  ) : (
                                    <BsCheck className="w-3 h-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Area */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="flex items-end space-x-3">
                  {/* Attachment Button */}
                  <button className="p-2 rounded-full hover:bg-gray-50 transition-colors group flex-shrink-0">
                    <FiPaperclip className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                  
                  {/* Input Field */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent placeholder-gray-400 text-gray-700 resize-none transition-all"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-50 transition-colors">
                      <FiSmile className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                      newMessage.trim()
                        ? 'bg-[#A6292A] text-white hover:bg-[#4a5a68] hover:scale-105 active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected - Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <FiMessageCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-4">
                  Welcome to IYTEBul Messages
                </h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Select a conversation from the sidebar to start messaging, or begin a new conversation with your friends and classmates.
                </p>
                <div className="bg-white rounded-lg p-6 border border-gray-100">
                  <h4 className="font-medium text-gray-700 mb-3">Quick Tips:</h4>
                  <ul className="text-sm text-gray-500 space-y-2 text-left">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span>Use the search bar to find conversations quickly</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span>Green dot indicates when users are online</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span>Press Enter to send messages quickly</span>
                    </li>
                  </ul>
                </div>
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