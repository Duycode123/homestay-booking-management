package backend.support.adapter.in.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCustomerIssueReportRequest {

    @NotBlank(message = "Loại sự cố không được để trống")
    @Size(max = 30, message = "Loại sự cố không được vượt quá 30 ký tự")
    private String issueType;

    @Size(max = 50, message = "Mã đặt phòng không được vượt quá 50 ký tự")
    private String bookingCode;

    @NotBlank(message = "Nội dung mô tả không được để trống")
    @Size(max = 1000, message = "Nội dung mô tả không được vượt quá 1000 ký tự")
    private String description;
}
