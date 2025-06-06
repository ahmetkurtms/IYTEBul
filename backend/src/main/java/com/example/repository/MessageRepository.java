package com.example.repository;

import com.example.models.Messages;
import com.example.models.User;
import com.example.models.DeletedMessages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Messages, Long> {
    
    // Get all messages between two users, ordered by sent time
    @Query("SELECT m FROM Messages m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.sentAt ASC")
    List<Messages> findMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    // Get messages between two users excluding deleted ones for current user
    @Query("SELECT m FROM Messages m WHERE " +
           "((m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1)) AND " +
           "m.messageId NOT IN (SELECT dm.message.messageId FROM DeletedMessages dm WHERE dm.user = :currentUser) " +
           "ORDER BY m.sentAt ASC")
    List<Messages> findMessagesBetweenUsersExcludingDeleted(@Param("user1") User user1, 
                                                           @Param("user2") User user2, 
                                                           @Param("currentUser") User currentUser);
    
    // Get conversations for a specific user - latest message from each conversation
    @Query("SELECT m FROM Messages m WHERE m.sender = :user OR m.receiver = :user ORDER BY m.sentAt DESC")
    List<Messages> findLatestConversations(@Param("user") User user);
    
    // Get conversations excluding deleted messages for current user
    @Query("SELECT m FROM Messages m WHERE " +
           "(m.sender = :user OR m.receiver = :user) AND " +
           "m.messageId NOT IN (SELECT dm.message.messageId FROM DeletedMessages dm WHERE dm.user = :user) " +
           "ORDER BY m.sentAt DESC")
    List<Messages> findLatestConversationsExcludingDeleted(@Param("user") User user);
    
    // Count unread messages for a specific user from a specific sender
    @Query("SELECT COUNT(m) FROM Messages m WHERE m.receiver = :receiver AND m.sender = :sender AND m.isRead = false")
    Long countUnreadMessages(@Param("receiver") User receiver, @Param("sender") User sender);
    
    // Count unread messages excluding deleted ones
    @Query("SELECT COUNT(m) FROM Messages m WHERE " +
           "m.receiver = :receiver AND m.sender = :sender AND m.isRead = false AND " +
           "m.messageId NOT IN (SELECT dm.message.messageId FROM DeletedMessages dm WHERE dm.user = :receiver)")
    Long countUnreadMessagesExcludingDeleted(@Param("receiver") User receiver, @Param("sender") User sender);
    
    // Mark messages as read
    @Modifying
    @Transactional
    @Query("UPDATE Messages m SET m.isRead = true WHERE m.receiver = :receiver AND m.sender = :sender AND m.isRead = false")
    void markMessagesAsRead(@Param("receiver") User receiver, @Param("sender") User sender);
    
    // Delete all messages between two users (kept for backward compatibility, but we'll use soft delete now)
    @Modifying
    @Transactional
    @Query("DELETE FROM Messages m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1)")
    void deleteMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    List<Messages> findByMessageIdIn(List<Long> ids);
    
    // Find all messages that reply to a specific message
    @Query("SELECT m FROM Messages m WHERE m.replyToMessage.messageId = :messageId")
    List<Messages> findRepliesByMessageId(@Param("messageId") Long messageId);
} 