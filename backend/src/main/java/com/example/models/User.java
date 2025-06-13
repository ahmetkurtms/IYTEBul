package com.example.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "users_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long user_id;
    private String name;
    private String middle_name;
    private String surname;
    private String nickname;

    @Column(name = "uni_mail")
    private String uniMail;

    private String password;
    private LocalDateTime created_at;
    private Boolean banned_status;

    // Ban related fields
    private LocalDateTime banExpiresAt;
    
    @Column(columnDefinition = "TEXT")
    private String banReason;

    @Enumerated(EnumType.STRING)
    private Role role;

    // Email verification fields
    private Boolean isVerified = false;
    private String verificationCode;

    // Profile fields
    private String phoneNumber;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    @Column(columnDefinition = "TEXT")
    private String profilePhotoUrl;
    
    private String studentId;
    private String department;

    // Email notification preference (default true)
    private Boolean emailNotifications = true;
    
    // Post interaction notification preference (default true)
    private Boolean postNotifications = true;

    // Blocked users relationship - users that this user has blocked
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_blocks",
        joinColumns = @JoinColumn(name = "blocker_id"),
        inverseJoinColumns = @JoinColumn(name = "blocked_id")
    )
    private java.util.Set<User> blockedUsers = new java.util.HashSet<>();

    // Getter and setter for blocked users
    public java.util.Set<User> getBlockedUsers() {
        return blockedUsers;
    }

    public void setBlockedUsers(java.util.Set<User> blockedUsers) {
        this.blockedUsers = blockedUsers;
    }

    // Helper method to check if user is currently banned
    public boolean isCurrentlyBanned() {
        if (!Boolean.TRUE.equals(banned_status)) {
            return false;
        }
        
        // If no expiry date, ban is permanent
        if (banExpiresAt == null) {
            return true;
        }
        
        // Get current time in Turkey timezone and convert to LocalDateTime for comparison
        ZonedDateTime nowTurkey = ZonedDateTime.now(ZoneId.of("Europe/Istanbul"));
        LocalDateTime nowLocal = nowTurkey.toLocalDateTime();
        
        // Check if ban has expired
        return nowLocal.isBefore(banExpiresAt);
    }

}
