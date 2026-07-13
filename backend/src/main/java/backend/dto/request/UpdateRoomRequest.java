package backend.dto.request;

import backend.entity.RoomStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateRoomRequest {

    @NotBlank(message = "Ten phong khong duoc de trong")
    private String roomName;

    @NotNull(message = "roomTypeId khong duoc de trong")
    private Integer roomTypeId;

    @NotNull(message = "Suc chua toi da khong duoc de trong")
    @Min(value = 1, message = "Suc chua toi da phai lon hon 0")
    @Max(value = 100, message = "Suc chua toi da khong duoc vuot qua 100")
    private Integer maxPeople;

    @Size(max = 500, message = "URL anh phong toi da 500 ky tu")
    private String imageUrl;

    @NotNull(message = "Trang thai phong khong duoc de trong")
    private RoomStatus status;
}
