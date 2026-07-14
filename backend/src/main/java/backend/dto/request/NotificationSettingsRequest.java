package backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsRequest {

    @NotNull(message = "Thiết lập thông báo đặt phòng mới không được để trống")
    private Boolean newBooking;

    @NotNull(message = "Thiết lập nhắc lịch đặt phòng không được để trống")
    private Boolean bookingReminder;

    @NotNull(message = "Thiết lập nhắc ca làm việc không được để trống")
    private Boolean shiftReminder;

    @NotNull(message = "Thiết lập thông báo sự cố phòng không được để trống")
    private Boolean roomIssue;

    @NotNull(message = "Thiết lập thông báo sự cố thiết bị không được để trống")
    private Boolean equipmentIssue;
}
