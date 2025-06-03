package com.example.controller;

import com.example.config.JwtProvider;
import com.example.models.Role;
import com.example.models.User;
import com.example.models.Item;
import com.example.models.Report;
import com.example.repository.UserRepository;
import com.example.repository.ItemRepository;
import com.example.repository.ReportRepository;
import com.example.repository.UserReportRepository;
import com.example.models.UserReport;
import com.example.service.UserService;
import com.example.service.ItemService;
import com.example.service.EmailService;
import com.example.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ReportRepository reportRepository;
    private final UserReportRepository userReportRepository;
    private final UserService userService;
    private final ItemService itemService;
    private final EmailService emailService;

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
                    userMap.put("name", user.getName());
                    userMap.put("surname", user.getSurname());
                    userMap.put("nickname", user.getNickname());
                    userMap.put("email", user.getUniMail());
                    userMap.put("department", user.getDepartment() != null ? user.getDepartment() : "Unknown");
                    userMap.put("phoneNumber", user.getPhoneNumber());
                    userMap.put("studentId", user.getStudentId());
                    userMap.put("bio", user.getBio());
                    userMap.put("createdAt", user.getCreated_at().toString());
                    userMap.put("isBanned", user.isCurrentlyBanned());
                    userMap.put("isVerified", user.getIsVerified());
                    userMap.put("profilePhotoUrl", user.getProfilePhotoUrl());
                    userMap.put("role", user.getRole().toString());
                    
                    if (user.getBanExpiresAt() != null) {
                        userMap.put("banExpiresAt", user.getBanExpiresAt().toString());
                    }
                    if (user.getBanReason() != null) {
                        userMap.put("banReason", user.getBanReason());
                    }
                    
                    return userMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PutMapping("/users/{userId}/ban")
    public ResponseEntity<ApiResponse> banUser(
            @PathVariable Long userId, 
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, String> banRequest) {
        try {
            validateAdmin(jwt);
            
            User user = userService.findUserById(userId);
            
            if (user.isCurrentlyBanned()) {
                // Unban user
                user.setBanned_status(false);
                user.setBanExpiresAt(null);
                user.setBanReason(null);
                userRepository.save(user);
                return ResponseEntity.ok(new ApiResponse("User unbanned successfully", true));
            } else {
                // Ban user
                user.setBanned_status(true);
                
                LocalDateTime banExpiresAt = null;
                boolean isPermanent = true;
                String banReason = null;
                
                // Set ban expiry if provided
                if (banRequest != null && banRequest.containsKey("banExpiresAt")) {
                    String expiryStr = banRequest.get("banExpiresAt");
                    if (expiryStr != null && !expiryStr.isEmpty()) {
                        try {
                            // Parse the ISO string and convert to Turkey timezone
                            ZonedDateTime utcTime = ZonedDateTime.parse(expiryStr + "Z");
                            ZonedDateTime turkeyTime = utcTime.withZoneSameInstant(ZoneId.of("Europe/Istanbul"));
                            banExpiresAt = turkeyTime.toLocalDateTime();
                            user.setBanExpiresAt(banExpiresAt);
                            isPermanent = false;
                        } catch (Exception e) {
                            // If parsing fails, set permanent ban
                            user.setBanExpiresAt(null);
                            isPermanent = true;
                        }
                    }
                }
                
                // Set ban reason if provided
                if (banRequest != null && banRequest.containsKey("banReason")) {
                    banReason = banRequest.get("banReason");
                    user.setBanReason(banReason);
                }
                
                userRepository.save(user);
                
                // Send ban notification email only if user has email notifications enabled
                if (Boolean.TRUE.equals(user.getEmailNotifications())) {
                    try {
                        // Convert ban expiry to Turkey timezone for email
                        String banExpiryStr;
                        if (banExpiresAt != null) {
                            ZonedDateTime banExpiryTurkey = banExpiresAt.atZone(ZoneId.of("Europe/Istanbul"));
                            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm", Locale.forLanguageTag("tr-TR"));
                            banExpiryStr = banExpiryTurkey.format(formatter);
                        } else {
                            banExpiryStr = "Kalıcı"; // Permanent
                        }
                        
                        emailService.sendBanNotification(user.getUniMail(), user.getNickname(), banReason, banExpiryStr);
                    } catch (Exception emailError) {
                        // Log email error but don't fail the ban operation
                        System.err.println("Failed to send ban notification email: " + emailError.getMessage());
                    }
                }
                
                return ResponseEntity.ok(new ApiResponse("User banned successfully", true));
            }
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
                    postMap.put("reportCount", reportRepository.countByPostId(post.getItem_id()));
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
            User admin = validateAdmin(jwt);
            
            Item post = itemService.findItemById(postId);
            
            // Update all reports for this post to ACTION_TAKEN status
            List<Report> reports = reportRepository.findByPostId(postId);
            for (Report report : reports) {
                report.setStatus(Report.ReportStatus.ACTION_TAKEN);
                report.setReviewedAt(LocalDateTime.now());
                report.setReviewedBy(admin);
                reportRepository.save(report);
            }
            
            // Delete the post
            itemRepository.delete(post);
            
            return ResponseEntity.ok(new ApiResponse("Post deleted successfully", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse(e.getMessage(), false));
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
            stats.put("totalReports", reportRepository.count());
            stats.put("pendingReports", reportRepository.findByStatusOrderByCreatedAtDesc(Report.ReportStatus.PENDING).size());
            stats.put("bannedUsers", userRepository.findAll().stream().mapToLong(u -> u.isCurrentlyBanned() ? 1 : 0).sum());
            stats.put("lostItems", itemRepository.findAll().stream().mapToLong(i -> i.getType().toString().equals("Lost") ? 1 : 0).sum());
            stats.put("foundItems", itemRepository.findAll().stream().mapToLong(i -> i.getType().toString().equals("Found") ? 1 : 0).sum());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    // Report Management APIs
    @GetMapping("/reports")
    public ResponseEntity<List<Map<String, Object>>> getAllReports(@RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            List<Map<String, Object>> response = new java.util.ArrayList<>();
            // Post reports
            List<Report> reports = reportRepository.findAllByOrderByCreatedAtDesc();
            for (Report report : reports) {
                Map<String, Object> reportMap = new java.util.HashMap<>();
                reportMap.put("id", report.getId());
                reportMap.put("type", "post");
                reportMap.put("postId", report.getPost().getItem_id());
                reportMap.put("postTitle", report.getPost().getTitle());
                reportMap.put("postType", report.getPost().getType().toString());
                reportMap.put("reporterId", report.getReporter().getUser_id());
                reportMap.put("reporterName", report.getReporter().getNickname());
                reportMap.put("reporterEmail", report.getReporter().getUniMail());
                reportMap.put("reason", report.getReason());
                reportMap.put("description", report.getDescription());
                reportMap.put("status", report.getStatus().toString());
                reportMap.put("createdAt", report.getCreatedAt().toString());
                if (report.getReviewedAt() != null) {
                    reportMap.put("reviewedAt", report.getReviewedAt().toString());
                }
                if (report.getReviewedBy() != null) {
                    reportMap.put("reviewedBy", report.getReviewedBy().getNickname());
                }
                response.add(reportMap);
            }
            // User reports
            List<UserReport> userReports = userReportRepository.findAllByOrderByCreatedAtDesc();
            for (UserReport report : userReports) {
                Map<String, Object> reportMap = new java.util.HashMap<>();
                reportMap.put("id", report.getId());
                reportMap.put("type", "user");
                reportMap.put("userId", report.getUser().getUser_id());
                reportMap.put("userNickname", report.getUser().getNickname());
                reportMap.put("userEmail", report.getUser().getUniMail());
                reportMap.put("reporterId", report.getReporter().getUser_id());
                reportMap.put("reporterName", report.getReporter().getNickname());
                reportMap.put("reporterEmail", report.getReporter().getUniMail());
                reportMap.put("reason", report.getReason());
                reportMap.put("description", report.getDescription());
                reportMap.put("status", report.getStatus().toString());
                reportMap.put("createdAt", report.getCreatedAt().toString());
                if (report.getReviewedAt() != null) {
                    reportMap.put("reviewedAt", report.getReviewedAt().toString());
                }
                if (report.getReviewedBy() != null) {
                    reportMap.put("reviewedBy", report.getReviewedBy().getNickname());
                }
                response.add(reportMap);
            }
            // Hepsini birleştirip tarihe göre sırala (en yeni en üstte)
            response.sort((a, b) -> b.get("createdAt").toString().compareTo(a.get("createdAt").toString()));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @PutMapping("/reports/{reportId}/status")
    public ResponseEntity<ApiResponse> updateReportStatus(
            @PathVariable Long reportId, 
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, String> statusRequest) {
        try {
            User admin = validateAdmin(jwt);
            
            Report report = reportRepository.findById(reportId).orElse(null);
            if (report == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("Report not found", false));
            }
            
            String statusStr = statusRequest.get("status");
            Report.ReportStatus newStatus = Report.ReportStatus.valueOf(statusStr.toUpperCase());
            
            report.setStatus(newStatus);
            report.setReviewedAt(LocalDateTime.now());
            report.setReviewedBy(admin);
            
            reportRepository.save(report);
            
            return ResponseEntity.ok(new ApiResponse("Report status updated successfully", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse(e.getMessage(), false));
        }
    }

    @DeleteMapping("/reports/{reportId}")
    public ResponseEntity<ApiResponse> deleteReport(@PathVariable Long reportId, @RequestHeader("Authorization") String jwt) {
        try {
            validateAdmin(jwt);
            
            Report report = reportRepository.findById(reportId).orElse(null);
            if (report == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse("Report not found", false));
            }
            
            reportRepository.delete(report);
            
            return ResponseEntity.ok(new ApiResponse("Report deleted successfully", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse(e.getMessage(), false));
        }
    }
} 