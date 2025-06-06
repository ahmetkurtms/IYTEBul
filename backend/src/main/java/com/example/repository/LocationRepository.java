package com.example.repository;

import com.example.models.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface LocationRepository extends JpaRepository<Location, Long> {


    Optional<Location> findByName(String name);

    Optional<Location> findByNameEn(String nameEn);
}