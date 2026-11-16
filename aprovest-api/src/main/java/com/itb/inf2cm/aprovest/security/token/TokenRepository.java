package com.itb.inf2cm.aprovest.security.token;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    @Query("""
        select t from Token t inner join Usuario u on t.usuario.id = u.id
        where u.id = :id and (t.expired = false or t.revoked = false)
       """)
    List<Token> findAllValidTokenByUser(Long id);

    Optional<Token> findByToken(String token);
}
