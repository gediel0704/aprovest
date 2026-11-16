package com.itb.inf2cm.aprovest.auth;

import com.itb.inf2cm.aprovest.dto.UsuarioDTO;

public record AuthenticationResponse(String accessToken, String refreshToken, UsuarioDTO usuario) {
}
