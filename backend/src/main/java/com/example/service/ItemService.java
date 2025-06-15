package com.example.service;
import com.example.models.Item;
import java.util.List;
public interface ItemService {
    Item createNewItem(Item item, Long userId) throws Exception;
    String deleteItem(Long itemId, Long userId) throws  Exception;

    List<Item> findItemByUserNickname(String userNickname) throws  Exception;

    List<Item> findItemByUserId(Long userId) throws  Exception;
    Item findItemById(Long itemId) throws Exception;

    List<Item> findAllItems() throws Exception;

    List<Item> findItemByType(String type) throws Exception;

    List<Item> filterItems(String type, List<String> categories, List<String> locations, String search, String sortOrder) throws Exception;
    Item findItemByIdForAdmin(Long postId) throws Exception;
}
