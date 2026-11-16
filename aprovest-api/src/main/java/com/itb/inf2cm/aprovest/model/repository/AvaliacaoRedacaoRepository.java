package com.itb.inf2cm.aprovest.model.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.AvaliacaoRedacao;

@Repository
public interface AvaliacaoRedacaoRepository extends JpaRepository<AvaliacaoRedacao, Long> {

    List<AvaliacaoRedacao> findByUsuarioIdOrderBySolicitadaEmDesc(Long usuarioId);

    List<AvaliacaoRedacao> findByRedacao_IdOrderBySolicitadaEmDesc(Long redacaoId);

    long countByUsuarioIdAndTipoAndStatusNotAndSolicitadaEmAfter(Long usuarioId, String tipo, String status, LocalDateTime desde);

    boolean existsByUsuarioIdAndStatus(Long usuarioId, String status);

    boolean existsByRedacao_IdAndTipoAndStatusIn(Long redacaoId, String tipo, List<String> status);

    List<AvaliacaoRedacao> findByTipoAndStatusInOrderBySolicitadaEmAsc(String tipo, List<String> status);

    List<AvaliacaoRedacao> findByCorretorIdAndStatusInOrderByPrazoAsc(Long corretorId, List<String> status);

    List<AvaliacaoRedacao> findByCorretorIdAndStatusOrderByConcluidaEmDesc(Long corretorId, String status);

    long countByTipoAndStatus(String tipo, String status);

    List<AvaliacaoRedacao> findByStatusAndSolicitadaEmBefore(String status, LocalDateTime antes);
}
