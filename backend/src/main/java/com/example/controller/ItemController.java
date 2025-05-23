package com.example.controller;

import com.example.response.ApiResponse;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import  com.example.service.ItemService;
import com.example.models.Item;

@RestController
@RequiredArgsConstructor
public class ItemController {
    private final ItemService itemService;


    @PostMapping("/items/user/{userId}")
    public ResponseEntity<Item> createItem(@RequestBody Item item, @PathVariable Long userId) {
        try {
            Item createdItem = itemService.createNewItem(item, userId);
            return new ResponseEntity<>(createdItem, HttpStatus.ACCEPTED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/items/{itemId}/user/{userId}")
    public ResponseEntity<ApiResponse> deleteItem(@PathVariable Long itemId, @PathVariable Long userId) {
        try {
            String message = itemService.deleteItem(itemId, userId);
            ApiResponse res = new ApiResponse(message, true);
            return new ResponseEntity<>(res, HttpStatus.OK);
        } catch (Exception e) {
            ApiResponse res = new ApiResponse("An error occurred: " + e.getMessage(), false);
            return new ResponseEntity<>(res, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<Item> findItemById(@PathVariable Long itemId){
        try {
            Item item = itemService.findItemById(itemId);
            return new ResponseEntity<>(item, HttpStatus.ACCEPTED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }


    }
    @GetMapping("/items/user/nickname/{userNickname}")
    public ResponseEntity<List<Item>> findItemByUserNickname(@PathVariable String userNickname) {
        try {
            List<Item> items = itemService.findItemByUserNickname(userNickname);
            return new ResponseEntity<>(items, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/items/user/id/{userId}")
    public ResponseEntity<List<Item>> findItemByUserId(@PathVariable Long userId) {
        try {
            List<Item> items = itemService.findItemByUserId(userId);
            return new ResponseEntity<>(items, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/items")
    public ResponseEntity<List<Item>> findAllItems() {
        try {
            List<Item> posts = itemService.findAllItems();
            return new ResponseEntity<>(posts, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }





}