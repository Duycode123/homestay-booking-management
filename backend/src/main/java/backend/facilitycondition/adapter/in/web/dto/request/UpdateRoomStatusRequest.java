package backend.facilitycondition.adapter.in.web.dto.request;

import backend.entity.RoomStatus;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRoomStatusRequest {

    private RoomStatus status;

    @Size(max = 500, message = "Ghi chu khong duoc vuot qua 500 ky tu")
    private String note;

    @Size(max = 500, message = "imageUrl khong duoc vuot qua 500 ky tu")
    private String imageUrl;
}
