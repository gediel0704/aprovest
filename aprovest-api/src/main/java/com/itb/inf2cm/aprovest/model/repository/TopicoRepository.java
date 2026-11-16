package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Topico;

@Repository
public interface TopicoRepository extends JpaRepository<Topico, Long> {

    List<Topico> findByDisciplinaIdOrderByNomeAsc(Long disciplinaId);

    List<Topico> findByCodStatusTrueOrderByNomeAsc();
}
