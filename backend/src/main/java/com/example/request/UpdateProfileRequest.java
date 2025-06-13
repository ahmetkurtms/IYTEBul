package com.example.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String nickname;
    private String phoneNumber;
    private String bio;
    private String studentId;
    private Boolean emailNotifications;
    private Boolean postNotifications;
} 