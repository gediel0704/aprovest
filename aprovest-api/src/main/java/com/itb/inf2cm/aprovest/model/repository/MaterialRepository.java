package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Material;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    @Query("select m from Material m where m.codStatus = true and (:oficial is null or m.oficial = :oficial) and (:vest is null or m.vestibular is null or m.vestibular.id = :vest) and (:disc is null or m.disciplina.id = :disc) and (:tipo is null or m.tipo = :tipo) and (:busca is null or lower(m.titulo) like lower(concat('%', :busca, '%')) or lower(m.resumo) like lower(concat('%', :busca, '%'))) order by m.oficial desc, m.titulo asc")
    List<Material> buscar(@Param("oficial") Boolean oficial, @Param("vest") Long vestibularId, @Param("disc") Long disciplinaId,
                          @Param("tipo") String tipo, @Param("busca") String busca);

    List<Material> findAllByOrderByIdDesc();

    List<Material> findByDisciplinaIdAndOficialFalseAndCodStatusTrue(Long disciplinaId);
}
