package com.example.controller;

import com.example.response.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Arrays;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import  com.example.service.ItemService;
import com.example.models.Item;
import com.example.models.User;
import com.example.models.Location;
import com.example.models.Category;
import com.example.models.ItemType;
import com.example.config.JwtProvider;
import com.example.repository.UserRepository;
import com.example.service.LocationService;
import java.util.Base64;
import com.example.request.CreatePostRequest;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")  // Base path for all endpoints
public class ItemController {
    private final ItemService itemService;
    private final UserRepository userRepository;
    private final LocationService locationService;

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

    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getPosts(
        @RequestParam(required = false) String sortOrder,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String dateStart,
        @RequestParam(required = false) String dateEnd
    ) {
        try {
            List<String> categories = (category != null && !category.isEmpty()) ? java.util.Arrays.asList(category.split(",")) : null;
            List<String> locations = (location != null && !location.isEmpty()) ? java.util.Arrays.asList(location.split(",")) : null;
            List<Item> items = itemService.filterItems(type, categories, locations, search, sortOrder);
            
            // Apply date filtering in controller if dates are provided
            if ((dateStart != null && !dateStart.trim().isEmpty()) || (dateEnd != null && !dateEnd.trim().isEmpty())) {
                items = items.stream().filter(item -> {
                    boolean passesDateFilter = true;
                    
                    if (dateStart != null && !dateStart.trim().isEmpty()) {
                        try {
                            java.time.LocalDateTime startDateTime = java.time.LocalDate.parse(dateStart.trim()).atStartOfDay();
                            passesDateFilter = passesDateFilter && item.getDateShared().isAfter(startDateTime.minusSeconds(1));
                        } catch (Exception e) {
                            // If parsing fails, ignore start date filter
                        }
                    }
                    
                    if (dateEnd != null && !dateEnd.trim().isEmpty()) {
                        try {
                            java.time.LocalDateTime endDateTime = java.time.LocalDate.parse(dateEnd.trim()).atTime(23, 59, 59);
                            passesDateFilter = passesDateFilter && item.getDateShared().isBefore(endDateTime.plusSeconds(1));
                        } catch (Exception e) {
                            // If parsing fails, ignore end date filter
                        }
                    }
                    
                    return passesDateFilter;
                }).collect(java.util.stream.Collectors.toList());
            }
            
            List<Map<String, Object>> response = items.stream()
                .map(item -> {
                    Map<String, Object> post = new HashMap<>();
                    post.put("id", item.getItem_id());
                    post.put("title", item.getTitle());
                    post.put("description", item.getDescription());
                    post.put("type", item.getType().toString());
                    post.put("category", item.getCategory().toString());
                    post.put("location", item.getLocation() != null ? item.getLocation().getNameEn() : null);
                    post.put("createdAt", item.getDateShared().toString());
                    post.put("userName", item.getUser().getNickname());
                    post.put("userEmail", item.getUser().getUniMail());
                    post.put("userId", item.getUser().getUser_id());
                    // Add user profile photo
                    if (item.getUser().getProfilePhotoUrl() != null) {
                        post.put("userProfilePhoto", item.getUser().getProfilePhotoUrl());
                    }
                    if (item.getImage() != null) {
                        post.put("imageBase64", item.getImage());
                        post.put("imageContentType", "image/jpeg");
                    }
                    return post;
                })
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
        @RequestBody CreatePostRequest req,
        @RequestHeader("Authorization") String token
    ) {
        try {
            // Get user from token
            String userEmail = JwtProvider.getEmailFromJwtToken(token.replace("Bearer ", ""));
            User user = userRepository.findUserByUniMail(userEmail);
            if (user == null) {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }

            // Create new item
            Item item = new Item();
            item.setTitle(req.title);
            item.setDescription(req.description);
            item.setType(ItemType.valueOf(req.type));
            item.setCategory(Category.valueOf(req.category));
            // Set location
            Location locationEntity = locationService.findLocationByNameEn(req.location);
            item.setLocation(locationEntity);
            // Set image
            if (req.image != null && !req.image.isEmpty()) {
                item.setImage(req.image);
            }
            // Save item
            Item savedItem = itemService.createNewItem(item, user.getUser_id());
            return new ResponseEntity<>(savedItem, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return new ResponseEntity<>(
            Arrays.stream(Category.values())
                .map(Enum::name)
                .collect(Collectors.toList()),
            HttpStatus.OK
        );
    }

    @GetMapping("/locations")
    public ResponseEntity<List<Location>> getLocations() {
        try {
            List<Location> locations = locationService.findAllLocations();
            return new ResponseEntity<>(locations, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}