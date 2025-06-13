package com.example.service;

import com.example.models.Messages;
import com.example.models.User;
import com.example.models.Item;
import com.example.models.MessageImage;
import com.example.models.UserReport;
import com.example.repository.MessageRepository;
import com.example.repository.MessageImageRepository;
import com.example.repository.UserReportRepository;
import com.example.service.EmailService;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;

@Service
public class MessageServiceImplementation implements MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private MessageImageRepository messageImageRepository;
    
    @Autowired
    private UserReportRepository userReportRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserService userService;
    
    @Override
    public Messages sendMessage(User sender, User receiver, String messageText) {
        return sendMessage(sender, receiver, messageText, null, null);
    }
    
    @Override
    public Messages sendMessage(User sender, User receiver, String messageText, Item referencedItem) {
        return sendMessage(sender, receiver, messageText, referencedItem, null);
    }
    
    @Override
    public Messages sendMessage(User sender, User receiver, String messageText, Item referencedItem, Messages replyToMessage) {
        // Check if either user has blocked the other
        try {
            System.out.println("=== BLOCK CHECK DEBUG ===");
            System.out.println("Sender ID: " + sender.getUser_id() + " (" + sender.getNickname() + ")");
            System.out.println("Receiver ID: " + receiver.getUser_id() + " (" + receiver.getNickname() + ")");
            
            boolean senderBlockedReceiver = userService.isUserBlocked(sender.getUser_id(), receiver.getUser_id());
            boolean receiverBlockedSender = userService.isUserBlocked(receiver.getUser_id(), sender.getUser_id());
            
            System.out.println("Sender blocked receiver: " + senderBlockedReceiver);
            System.out.println("Receiver blocked sender: " + receiverBlockedSender);
            
            if (senderBlockedReceiver || receiverBlockedSender) {
                System.out.println("BLOCKING MESSAGE - users have blocked each other");
                throw new RuntimeException("Cannot send message - users have blocked each other");
            }
            
            System.out.println("Block check passed - allowing message");
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Cannot send message")) {
                throw e; // Re-throw block exceptions
            }
            System.err.println("Error checking block status: " + e.getMessage());
            // Continue with message sending if block check fails
        } catch (Exception e) {
            System.err.println("Error checking block status: " + e.getMessage());
            // Continue with message sending if block check fails
        }
        
        Messages message = new Messages();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessageText(messageText);
        message.setIsRead(false);
        message.setReferencedItem(referencedItem);
        message.setReplyToMessage(replyToMessage);
        
        Messages savedMessage = messageRepository.save(message);
        
        // Send email notification if this is about a post and receiver has notifications enabled
        System.out.println("=== EMAIL NOTIFICATION DEBUG ===");
        System.out.println("referencedItem: " + (referencedItem != null ? referencedItem.getTitle() : "null"));
        System.out.println("receiver.getPostNotifications(): " + (receiver.getPostNotifications()));
        System.out.println("receiver.getUniMail(): " + receiver.getUniMail());
        System.out.println("sender.getNickname(): " + sender.getNickname());
        
        if (referencedItem != null && receiver.getPostNotifications() != null && receiver.getPostNotifications()) {
            try {
                System.out.println("Attempting to send post message notification email...");
                emailService.sendPostMessageNotification(
                    receiver.getUniMail(), 
                    sender.getNickname(), 
                    referencedItem.getTitle(), 
                    messageText
                );
                System.out.println("✅ Post message notification email sent successfully to: " + receiver.getUniMail());
            } catch (Exception e) {
                System.err.println("❌ Failed to send post message notification email: " + e.getMessage());
                e.printStackTrace();
                // Don't fail the message sending if email fails
            }
        } else {
            System.out.println("❌ Email notification not sent. Reasons:");
            if (referencedItem == null) System.out.println("  - No referenced item (not about a post)");
            if (receiver.getPostNotifications() == null || !receiver.getPostNotifications()) System.out.println("  - User has post notifications disabled");
        }
        
        return savedMessage;
    }
    
    @Override
    public List<Messages> getMessagesBetweenUsers(User user1, User user2) {
        return messageRepository.findMessagesBetweenUsers(user1, user2);
    }
    
    @Override
    public List<Messages> getMessagesBetweenUsersExcludingDeleted(User user1, User user2, User currentUser) {
        // Use the new method that considers the new delete flags
        return messageRepository.findMessagesBetweenUsersExcludingDeletedForUser(user1, user2, currentUser);
    }
    
    @Override
    public List<Messages> getConversationsForUser(User user) {
        return messageRepository.findLatestConversations(user);
    }
    
    @Override
    public List<Messages> getConversationsForUserExcludingDeleted(User user) {
        try {
            List<Messages> allMessages = messageRepository.findLatestConversationsExcludingDeleted(user);
            
            if (allMessages == null || allMessages.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Group messages by conversation partner and get the latest message for each
            Map<Long, Messages> latestMessagesMap = new HashMap<>();
            
            for (Messages message : allMessages) {
                if (message == null) continue;
                
                if (message.getSender() == null || message.getReceiver() == null) {
                    System.out.println("WARNING: Message with null sender or receiver, skipping message ID: " + message.getMessageId());
                    continue;
                }
                
                Long otherUserId = message.getSender().getUser_id().equals(user.getUser_id()) 
                    ? message.getReceiver().getUser_id() 
                    : message.getSender().getUser_id();
                
                if (otherUserId == null) {
                    System.out.println("WARNING: Could not determine other user ID for message: " + message.getMessageId());
                    continue;
                }
                
                // Block kontrolü kaldırıldı - mesajlar görünmeli, sadece yeni mesaj atılamamalı
                
                if (!latestMessagesMap.containsKey(otherUserId) || 
                    (message.getSentAt() != null && latestMessagesMap.get(otherUserId).getSentAt() != null &&
                     message.getSentAt().isAfter(latestMessagesMap.get(otherUserId).getSentAt()))) {
                    latestMessagesMap.put(otherUserId, message);
                }
            }
            
            return new ArrayList<>(latestMessagesMap.values());
        } catch (Exception e) {
            System.out.println("Error in getConversationsForUserExcludingDeleted: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    @Override
    public Long countUnreadMessages(User receiver, User sender) {
        return messageRepository.countUnreadMessages(receiver, sender);
    }
    
    @Override
    public Long countUnreadMessagesExcludingDeleted(User receiver, User sender) {
        return messageRepository.countUnreadMessagesExcludingDeleted(receiver, sender);
    }
    
    @Override
    @Transactional
    public void markMessagesAsRead(User receiver, User sender) {
        messageRepository.markMessagesAsRead(receiver, sender);
    }
    
    @Override
    public Messages getMessageById(Long messageId) {
        Optional<Messages> message = messageRepository.findById(messageId);
        return message.orElse(null);
    }
    
    @Override
    @Transactional
    public void clearMessagesBetweenUsers(User currentUser, User otherUser) {
        // Get all messages between the two users
        List<Messages> messages = messageRepository.findMessagesBetweenUsers(currentUser, otherUser);
        
        // Mark each message as deleted for the current user using new flag system
        for (Messages message : messages) {
            boolean isAlreadyDeleted = false;
            
            // Check if current user is sender or receiver and if already deleted
            if (message.getSender().getUser_id().equals(currentUser.getUser_id())) {
                isAlreadyDeleted = message.getDeletedForSender();
                if (!isAlreadyDeleted) {
                    message.setDeletedForSender(true);
                    message.setDeletedAt(java.time.LocalDateTime.now());
                }
            } else if (message.getReceiver().getUser_id().equals(currentUser.getUser_id())) {
                isAlreadyDeleted = message.getDeletedForReceiver();
                if (!isAlreadyDeleted) {
                    message.setDeletedForReceiver(true);
                    message.setDeletedAt(java.time.LocalDateTime.now());
                }
            }
            
            if (!isAlreadyDeleted) {
                messageRepository.save(message);
            }
        }
    }
    
    @Override
    @Transactional
    public void deleteMessage(Long messageId, User currentUser) {
        // Keep the existing implementation for backward compatibility
        deleteMessageForEveryone(messageId, currentUser);
    }
    
    @Override
    @Transactional
    public void deleteMessageForSelf(Long messageId, User currentUser) {
        try {
            Messages message = messageRepository.findById(messageId).orElse(null);
            if (message == null) {
                System.out.println("Message not found for ID: " + messageId);
                return;
            }
            
            // Check if current user is sender or receiver
            if (!message.getSender().getUser_id().equals(currentUser.getUser_id()) && 
                !message.getReceiver().getUser_id().equals(currentUser.getUser_id())) {
                System.out.println("User not authorized to delete this message");
                return;
            }
            
            System.out.println("Deleting message for self ID: " + messageId + " by user: " + currentUser.getName());
            
            // Mark message as deleted for current user
            if (message.getSender().getUser_id().equals(currentUser.getUser_id())) {
                message.setDeletedForSender(true);
            } else {
                message.setDeletedForReceiver(true);
            }
            message.setDeletedAt(java.time.LocalDateTime.now());
            
            messageRepository.save(message);
            
            // Also delete replies for this user
            deleteRepliesForSelf(messageId, currentUser);
            
            System.out.println("Message deleted for self successfully");
            
        } catch (Exception e) {
            System.out.println("Error deleting message for self: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error deleting message for self: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public void deleteMessageForEveryone(Long messageId, User currentUser) {
        try {
            Messages message = messageRepository.findById(messageId).orElse(null);
            if (message == null) {
                System.out.println("Message not found for ID: " + messageId);
                return;
            }
            
            // Check if current user is the sender (only sender can delete for everyone)
            if (!message.getSender().getUser_id().equals(currentUser.getUser_id())) {
                System.out.println("Only sender can delete message for everyone");
                return;
            }
            
            System.out.println("Deleting message for everyone ID: " + messageId + " by user: " + currentUser.getName());
            
            // Recursive function to delete all replies to this message
            deleteMessageWithReplies(messageId);
            
            System.out.println("Message and all replies deleted for everyone successfully");
            
        } catch (Exception e) {
            System.out.println("Error deleting message for everyone: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error deleting message for everyone: " + e.getMessage());
        }
    }
    
    private void deleteRepliesForSelf(Long messageId, User currentUser) {
        try {
            // Find all replies to this message
            List<Messages> replies = messageRepository.findRepliesByMessageId(messageId);
            
            // Mark all replies as deleted for current user
            for (Messages reply : replies) {
                if (reply.getSender().getUser_id().equals(currentUser.getUser_id())) {
                    reply.setDeletedForSender(true);
                } else {
                    reply.setDeletedForReceiver(true);
                }
                reply.setDeletedAt(java.time.LocalDateTime.now());
                messageRepository.save(reply);
                
                // Recursively delete nested replies
                deleteRepliesForSelf(reply.getMessageId(), currentUser);
            }
            
        } catch (Exception e) {
            System.out.println("Error in deleteRepliesForSelf for message ID " + messageId + ": " + e.getMessage());
            throw e;
        }
    }

    private void deleteMessageWithReplies(Long messageId) {
        try {
            // Find all replies to this message
            List<Messages> replies = messageRepository.findRepliesByMessageId(messageId);
            
            // Recursively soft-delete all replies first
            for (Messages reply : replies) {
                deleteMessageWithReplies(reply.getMessageId());
            }
            
            // Now handle the original message
            Messages message = messageRepository.findById(messageId).orElse(null);
            if (message != null) {
                // Check if this message is reported - if so, use soft delete
                boolean isReported = isMessageReported(messageId);
                
                if (isReported) {
                    System.out.println("Message " + messageId + " is reported - using soft delete for admin visibility");
                    // Soft delete: Mark as deleted completely but keep in database
                    message.setIsDeletedCompletely(true);
                    message.setDeletedForSender(true);
                    message.setDeletedForReceiver(true);
                    message.setDeletedAt(java.time.LocalDateTime.now());
                    messageRepository.save(message);
                } else {
                    System.out.println("Message " + messageId + " is not reported - using hard delete");
                    // Delete any related message images
                    List<MessageImage> images = messageImageRepository.findByMessage(message);
                    for (MessageImage img : images) {
                        messageImageRepository.delete(img);
                    }
                    
                    // Hard delete the message
                    messageRepository.delete(message);
                }
                
                System.out.println("Processed message ID: " + messageId + " (reported: " + isReported + ")");
            }
            
        } catch (Exception e) {
            System.out.println("Error in deleteMessageWithReplies for message ID " + messageId + ": " + e.getMessage());
            throw e;
        }
    }
    
    private boolean isMessageReported(Long messageId) {
        try {
            // Use the efficient repository method to check if message is reported
            boolean isReported = userReportRepository.existsByReportedMessageId(messageId);
            System.out.println("Message " + messageId + " reported status: " + isReported);
            return isReported;
        } catch (Exception e) {
            System.out.println("Error checking if message is reported: " + e.getMessage());
            return false;
        }
    }
} 