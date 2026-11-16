package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.SolicitacaoLgpd;

@Repository
public interface SolicitacaoLgpdRepository extends JpaRepository<SolicitacaoLgpd, Long> {

    List<SolicitacaoLgpd> findAllByOrderByCriadoEmDesc();

    List<SolicitacaoLgpd> findByUsuario_IdOrderByCriadoEmDesc(Long usuarioId);

    boolean existsByUsuario_IdAndTipoAndStatus(Long usuarioId, String tipo, String status);
}
