package backend.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Integer id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String role;
}
