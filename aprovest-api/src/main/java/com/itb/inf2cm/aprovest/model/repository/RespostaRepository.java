package com.itb.inf2cm.aprovest.model.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Resposta;

@Repository
public interface RespostaRepository extends JpaRepository<Resposta, Long> {

    List<Resposta> findBySessaoId(Long sessaoId);

    Optional<Resposta> findBySessaoIdAndQuestaoId(Long sessaoId, Long questaoId);

    @Query("select count(r) from Resposta r where r.usuario.id = :u and r.sessao.modo = 'BANCA' and r.respondidaEm >= :inicio")
    long contarBancaDesde(@Param("u") Long usuarioId, @Param("inicio") LocalDateTime inicio);

    @Query("select r.questao.id from Resposta r where r.usuario.id = :u and r.correta = true and r.respondidaEm >= :desde")
    List<Long> questoesAcertadasDesde(@Param("u") Long usuarioId, @Param("desde") LocalDateTime desde);

    @Query("select r.questao.id from Resposta r where r.usuario.id = :u")
    List<Long> questoesRespondidas(@Param("u") Long usuarioId);

    Page<Resposta> findByUsuarioIdOrderByRespondidaEmDesc(Long usuarioId, Pageable pageable);

    List<Resposta> findByUsuarioId(Long usuarioId);

    long countByUsuarioId(Long usuarioId);

    long countByUsuarioIdAndCorretaTrue(Long usuarioId);

    long countByRespondidaEmAfter(LocalDateTime desde);

    @Query("select r.questao.disciplina.nome, count(r), sum(case when r.correta = true then 1 else 0 end) from Resposta r where r.usuario.id = :u and r.questao.vestibular.id = :v group by r.questao.disciplina.nome")
    List<Object[]> desempenhoPorDisciplina(@Param("u") Long usuarioId, @Param("v") Long vestibularId);

    @Query("select r.questao.disciplina.nome, count(r), sum(case when r.correta = true then 1 else 0 end) from Resposta r where r.usuario.id = :u and r.questao.vestibular.id = :v and r.respondidaEm >= :desde group by r.questao.disciplina.nome")
    List<Object[]> desempenhoRecentePorDisciplina(@Param("u") Long usuarioId, @Param("v") Long vestibularId, @Param("desde") LocalDateTime desde);

    /** RF12: pontuação do ranking = soma da dificuldade (Elo) das questões acertadas no período / 100. */
    @Query("select r.usuario.id, r.usuario.nome, sum(r.questao.dificuldade) / 100, count(r) from Resposta r where r.correta = true and r.respondidaEm >= :inicio and r.respondidaEm < :fim and r.usuario.rankingPublico = true and r.usuario.codStatus = true group by r.usuario.id, r.usuario.nome order by sum(r.questao.dificuldade) desc")
    List<Object[]> ranking(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("select r.respondidaEm from Resposta r where r.usuario.id = :u and r.respondidaEm >= :desde")
    List<LocalDateTime> datasRespostas(@Param("u") Long usuarioId, @Param("desde") LocalDateTime desde);
}
