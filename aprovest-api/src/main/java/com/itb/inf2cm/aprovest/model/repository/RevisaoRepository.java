package com.itb.inf2cm.aprovest.model.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Revisao;

@Repository
public interface RevisaoRepository extends JpaRepository<Revisao, Long> {

    Optional<Revisao> findByUsuarioIdAndQuestaoId(Long usuarioId, Long questaoId);

    List<Revisao> findByUsuarioIdAndProximaRevisaoLessThanEqualOrderByProximaRevisaoAsc(Long usuarioId, LocalDate data);

    long countByUsuarioIdAndProximaRevisaoLessThanEqual(Long usuarioId, LocalDate data);
}
