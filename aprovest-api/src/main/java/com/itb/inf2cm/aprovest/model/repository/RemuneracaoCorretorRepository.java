package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.RemuneracaoCorretor;

@Repository
public interface RemuneracaoCorretorRepository extends JpaRepository<RemuneracaoCorretor, Long> {

    List<RemuneracaoCorretor> findByCorretorIdOrderByCriadoEmDesc(Long corretorId);

    boolean existsByAvaliacaoId(Long avaliacaoId);
}
