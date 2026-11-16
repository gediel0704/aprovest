package com.itb.inf2cm.aprovest.security.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * RNF07 - Rate limiting: no máximo 20 requisições por minuto, por IP,
 * nos endpoints de autenticação (login, cadastro e recuperação de senha).
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int LIMITE_POR_MINUTO = 20;
    private final Map<String, long[]> janelas = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        boolean contato = uri.equals("/api/v1/publico/contato") && "POST".equals(request.getMethod());
        return !(uri.startsWith("/api/v1/auth/") || contato) || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        long minutoAtual = System.currentTimeMillis() / 60_000;
        long[] janela = janelas.compute(ip, (k, v) -> (v == null || v[0] != minutoAtual) ? new long[]{minutoAtual, 0} : v);
        synchronized (janela) {
            janela[1]++;
            if (janela[1] > LIMITE_POR_MINUTO) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"status\":429,\"messages\":[\"Muitas tentativas. Aguarde um minuto e tente novamente.\"]}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
