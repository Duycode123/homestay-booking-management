package backend.dto.request;

import backend.entity.AccommodationType;
import backend.entity.RoomStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class CreateRoomRequest {

    @NotBlank(message = "Tên phòng không được để trống")
    private String roomName;

    @NotNull(message = "roomTypeId không được để trống")
    private Integer roomTypeId;

    @NotNull(message = "Suc chua toi da khong duoc de trong")
    @Min(value = 1, message = "Suc chua toi da phai lon hon 0")
    @Max(value = 100, message = "Suc chua toi da khong duoc vuot qua 100")
    private Integer maxPeople;

    @NotNull(message = "So phong ngu khong duoc de trong")
    @Min(value = 1, message = "So phong ngu phai lon hon 0")
    @Max(value = 20, message = "So phong ngu khong duoc vuot qua 20")
    private Integer bedroomCount;

    @NotNull(message = "So giuong khong duoc de trong")
    @Min(value = 1, message = "So giuong phai lon hon 0")
    @Max(value = 50, message = "So giuong khong duoc vuot qua 50")
    private Integer bedCount;

    @NotNull(message = "Vui lòng chọn loại căn lưu trú")
    private AccommodationType accommodationType;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    @NotBlank(message = "Vui lòng nhập địa chỉ cụ thể của căn lưu trú")
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String addressLine;

    @Size(max = 120, message = "Phường/xã tối đa 120 ký tự")
    private String ward;

    @NotBlank(message = "Vui lòng nhập quận/huyện")
    @Size(max = 120, message = "Quận/huyện tối đa 120 ký tự")
    private String district;

    @NotBlank(message = "Vui lòng nhập tỉnh/thành")
    @Size(max = 120, message = "Tỉnh/thành tối đa 120 ký tự")
    private String city;

    @NotNull(message = "Vui lòng nhập vĩ độ của căn lưu trú")
    private BigDecimal latitude;

    @NotNull(message = "Vui lòng nhập kinh độ của căn lưu trú")
    private BigDecimal longitude;

    @NotNull(message = "Vui lòng nhập bán kính check-in")
    @Min(value = 20, message = "Bán kính check-in tối thiểu là 20 m")
    @Max(value = 1000, message = "Bán kính check-in tối đa là 1000 m")
    private Integer checkInRadiusMeters;

    @NotNull(message = "Vui lòng nhập số phòng tắm")
    @Min(value = 1, message = "Căn lưu trú phải có ít nhất 1 phòng tắm")
    @Max(value = 20, message = "Số phòng tắm không được vượt quá 20")
    private Integer bathroomCount;

    @NotNull(message = "Vui lòng nhập giá thuê nguyên căn theo đêm")
    @DecimalMin(value = "1.0", message = "Giá thuê nguyên căn theo đêm phải lớn hơn 0")
    private BigDecimal baseNightlyRate;

    @Size(max = 500, message = "URL anh phong toi da 500 ky tu")
    private String imageUrl;

    @Size(max = 3, message = "Mỗi phòng chỉ được thêm tối đa 3 ảnh phụ")
    private List<@Size(max = 500, message = "URL ảnh phòng tối đa 500 ký tự") String> additionalImageUrls;

    private RoomStatus status;
}
