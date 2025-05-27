package com.example.controller;

import com.example.models.User;
import com.example.repository.UserRepository;
import com.example.service.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

    @GetMapping("/api/users/profile")
    public User getUserFromToken(@RequestHeader("Authorization") String jwt){
        //String email =
        //System.out.println("jwt -----" + jwt);
        return null;
    }






}
