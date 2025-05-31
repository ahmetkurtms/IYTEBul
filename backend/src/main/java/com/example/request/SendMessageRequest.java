package com.example.request;

import lombok.Data;

@Data
public class SendMessageRequest {
    private Long receiverId;
    private String messageText;
} 