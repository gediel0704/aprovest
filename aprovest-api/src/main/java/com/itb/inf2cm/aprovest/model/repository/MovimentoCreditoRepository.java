package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.MovimentoCredito;

@Repository
public interface MovimentoCreditoRepository extends JpaRepository<MovimentoCredito, Long> {

    List<MovimentoCredito> findByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);
}
