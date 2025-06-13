package com.example.service;

import java.util.List;
import com.example.models.User;
import com.example.request.UpdateProfileRequest;
import com.example.response.UserProfileResponse;
import org.springframework.stereotype.Service;

public interface UserService{
    User registerUser(User user);
    User findUserById(Long userId) throws Exception;
    User findUserByEmail(String uni_mail);
    User updateUser(User user, Long userId) throws Exception;
    List<User> searchUser(String query);
    User findUserByJwt(String jwt) throws Exception;
    UserProfileResponse getUserProfile(String jwt) throws Exception;
    UserProfileResponse updateUserProfile(String jwt, UpdateProfileRequest request) throws Exception;
    
    // Block/Unblock methods
    void blockUser(String jwt, Long userIdToBlock) throws Exception;
    void unblockUser(String jwt, Long userIdToUnblock) throws Exception;
    boolean isUserBlocked(Long blockerId, Long blockedId) throws Exception;
}
