package backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class CreateRoomTypeRequest {

    @NotBlank(message = "Tên loại phòng không được để trống")
    @Size(max = 255, message = "Tên loại phòng tối đa 255 ký tự")
    private String typeName;

    @Size(max = 2000, message = "Mô tả loại phòng tối đa 2000 ký tự")
    private String description;

    @NotNull(message = "Giá theo giờ không được để trống")
    @DecimalMin(value = "0.01", message = "Giá theo giờ phải lớn hơn 0")
    private BigDecimal pricePerHour;
}
