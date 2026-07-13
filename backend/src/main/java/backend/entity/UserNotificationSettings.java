package backend.entity;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationSettings {

    private Integer id;

    private User account;

    private boolean newBooking;

    private boolean bookingReminder;

    private boolean shiftReminder;

    private boolean roomIssue;

    private boolean equipmentIssue;
}
