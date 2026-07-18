package backend.booking.application.service;

import backend.entity.AppNotification;
import backend.entity.Booking;
import backend.entity.User;
import backend.repository.AppNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BookingCustomerNotificationService {

    private static final String BOOKING_PAYMENT_HOLD = "BOOKING_PAYMENT_HOLD";
    private static final String PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final AppNotificationRepository appNotificationRepository;

    @Value("${app.booking.payment-expiration-seconds:300}")
    private long paymentExpirationSeconds = 300;

    public void notifyPaymentHoldCreated(Booking booking) {
        User recipient = resolveRecipient(booking);
        if (recipient == null) {
            return;
        }

        LocalDateTime holdExpiresAt = resolveHoldExpiresAt(booking);
        String title = "Giữ chỗ chờ thanh toán - " + safeBookingCode(booking);
        String content = "Phòng %s đang được giữ chỗ đến %s. Vui lòng hoàn tất thanh toán trong 5 phút để xác nhận booking."
                .formatted(resolveRoomName(booking), holdExpiresAt.format(DATE_TIME_FORMATTER));

        saveOnce(recipient, BOOKING_PAYMENT_HOLD, title, content);
    }

    public void notifyPaymentConfirmed(Booking booking, BigDecimal paidAmount) {
        User recipient = resolveRecipient(booking);
        if (recipient == null) {
            return;
        }

        String title = "Thanh toán đã xác nhận - " + safeBookingCode(booking);
        String content = "Hệ thống đã xác nhận thanh toán %s cho phòng %s. Booking của bạn đã được cập nhật trạng thái."
                .formatted(formatMoney(paidAmount), resolveRoomName(booking));

        saveOnce(recipient, PAYMENT_CONFIRMED, title, content);
    }

    private void saveOnce(User recipient, String type, String title, String content) {
        if (appNotificationRepository.existsByRecipientAndTypeAndTitle(recipient, type, title)) {
            return;
        }

        appNotificationRepository.save(AppNotification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .content(content)
                .read(false)
                .resolved(false)
                .build());
    }

    private User resolveRecipient(Booking booking) {
        if (booking == null || booking.getCustomer() == null) {
            return null;
        }
        return booking.getCustomer().getAccount();
    }

    private LocalDateTime resolveHoldExpiresAt(Booking booking) {
        LocalDateTime createdAt = booking.getCreatedAt() == null ? LocalDateTime.now() : booking.getCreatedAt();
        return createdAt.plusSeconds(paymentExpirationSeconds);
    }

    private String safeBookingCode(Booking booking) {
        String code = booking == null ? null : booking.getBookingCode();
        return code == null ? "BR--" : code;
    }

    private String resolveRoomName(Booking booking) {
        if (booking == null || booking.getRoom() == null || booking.getRoom().getRoomName() == null) {
            return "phòng homestay";
        }
        return booking.getRoom().getRoomName();
    }

    private String formatMoney(BigDecimal amount) {
        BigDecimal normalized = amount == null ? BigDecimal.ZERO : amount;
        NumberFormat formatter = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));
        return formatter.format(normalized) + "đ";
    }
}
