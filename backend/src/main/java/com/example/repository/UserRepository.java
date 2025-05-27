package com.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.models.User;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    public User findUserByUniMail(String uniMail);

    public User findUserByNickname(String nickname);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.middle_name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.surname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.nickname) LIKE LOWER(CONCAT('%', :query, '%'))")
    public List<User> searchUser(@Param("query") String query);
}


