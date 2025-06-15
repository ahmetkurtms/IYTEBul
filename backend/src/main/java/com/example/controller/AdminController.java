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
import com.example.repository.MessageRepository;
import com.example.models.Messages;

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
    private final MessageRepository messageRepository;

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
            System.out.println("=== BAN USER REQUEST START ===");
            System.out.println("User ID: " + userId);
            System.out.println("Ban Request: " + banRequest);
            
            User admin = validateAdmin(jwt);
            System.out.println("Admin validated: " + admin.getNickname());
            
            User user = userService.findUserById(userId);
            System.out.println("Target user found: " + user.getNickname() + " (current ban status: " + user.isCurrentlyBanned() + ")");
            
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
                System.out.println("User ban status saved to database");
                
                // Verify the user was actually saved with ban status
                User savedUser = userRepository.findById(userId).orElse(null);
                if (savedUser != null) {
                    System.out.println("Verification - User after save:");
                    System.out.println("  - Banned Status: " + savedUser.getBanned_status());
                    System.out.println("  - Currently Banned (calculated): " + savedUser.isCurrentlyBanned());
                    System.out.println("  - Ban Expires At: " + savedUser.getBanExpiresAt());
                    System.out.println("  - Ban Reason: " + savedUser.getBanReason());
                } else {
                    System.err.println("ERROR: Could not find user after save!");
                }
                
                // Update all reports for this user to ACTION_TAKEN status
                System.out.println("=== UPDATING USER REPORTS FOR BANNED USER ===");
                System.out.println("User ID: " + userId);
                List<UserReport> userReports = userReportRepository.findByUserId(userId);
                System.out.println("Found " + userReports.size() + " user reports for this user");
                
                for (UserReport report : userReports) {
                    System.out.println("Report ID: " + report.getId() + ", Current Status: " + report.getStatus());
                    if (report.getStatus() == UserReport.ReportStatus.PENDING || 
                        report.getStatus() == UserReport.ReportStatus.REVIEWED) {
                        report.setStatus(UserReport.ReportStatus.ACTION_TAKEN);
                        report.setReviewedAt(LocalDateTime.now());
                        report.setReviewedBy(admin);
                        userReportRepository.save(report);
                        System.out.println("Updated report " + report.getId() + " to ACTION_TAKEN");
                    } else {
                        System.out.println("Skipping report " + report.getId() + " - already processed");
                    }
                }
                
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
                
                System.out.println("=== BAN USER REQUEST COMPLETED SUCCESSFULLY ===");
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
                    postMap.put("isDeleted", post.getDeleted() != null ? post.getDeleted() : false);
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
            System.out.println("=== ADMIN DELETE POST START ===");
            System.out.println("Post ID: " + postId);
            
            User admin = validateAdmin(jwt);
            System.out.println("Admin validated: " + admin.getNickname());
            
            Item post = itemService.findItemByIdForAdmin(postId);
            System.out.println("Post found: " + post.getTitle());
            
            // Update all reports for this post to ACTION_TAKEN status
            List<Report> reports = reportRepository.findByPostId(postId);
            System.out.println("Found " + reports.size() + " reports for this post");
            for (Report report : reports) {
                report.setStatus(Report.ReportStatus.ACTION_TAKEN);
                report.setReviewedAt(LocalDateTime.now());
                report.setReviewedBy(admin);
                reportRepository.save(report);
            }
            
            // Soft delete: Set deleted flag to true instead of hard delete
            post.setDeleted(true);
            itemRepository.save(post);
            System.out.println("Post deleted successfully");
            
            return ResponseEntity.ok(new ApiResponse("Post deleted successfully", true));
        } catch (Exception e) {
            System.err.println("Error deleting post: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("Failed to delete post: " + e.getMessage(), false));
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
            System.out.println("=== FETCHING USER REPORTS ===");
            System.out.println("Total user reports found: " + userReports.size());
            for (UserReport report : userReports) {
                System.out.println("User Report ID: " + report.getId() + ", Status: " + report.getStatus() + ", User ID: " + report.getUser().getUser_id());
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
                // Eğer reportedMessageIds varsa, mesaj içeriklerini de ekle
                if (report.getReportedMessageIds() != null && !report.getReportedMessageIds().isEmpty()) {
                    List<Messages> reportedMessages = messageRepository.findByMessageIdIn(report.getReportedMessageIds());
                    List<Map<String, Object>> messageSummaries = new ArrayList<>();
                    for (Messages msg : reportedMessages) {
                        Map<String, Object> msgMap = new HashMap<>();
                        msgMap.put("id", msg.getMessageId());
                        msgMap.put("senderId", msg.getSender().getUser_id());
                        msgMap.put("receiverId", msg.getReceiver().getUser_id());
                        msgMap.put("content", msg.getMessageText());
                        msgMap.put("sentAt", msg.getSentAt());
                        messageSummaries.add(msgMap);
                    }
                    reportMap.put("reportedMessages", messageSummaries);
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
            if (report != null) {
                String statusStr = statusRequest.get("status");
                Report.ReportStatus newStatus = Report.ReportStatus.valueOf(statusStr.toUpperCase());
                report.setStatus(newStatus);
                report.setReviewedAt(LocalDateTime.now());
                report.setReviewedBy(admin);
                reportRepository.save(report);
                return ResponseEntity.ok(new ApiResponse("Report status updated successfully", true));
            } else {
                UserReport userReport = userReportRepository.findById(reportId).orElse(null);
                if (userReport == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse("Report not found", false));
                }
                String statusStr = statusRequest.get("status");
                UserReport.ReportStatus newStatus = UserReport.ReportStatus.valueOf(statusStr.toUpperCase());
                userReport.setStatus(newStatus);
                userReport.setReviewedAt(LocalDateTime.now());
                userReport.setReviewedBy(admin);
                userReportRepository.save(userReport);
                return ResponseEntity.ok(new ApiResponse("User report status updated successfully", true));
            }
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