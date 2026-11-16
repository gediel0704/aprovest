package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.ParecerConteudo;

@Repository
public interface ParecerConteudoRepository extends JpaRepository<ParecerConteudo, Long> {

    List<ParecerConteudo> findByCorretorIdOrderByCriadoEmDesc(Long corretorId);

    List<ParecerConteudo> findAllByOrderByCriadoEmDesc();
}
