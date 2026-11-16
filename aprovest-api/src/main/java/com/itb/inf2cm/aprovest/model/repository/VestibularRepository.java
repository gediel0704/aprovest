package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Vestibular;

@Repository
public interface VestibularRepository extends JpaRepository<Vestibular, Long> {

    Optional<Vestibular> findBySigla(String sigla);

    List<Vestibular> findByCodStatusTrueOrderByIdAsc();
}
