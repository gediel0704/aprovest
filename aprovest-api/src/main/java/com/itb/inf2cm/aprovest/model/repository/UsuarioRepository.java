package com.itb.inf2cm.aprovest.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itb.inf2cm.aprovest.model.entity.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByGoogleId(String googleId);

    @Query("select u from Usuario u where (:tipo is null or u.tipoUsuario = :tipo) and (:busca is null or lower(u.nome) like lower(concat('%', :busca, '%')) or lower(u.email) like lower(concat('%', :busca, '%')))")
    Page<Usuario> buscar(@Param("tipo") com.itb.inf2cm.aprovest.model.enums.TipoUsuario tipo, @Param("busca") String busca, Pageable pageable);

    long countByTipoUsuario(com.itb.inf2cm.aprovest.model.enums.TipoUsuario tipo);

    List<Usuario> findByTipoUsuarioAndCodStatusTrue(com.itb.inf2cm.aprovest.model.enums.TipoUsuario tipo);

    /** UC033: troca de papel (a coluna discriminadora não pode ser alterada via JPA). */
    @Modifying
    @Query(value = "UPDATE Usuario SET tipo_usuario = :tipo WHERE id = :id", nativeQuery = true)
    int alterarTipo(@Param("id") Long id, @Param("tipo") String tipo);
}
