package com.example.service;

import com.example.models.Location;
import com.example.repository.LocationRepository;
import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;



import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
@RequiredArgsConstructor
public class LocationServiceImplementation implements LocationService{

    private final LocationRepository locationRepository;


    @Override
    public Location findLocationByName(String name) {

        return locationRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Location not found: " + name));
    }

    @Override
    public List<Location> findAllLocations() {
        return locationRepository.findAll();
    }

    @Override
    public Location findLocationByNameEn(String nameEn) {
        return locationRepository.findByNameEn(nameEn)
                .orElseThrow(() -> new RuntimeException("Location not found: " + nameEn));
    }
}
