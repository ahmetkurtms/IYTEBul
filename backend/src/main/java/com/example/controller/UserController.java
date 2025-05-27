package com.example.controller;

import com.example.models.User;
import com.example.repository.UserRepository;
import com.example.request.UpdateProfileRequest;
import com.example.response.UserProfileResponse;
import com.example.service.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserController {


    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/api/users/{user_id}")
    public ResponseEntity<User> getUserById(@PathVariable("user_id") Long id) {
        try {
            User user = userService.findUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); // 404 NOT FOUND
        }
    }

    @GetMapping("/api/users/email/{uni_mail}")
    public ResponseEntity<User> getUserByEmail(@PathVariable("uni_mail") String mail) {
        try {
            User user = userService.findUserByEmail(mail);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); // 404 NOT FOUND
        }
    }


    @GetMapping("/api/users")
    public List<User> getUsers(){
        List<User> userList = userRepository.findAll();
        return userList;
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user){
        User savedUser=userService.registerUser(user);
        return  savedUser;


    }

    @PutMapping("/api/users/{userId}")
    public User updateUser(@RequestBody User user, @PathVariable Long userId) throws Exception {
        User updatedUser =userService.updateUser(user, userId);
        return updatedUser;

    // MUST BE IN ADMIN CONTROLLER

    }
    @GetMapping("/api/admin/search")
    public List<User> searchUser(@RequestParam("query") String query) {
        List<User> users = userService.searchUser(query);
        return users;

    }

    @GetMapping("/api/v1/users/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(@RequestHeader("Authorization") String jwt){
        try {
            UserProfileResponse profile = userService.getUserProfile(jwt);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }

    @PutMapping("/api/v1/users/profile")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @RequestHeader("Authorization") String jwt,
            @RequestBody UpdateProfileRequest request) {
        try {
            UserProfileResponse updatedProfile = userService.updateUserProfile(jwt, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PostMapping("/api/v1/users/profile/photo")
    public ResponseEntity<UserProfileResponse> updateProfilePhoto(
            @RequestHeader("Authorization") String jwt,
            @RequestParam("profilePhoto") MultipartFile file) {
        try {
            System.out.println("Profile photo upload request received");
            System.out.println("File name: " + (file != null ? file.getOriginalFilename() : "null"));
            System.out.println("File size: " + (file != null ? file.getSize() : "null"));
            System.out.println("Content type: " + (file != null ? file.getContentType() : "null"));
            
            // File validation
            if (file == null || file.isEmpty()) {
                System.out.println("Error: File is empty or null");
                return ResponseEntity.badRequest().body(null);
            }
            
            // Check file size (5MB limit)
            if (file.getSize() > 5 * 1024 * 1024) {
                System.out.println("Error: File size too large: " + file.getSize());
                return ResponseEntity.badRequest().body(null);
            }
            
            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                System.out.println("Error: Invalid content type: " + contentType);
                return ResponseEntity.badRequest().body(null);
            }
            
            System.out.println("File validation passed, processing...");
            
            // Convert to base64 and save
            byte[] fileBytes = file.getBytes();
            String base64Image = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(fileBytes);
            
            System.out.println("Base64 conversion completed, finding user...");
            
            User user = userService.findUserByJwt(jwt);
            if (user == null) {
                System.out.println("Error: User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
            
            System.out.println("User found: " + user.getUniMail() + ", updating profile photo...");
            
            user.setProfilePhotoUrl(base64Image);
            userRepository.save(user);
            
            System.out.println("Profile photo updated successfully");
            
            UserProfileResponse updatedProfile = userService.getUserProfile(jwt);
            return ResponseEntity.ok(updatedProfile);
            
        } catch (Exception e) {
            System.err.println("Error updating profile photo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

}
