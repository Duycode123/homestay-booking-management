package backend.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    @JsonIgnore
    private String accessToken;
    @JsonIgnore
    private String refreshToken;
    private String role;
    private String email;
    private boolean emailVerificationRequired;
}
