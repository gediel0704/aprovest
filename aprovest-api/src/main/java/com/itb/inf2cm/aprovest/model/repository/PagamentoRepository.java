package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Pagamento;

@Repository
public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    List<Pagamento> findByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);

    List<Pagamento> findByStatusOrderByCriadoEmDesc(String status);
}
