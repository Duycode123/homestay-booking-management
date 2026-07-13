package backend.staff.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateStaffAccountRequest(
        @NotBlank(message = "Ho ten nhan vien khong duoc de trong")
        String fullName,

        @NotBlank(message = "Email nhan vien khong duoc de trong")
        @Email(message = "Email nhan vien khong hop le")
        String email,

        String phone,

        LocalDate dateOfBirth,

        @Size(min = 6, message = "Mat khau ban dau phai co it nhat 6 ky tu")
        String initialPassword
) {
}
