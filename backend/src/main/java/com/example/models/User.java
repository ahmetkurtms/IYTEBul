package com.example.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
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

    @Enumerated(EnumType.STRING)
    private Role role;

    // Email verification fields
    private Boolean isVerified = false;
    private String verificationCode;

}
