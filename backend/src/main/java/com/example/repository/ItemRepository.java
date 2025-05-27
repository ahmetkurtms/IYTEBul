package com.example.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.example.models.Item;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.Nullable;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("select i from Item i where i.user.user_id=:userId")
    List<Item> findItemByUserId(Long userId);

    @Query("select i from Item i where i.user.nickname=:userNickname")
    List<Item> findItemByUserNickname(String userNickname);

    @Query("select i from Item i where i.type=:type")
    List<Item> findItemByType(com.example.models.ItemType type);

    @Query("SELECT i FROM Item i WHERE (:type IS NULL OR i.type = :type) AND (:categories IS NULL OR i.category IN :categories) AND (:locations IS NULL OR i.location.nameEn IN :locations)")
    List<Item> filterItems(
        @Nullable com.example.models.ItemType type,
        @Nullable List<com.example.models.Category> categories,
        @Nullable List<String> locations
    );
}
