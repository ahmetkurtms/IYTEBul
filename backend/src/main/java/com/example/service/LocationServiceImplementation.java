package com.example.service;

import com.example.models.Location;
import com.example.repository.LocationRepository;



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
}
