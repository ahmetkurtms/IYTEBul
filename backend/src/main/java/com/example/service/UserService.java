package com.example.service;

import java.util.List;
import com.example.models.User;
import org.springframework.stereotype.Service;

public interface UserService{
    User registerUser(User user);
    User findUserById(Long userId) throws Exception;
    User findUserByEmail(String uni_mail);
    User updateUser(User user, Long userId) throws Exception;
    List<User> searchUser(String query);
    User findUserByJwt();
}
