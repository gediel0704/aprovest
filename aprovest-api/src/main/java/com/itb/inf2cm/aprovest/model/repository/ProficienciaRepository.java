package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Proficiencia;

@Repository
public interface ProficienciaRepository extends JpaRepository<Proficiencia, Long> {

    List<Proficiencia> findByUsuarioId(Long usuarioId);

    Optional<Proficiencia> findByUsuarioIdAndTopicoId(Long usuarioId, Long topicoId);
}
