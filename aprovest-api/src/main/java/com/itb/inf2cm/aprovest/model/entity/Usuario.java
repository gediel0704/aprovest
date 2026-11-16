package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Usuário do sistema. Segue o padrão do projeto modelo: herança em tabela única
 * (SINGLE_TABLE) e a coluna "tipo_usuario" identifica Aluno, Corretor ou Admin.
 */
@Entity
@Table(name = "Usuario")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_usuario", discriminatorType = DiscriminatorType.STRING)
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public abstract class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 120)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 250)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", insertable = false, updatable = false)
    private TipoUsuario tipoUsuario;

    private LocalDate dataNascimento;
    private String cursoAlvo;
    private String universidadeAlvo;
    private String vestibularesAlvo;

    @JsonIgnore
    private String googleId;

    private String tema = "claro";
    private String tamanhoFonte = "normal";
    private boolean notifBanca = true;
    private boolean notifRedacao = true;
    private boolean notifSimulado = true;
    private boolean notifNovidades = true;
    private boolean rankingPublico = true;
    private boolean onboardingConcluido;

    @JsonIgnore
    private int tentativasFalhas;
    @JsonIgnore
    private LocalDateTime bloqueadoAte;

    private LocalDateTime criadoEm = LocalDateTime.now();
    private boolean codStatus = true;

    // ------------------------------------------------------------------
    // UserDetails (Spring Security)
    // ------------------------------------------------------------------
    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return getTipo().getAuthorities();
    }

    /** Tipo calculado pela própria subclasse (útil antes de a entidade ser recarregada do banco). */
    @JsonIgnore
    public abstract TipoUsuario getTipo();

    @Override
    @JsonIgnore
    public String getUsername() {
        return email;
    }

    @Override
    @JsonIgnore
    public String getPassword() {
        return password;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return bloqueadoAte == null || bloqueadoAte.isBefore(LocalDateTime.now());
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return codStatus;
    }
}
