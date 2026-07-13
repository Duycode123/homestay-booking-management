package backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsRequest {

    private Boolean newBooking;
    private Boolean bookingReminder;
    private Boolean shiftReminder;
    private Boolean roomIssue;
    private Boolean equipmentIssue;
}
