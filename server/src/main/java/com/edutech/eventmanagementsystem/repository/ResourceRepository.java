package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
}
