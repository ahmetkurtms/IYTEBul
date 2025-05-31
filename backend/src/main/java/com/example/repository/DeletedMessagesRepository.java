package com.example.repository;

import com.example.models.DeletedMessages;
import com.example.models.Messages;
import com.example.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeletedMessagesRepository extends JpaRepository<DeletedMessages, Long> {
    
    // Check if a message is deleted for a specific user
    @Query("SELECT COUNT(dm) > 0 FROM DeletedMessages dm WHERE dm.message = :message AND dm.user = :user")
    boolean isMessageDeletedForUser(@Param("message") Messages message, @Param("user") User user);
    
    // Get all deleted message IDs for a specific user
    @Query("SELECT dm.message.messageId FROM DeletedMessages dm WHERE dm.user = :user")
    List<Long> getDeletedMessageIdsForUser(@Param("user") User user);
    
    // Get deleted messages between two users for a specific user
    @Query("SELECT dm FROM DeletedMessages dm WHERE dm.user = :user AND " +
           "((dm.message.sender = :user1 AND dm.message.receiver = :user2) OR " +
           "(dm.message.sender = :user2 AND dm.message.receiver = :user1))")
    List<DeletedMessages> getDeletedMessagesBetweenUsersForUser(@Param("user") User user, 
                                                               @Param("user1") User user1, 
                                                               @Param("user2") User user2);
} 