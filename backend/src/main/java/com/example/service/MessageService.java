package com.example.service;

import com.example.models.Messages;
import com.example.models.User;
import com.example.models.Item;

import java.util.List;

public interface MessageService {
    
    // Send a new message
    Messages sendMessage(User sender, User receiver, String messageText);
    
    // Send a new message with referenced item
    Messages sendMessage(User sender, User receiver, String messageText, Item referencedItem);
    
    // Send a new message with referenced item and reply
    Messages sendMessage(User sender, User receiver, String messageText, Item referencedItem, Messages replyToMessage);
    
    // Get all messages between two users
    List<Messages> getMessagesBetweenUsers(User user1, User user2);
    
    // Get all messages between two users excluding deleted ones for current user
    List<Messages> getMessagesBetweenUsersExcludingDeleted(User user1, User user2, User currentUser);
    
    // Get conversations for a user (latest message from each conversation)
    List<Messages> getConversationsForUser(User user);
    
    // Get conversations for a user excluding deleted messages
    List<Messages> getConversationsForUserExcludingDeleted(User user);
    
    // Count unread messages from a specific sender to receiver
    Long countUnreadMessages(User receiver, User sender);
    
    // Count unread messages excluding deleted ones
    Long countUnreadMessagesExcludingDeleted(User receiver, User sender);
    
    // Mark messages as read
    void markMessagesAsRead(User receiver, User sender);
    
    // Get a message by ID
    Messages getMessageById(Long messageId);
    
    // Clear all messages between two users (soft delete - only for current user)
    void clearMessagesBetweenUsers(User currentUser, User otherUser);
    
    // Delete a specific message by ID (hard delete - removes from both sides)
    void deleteMessage(Long messageId, User currentUser);
    
    // Delete message for current user only (soft delete)
    void deleteMessageForSelf(Long messageId, User currentUser);
    
    // Delete message for everyone (hard delete)
    void deleteMessageForEveryone(Long messageId, User currentUser);
} 