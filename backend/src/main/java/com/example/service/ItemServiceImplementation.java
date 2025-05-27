package com.example.service;

import java.util.List;
import com.example.models.Item;
import com.example.models.User;
import com.example.models.Location;
import com.example.repository.ItemRepository;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItemServiceImplementation implements ItemService {

    private final ItemRepository itemRepository;
    private final UserService userService;
    private final LocationService locationService;

    @Override
    public Item createNewItem(Item item, Long userId) throws Exception {

        User user = userService.findUserById(userId);
        Location location = locationService.findLocationByNameEn(item.getLocation().getNameEn());
        Item newItem = new Item();
        newItem.setItem_id(item.getItem_id());
        newItem.setDescription(item.getDescription());
        newItem.setImage(item.getImage());
        newItem.setDateShared(LocalDateTime.now());
        newItem.setDeleted(false);
        newItem.setType(item.getType());
        newItem.setCategory(item.getCategory());
        newItem.setLocation(location);
        newItem.setUser(user);
        newItem.setTitle(item.getTitle());

        return itemRepository.save(newItem);
    }

    @Override
    public String deleteItem(Long itemId, Long userId) throws  Exception {
        Item item = findItemById(itemId);
        User user = userService.findUserById(userId);

        if(item.getUser().getUser_id() != user.getUser_id()){
            throw  new Exception("Cannot delete another users post");
        }
        itemRepository.delete(item);
        return "Post deleted successfully";
    }

    @Override
    public List<Item> findItemByUserNickname(String userNickname) throws  Exception{
        List<Item> items = itemRepository.findItemByUserNickname(userNickname);
        if (items == null || items.isEmpty()) {
            throw new Exception("No items found for userNickname: " + userNickname);
        }
        return items;
    }

    @Override
    public List<Item> findItemByUserId(Long userId) throws  Exception{
        List<Item> items = itemRepository.findItemByUserId(userId);
        if (items == null || items.isEmpty()) {
            throw new Exception("No items found for userId: " + userId);
        }
        return items;
    }

    @Override
    public Item findItemById(Long itemId) throws  Exception{
        Optional<Item> item = itemRepository.findById(itemId);
        if(item.isPresent()) {
            return item.get();
        }
        throw new Exception("item not exist with itemid " + itemId);
    }

    @Override
    public List<Item> findAllItems() {
        return itemRepository.findAll();
    }

    @Override
    public List<Item> findItemByType(String type) throws Exception {
        try {
            String enumType = type.substring(0, 1).toUpperCase() + type.substring(1).toLowerCase();
            com.example.models.ItemType itemType = com.example.models.ItemType.valueOf(enumType);
            return itemRepository.findItemByType(itemType);
        } catch (IllegalArgumentException e) {
            throw new Exception("Invalid item type: " + type);
        }
    }

    @Override
    public List<Item> filterItems(String type, List<String> categories, List<String> locations) throws Exception {
        com.example.models.ItemType itemType = null;
        if (type != null && !type.isEmpty() && !type.equalsIgnoreCase("all")) {
            String enumType = type.substring(0, 1).toUpperCase() + type.substring(1).toLowerCase();
            itemType = com.example.models.ItemType.valueOf(enumType);
        }
        List<com.example.models.Category> categoryEnums = null;
        if (categories != null && !categories.isEmpty()) {
            categoryEnums = new java.util.ArrayList<>();
            for (String cat : categories) {
                categoryEnums.add(com.example.models.Category.valueOf(cat));
            }
        }
        List<String> locationNames = (locations != null && !locations.isEmpty()) ? locations : null;
        return itemRepository.filterItems(itemType, categoryEnums, locationNames);
    }
}
