package backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsResponse {

    private boolean newBooking;
    private boolean bookingReminder;
    private boolean shiftReminder;
    private boolean roomIssue;
    private boolean equipmentIssue;
}
