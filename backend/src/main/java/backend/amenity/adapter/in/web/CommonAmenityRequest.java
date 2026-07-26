package backend.amenity.adapter.in.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CommonAmenityRequest(
        @NotBlank(message = "Tên tiện ích không được để trống")
        @Size(max = 120, message = "Tên tiện ích không được vượt quá 120 ký tự")
        String name,
        @NotBlank(message = "Mô tả tiện ích không được để trống")
        @Size(max = 500, message = "Mô tả tiện ích không được vượt quá 500 ký tự")
        String description,
        @Size(max = 60, message = "Tên biểu tượng không được vượt quá 60 ký tự")
        String iconName,
        @Size(max = 500, message = "Đường dẫn ảnh không được vượt quá 500 ký tự")
        String imageUrl,
        @Min(value = 0, message = "Thứ tự hiển thị không được nhỏ hơn 0")
        @Max(value = 10000, message = "Thứ tự hiển thị không được lớn hơn 10000")
        Integer displayOrder,
        Boolean active,
        @NotEmpty(message = "Vui lòng chọn ít nhất một homestay")
        List<@Positive(message = "Mã homestay không hợp lệ") Integer> roomIds
) {
}
