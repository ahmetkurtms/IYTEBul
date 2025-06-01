package com.example.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String department;
    private String profilePhotoUrl;
    private String phoneNumber;
    private LocalDateTime createdAt;
    private String studentId;
    private String bio;
    private String nickname;
    private Boolean isBanned;
    private LocalDateTime banExpiresAt;
    private String banReason;
    private Boolean emailNotifications;
} 