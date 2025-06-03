package com.example.request;

import lombok.Data;
import java.util.List;

@Data
public class SendMessageRequest {
    private Long receiverId;
    private String messageText;
    private List<String> imageBase64List;
    private Long referencedItemId; // Optional: ID of the post this message is about
    private Long replyToMessageId; // Optional: ID of the message this is replying to
} 