package com.example.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.example.models.Item;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.Nullable;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("select i from Item i where i.user.user_id=:userId AND (i.deleted = false OR i.deleted IS NULL)")
    List<Item> findItemByUserId(Long userId);

    @Query("select i from Item i where i.user.nickname=:userNickname AND (i.deleted = false OR i.deleted IS NULL)")
    List<Item> findItemByUserNickname(String userNickname);

    @Query("select i from Item i where i.type=:type AND (i.deleted = false OR i.deleted IS NULL)")
    List<Item> findItemByType(com.example.models.ItemType type);

    @Query("SELECT i FROM Item i WHERE (i.deleted = false OR i.deleted IS NULL) AND (:type IS NULL OR i.type = :type) AND (:categories IS NULL OR i.category IN :categories) AND (:locations IS NULL OR i.location.nameEn IN :locations) AND (:search IS NULL OR :search = '' OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY " +
           "CASE WHEN :sortOrder = 'asc' THEN i.dateShared END ASC, " +
           "CASE WHEN :sortOrder = 'desc' THEN i.dateShared END DESC")
    List<Item> filterItems(
        @Nullable com.example.models.ItemType type,
        @Nullable List<com.example.models.Category> categories,
        @Nullable List<String> locations,
        @Nullable String search,
        @Nullable String sortOrder
    );
}
