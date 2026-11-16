package com.itb.inf2cm.aprovest.model.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Notificacao;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    List<Notificacao> findTop50ByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);

    long countByUsuarioIdAndLidaFalse(Long usuarioId);

    Optional<Notificacao> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByUsuarioIdAndTipoAndCriadoEmAfter(Long usuarioId, String tipo, LocalDateTime desde);

    @Modifying
    @Query("update Notificacao n set n.lida = true where n.usuario.id = :u and n.lida = false")
    int marcarTodasLidas(@Param("u") Long usuarioId);
}
