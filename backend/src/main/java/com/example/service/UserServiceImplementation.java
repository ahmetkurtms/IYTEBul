package com.example.service;

import com.example.models.Role;
import com.example.models.User;
import com.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImplementation implements UserService {

    private final UserRepository userRepository;

    @Override
    public User registerUser(User user) {
        try {
            User newUser = new User();
            newUser.setUser_id(user.getUser_id());
            newUser.setName(user.getName());
            newUser.setMiddle_name(user.getMiddle_name());
            newUser.setSurname(user.getSurname());
            newUser.setNickname(user.getNickname());
            newUser.setBanned_status(false);
            newUser.setUniMail(user.getUniMail());
            newUser.setPassword(user.getPassword());
            newUser.setCreated_at(LocalDateTime.now());
            newUser.setRole(Role.USER);

            return userRepository.save(newUser);
        } catch (Exception e) {
            log.error("Error occurred while registering user: ", e);
            throw new RuntimeException("Error occurred while registering user: " + e.getMessage());
        }
    }


    @Override
    public User findUserById(Long userId) throws Exception{

        Optional<User> user = userRepository.findById(userId);
        if(user.isPresent()) {
            return user.get();
        }
        throw new Exception("user not exist with userid " + userId);
    }

    @Override
    public User findUserByEmail(String uni_mail) {

        User user = userRepository.findUserByUniMail(uni_mail);
        return user;
    }

    @Override
    public User updateUser(User user, Long userId ) throws  Exception {
        Optional<User> user1 = userRepository.findById(userId);
        if(user1.isEmpty())
            throw new Exception("user not exit with id "+userId);
        User oldUser= user1.get();
        if(user.getName()!=null) {
            oldUser.setName(user.getName());
        }
        if(user.getMiddle_name()!=null) {
            oldUser.setMiddle_name(user.getMiddle_name());
        }

        if(user.getSurname()!=null){
            oldUser.setSurname(user.getSurname());

        }
        if(user.getNickname()!=null){
            oldUser.setNickname(user.getNickname());

        }

        if(user.getUniMail()!=null) {
            oldUser.setUniMail(user.getUniMail());
        }
        if(user.getBanned_status()!=null) {
            oldUser.setBanned_status(user.getBanned_status());
        }
        if(user.getRole()!=null) {
            oldUser.setRole(user.getRole());
        }


        User updatedUser = userRepository.save(oldUser);
        return updatedUser;

    }

    @Override
    public List<User> searchUser(String query) {
        return userRepository.searchUser(query);
    }

    @Override
    public User findUserByJwt() {
        // TODO: Implement JWT token extraction and user lookup
        // For now, return null as this is a placeholder implementation
        return null;
    }
}
