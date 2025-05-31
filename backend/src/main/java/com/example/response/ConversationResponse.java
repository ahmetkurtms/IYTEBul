package com.example.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long conversationId;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserNickname;
    private String otherUserProfilePhoto;
    private Boolean otherUserIsOnline;
    private LocalDateTime otherUserLastSeen;
    private MessageResponse lastMessage;
    private Long unreadCount;
} 