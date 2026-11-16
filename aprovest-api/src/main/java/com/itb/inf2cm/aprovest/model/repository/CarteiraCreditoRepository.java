package com.itb.inf2cm.aprovest.model.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.CarteiraCredito;

@Repository
public interface CarteiraCreditoRepository extends JpaRepository<CarteiraCredito, Long> {

    Optional<CarteiraCredito> findByUsuarioId(Long usuarioId);
}
