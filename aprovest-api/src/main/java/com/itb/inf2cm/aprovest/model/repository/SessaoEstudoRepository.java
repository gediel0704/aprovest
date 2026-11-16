package com.itb.inf2cm.aprovest.model.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.SessaoEstudo;

@Repository
public interface SessaoEstudoRepository extends JpaRepository<SessaoEstudo, Long> {

    List<SessaoEstudo> findByUsuarioIdOrderByIniciadaEmDesc(Long usuarioId);

    List<SessaoEstudo> findByUsuarioIdAndVestibularIdAndModoAndStatusOrderByConcluidaEmDesc(Long usuarioId, Long vestibularId, String modo, String status);

    Optional<SessaoEstudo> findFirstByUsuarioIdAndVestibularIdAndModoAndStatusOrderByIniciadaEmDesc(Long usuarioId, Long vestibularId, String modo, String status);

    boolean existsByUsuarioIdAndVestibularIdAndModoAndStatus(Long usuarioId, Long vestibularId, String modo, String status);

    long countByUsuarioIdAndModoAndTipoSimuladoAndIniciadaEmAfter(Long usuarioId, String modo, String tipoSimulado, LocalDateTime desde);

    List<SessaoEstudo> findByVestibularIdAndModoAndTipoSimuladoAndStatusAndUsuarioIdNot(Long vestibularId, String modo, String tipoSimulado, String status, Long usuarioId);

    List<SessaoEstudo> findByStatusAndExpiraEmBefore(String status, LocalDateTime agora);

    long countByModoAndStatus(String modo, String status);
}
