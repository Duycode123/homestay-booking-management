package backend.booking.application.policy;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class BookingStatusTransitionPolicy {

    private static final long EARLY_CHECK_IN_MINUTES = 30;

    public void validateManagementTransition(
            Booking booking,
            BookingStatus targetStatus,
            LocalDateTime now
    ) {
        BookingStatus currentStatus = booking.getStatus();
        if (currentStatus == null) {
            throw new IllegalStateException("Don dat phong khong co trang thai hop le");
        }
        if (currentStatus == targetStatus) {
            return;
        }
        if (targetStatus == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Vui long su dung thao tac huy booking de ghi nhan ly do");
        }

        boolean allowed = switch (currentStatus) {
            case PENDING_PAYMENT -> targetStatus == BookingStatus.PAID
                    && booking.getPaymentMethod() == PaymentMethod.CASH;
            case DEPOSIT_PAID -> targetStatus == BookingStatus.PAID;
            case PAID -> targetStatus == BookingStatus.CHECKED_IN;
            case CHECKED_IN -> targetStatus == BookingStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!allowed) {
            throw new IllegalStateException(
                    "Khong the chuyen booking tu " + currentStatus + " sang " + targetStatus
            );
        }

        if (targetStatus == BookingStatus.CHECKED_IN) {
            validateCheckInWindow(booking, now);
        }
    }

    public void validateManagementCancellation(Booking booking, String reason) {
        BookingStatus status = booking.getStatus();
        if (status == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Don dat phong da duoc huy truoc do");
        }
        if (status == BookingStatus.CHECKED_IN || status == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Khong the huy don da check-in hoac hoan thanh");
        }
        if ((status == BookingStatus.DEPOSIT_PAID || status == BookingStatus.PAID)
                && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("Ly do huy la bat buoc khi booking da thu tien");
        }
    }

    private void validateCheckInWindow(Booking booking, LocalDateTime now) {
        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            throw new IllegalStateException("Booking khong co khung thoi gian hop le");
        }

        LocalDateTime earliestCheckIn = booking.getStartTime().minusMinutes(EARLY_CHECK_IN_MINUTES);
        if (now.isBefore(earliestCheckIn)) {
            throw new IllegalStateException("Chi co the check-in som toi da 30 phut");
        }
        if (!now.isBefore(booking.getEndTime())) {
            throw new IllegalStateException("Khong the check-in sau khi booking da ket thuc");
        }
    }
}
