package com.itb.inf2cm.aprovest.model.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Assinatura;

@Repository
public interface AssinaturaRepository extends JpaRepository<Assinatura, Long> {

    Optional<Assinatura> findByUsuarioId(Long usuarioId);

    @Query("select count(a) from Assinatura a where a.plano = 'PRO' and a.status = 'ATIVA' and a.fim > :agora")
    long contarProAtivos(@Param("agora") LocalDateTime agora);

    List<Assinatura> findByPlanoAndStatusAndFimBefore(String plano, String status, LocalDateTime agora);
}
