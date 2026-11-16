package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.LeituraMaterial;

@Repository
public interface LeituraMaterialRepository extends JpaRepository<LeituraMaterial, Long> {

    Optional<LeituraMaterial> findByUsuarioIdAndMaterialId(Long usuarioId, Long materialId);

    List<LeituraMaterial> findByUsuarioId(Long usuarioId);
}
