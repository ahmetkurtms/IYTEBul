package com.example.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.example.models.Item;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("select i from Item i where i.user.user_id=:userId")
    List<Item> findItemByUserId(Long userId);

    @Query("select i from Item i where i.user.nickname=:userNickname")
    List<Item> findItemByUserNickname(String userNickname);
}
