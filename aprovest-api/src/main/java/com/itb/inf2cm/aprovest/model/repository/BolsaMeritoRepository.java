package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.BolsaMerito;

@Repository
public interface BolsaMeritoRepository extends JpaRepository<BolsaMerito, Long> {

    boolean existsByMesReferencia(String mesReferencia);

    List<BolsaMerito> findByMesReferenciaOrderByPosicaoAsc(String mesReferencia);

    List<BolsaMerito> findByUsuarioIdOrderByConcedidaEmDesc(Long usuarioId);

    List<BolsaMerito> findTop200ByOrderByConcedidaEmDescPosicaoAsc();
}
