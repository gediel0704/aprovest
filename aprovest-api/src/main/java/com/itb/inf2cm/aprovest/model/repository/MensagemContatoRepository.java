package com.itb.inf2cm.aprovest.model.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.MensagemContato;

@Repository
public interface MensagemContatoRepository extends JpaRepository<MensagemContato, Long> {

    @Query("""
            select m from MensagemContato m
            where (:status is null or m.status = :status)
              and (:busca is null or lower(m.nome) like :busca or lower(m.email) like :busca or lower(m.mensagem) like :busca)
            order by m.criadoEm desc
            """)
    Page<MensagemContato> buscar(@Param("status") String status, @Param("busca") String busca, Pageable pageable);

    long countByStatus(String status);
}
