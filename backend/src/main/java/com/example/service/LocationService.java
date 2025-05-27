package com.example.service;
import com.example.models.Location;
import java.util.List;
public interface LocationService {
    Location findLocationByName(String name);
    List<Location> findAllLocations();
    Location findLocationByNameEn(String nameEn);
}
