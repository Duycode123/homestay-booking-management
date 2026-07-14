package backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CancelBookingRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    @Size(min = 10, max = 500, message = "Lý do hủy phải từ 10 đến 500 ký tự")
    private String reason;

    @NotBlank(message = "Vui lòng chọn ngân hàng nhận tiền hoàn")
    @Pattern(regexp = "^[A-Za-z0-9]{2,20}$", message = "Mã ngân hàng không hợp lệ")
    private String refundBankCode;

    @NotBlank(message = "Tên ngân hàng nhận tiền hoàn không được để trống")
    @Size(max = 100, message = "Tên ngân hàng không được vượt quá 100 ký tự")
    private String refundBankName;

    @NotBlank(message = "Số tài khoản nhận tiền hoàn không được để trống")
    @Pattern(regexp = "^[0-9]{6,30}$", message = "Số tài khoản phải gồm từ 6 đến 30 chữ số")
    private String refundAccountNumber;

    @NotBlank(message = "Tên chủ tài khoản nhận tiền hoàn không được để trống")
    @Size(min = 2, max = 100, message = "Tên chủ tài khoản phải từ 2 đến 100 ký tự")
    private String refundAccountHolder;
}
