package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Questao;

@Repository
public interface QuestaoRepository extends JpaRepository<Questao, Long> {

    @Query("select q from Questao q where (:vest is null or q.vestibular.id = :vest) and (:disc is null or q.disciplina.id = :disc) and (:status is null or q.codStatus = :status) and (:ano is null or q.ano = :ano) and (:busca is null or lower(q.enunciado) like lower(concat('%', :busca, '%')) or lower(q.fonteDescricao) like lower(concat('%', :busca, '%')))")
    Page<Questao> buscar(@Param("vest") Long vestibularId, @Param("disc") Long disciplinaId, @Param("status") Boolean status,
                         @Param("ano") Integer ano, @Param("busca") String busca, Pageable pageable);

    List<Questao> findByVestibularIdAndCodStatusTrue(Long vestibularId);

    long countByVestibularIdAndCodStatusTrue(Long vestibularId);

    long countByCodStatusTrue();

    @Query("select distinct q.disciplina.nome from Questao q where q.vestibular.id = :v and q.codStatus = true")
    List<String> disciplinasDoVestibular(@Param("v") Long vestibularId);

    @Query("select q from Questao q where q.totalRespostas >= :minimo order by (q.totalAcertos * 1.0 / q.totalRespostas) asc")
    List<Questao> maisErradas(@Param("minimo") int minimo, Pageable pageable);

    @Query("select q.vestibular.sigla, count(q) from Questao q where q.codStatus = true group by q.vestibular.sigla")
    List<Object[]> contarPorVestibular();
}
