package backend.attendance.application.port.in.command;

import java.math.BigDecimal;

public record CheckInShiftCommand(
        String currentUserEmail,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal accuracyMeters
) {
    public CheckInShiftCommand(String currentUserEmail) {
        this(currentUserEmail, null, null, null);
    }
}
