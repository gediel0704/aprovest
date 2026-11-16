package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Redacao;

@Repository
public interface RedacaoRepository extends JpaRepository<Redacao, Long> {

    List<Redacao> findByUsuarioIdOrderByAtualizadoEmDesc(Long usuarioId);

    Optional<Redacao> findByIdAndUsuarioId(Long id, Long usuarioId);

    long countByUsuarioId(Long usuarioId);
}
