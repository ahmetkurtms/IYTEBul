package com.example.controller;

import com.example.config.JwtProvider;
import com.example.models.Role;
import com.example.models.User;
import com.example.models.Item;
import com.example.repository.UserRepository;
import com.example.repository.ItemRepository;
import com.example.service.UserService;
import com.example.service.ItemService;
import com.example.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final UserService userService;
    private final ItemService itemService;

    // Check if user is admin
    private User validateAdmin(String jwt) throws Exception {
        String email = JwtProvider.getEmailFromJwtToken(jwt.replace("Bearer ", ""));
        User user = userRepository.findUserByUniMail(email);
        if (user == null) {
            throw new Exception("User not found");
        }
        if (user.getRole() != Role.ADMIN) {
            throw new Exception("Access denied: Admin role required");
        }
        return user;
    }

    // User Management APIs
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(@RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> response = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getUser_id());
                    userMap.put("name", user.getName() + " " + user.getSurname());
                    userMap.put("nickname", user.getNickname());
                    userMap.put("email", user.getUniMail());
                    userMap.put("department", user.getDepartment() != null ? user.getDepartment() : "Unknown");
                    userMap.put("createdAt", user.getCreated_at().toString());
                    userMap.put("isBanned", user.getBanned_status());
                    userMap.put("isVerified", user.getIsVerified());
                    userMap.put("profilePhotoUrl", user.getProfilePhotoUrl());
                    userMap.put("role", user.getRole().toString());
                    return userMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PutMapping("/users/{userId}/ban")
    public ResponseEntity<ApiResponse> banUser(@PathVariable Long userId, @RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            User user = userService.findUserById(userId);
            user.setBanned_status(!user.getBanned_status());
            userRepository.save(user);
            
            String message = user.getBanned_status() ? "User banned successfully" : "User unbanned successfully";
            return ResponseEntity.ok(new ApiResponse(message, true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(e.getMessage(), false));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long userId, @RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            User user = userService.findUserById(userId);
            userRepository.delete(user);
            
            return ResponseEntity.ok(new ApiResponse("User deleted successfully", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(e.getMessage(), false));
        }
    }

    // Post Management APIs
    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getAllPosts(@RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            List<Item> posts = itemRepository.findAll();
            List<Map<String, Object>> response = posts.stream()
                .map(post -> {
                    Map<String, Object> postMap = new HashMap<>();
                    postMap.put("id", post.getItem_id());
                    postMap.put("title", post.getTitle());
                    postMap.put("description", post.getDescription());
                    postMap.put("type", post.getType().toString());
                    postMap.put("category", post.getCategory().toString());
                    postMap.put("location", post.getLocation() != null ? post.getLocation().getNameEn() : "Unknown");
                    postMap.put("createdAt", post.getDateShared().toString());
                    postMap.put("userName", post.getUser().getNickname());
                    postMap.put("userEmail", post.getUser().getUniMail());
                    postMap.put("imageBase64", post.getImage());
                    postMap.put("reportCount", 0); // TODO: Implement report system
                    return postMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse> deletePost(@PathVariable Long postId, @RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            Item post = itemService.findItemById(postId);
            itemRepository.delete(post);
            
            return ResponseEntity.ok(new ApiResponse("Post deleted successfully", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(e.getMessage(), false));
        }
    }

    // Statistics APIs
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats(@RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userRepository.count());
            stats.put("totalPosts", itemRepository.count());
            stats.put("bannedUsers", userRepository.findAll().stream().mapToLong(u -> u.getBanned_status() ? 1 : 0).sum());
            stats.put("lostItems", itemRepository.findAll().stream().mapToLong(i -> i.getType().toString().equals("Lost") ? 1 : 0).sum());
            stats.put("foundItems", itemRepository.findAll().stream().mapToLong(i -> i.getType().toString().equals("Found") ? 1 : 0).sum());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }
} 