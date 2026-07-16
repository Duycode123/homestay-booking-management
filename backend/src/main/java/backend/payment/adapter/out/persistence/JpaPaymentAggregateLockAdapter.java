package backend.payment.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.PaymentTransaction;
import backend.exception.ResourceNotFoundException;
import backend.payment.application.port.out.LockPaymentAggregatePort;
import backend.repository.BookingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JpaPaymentAggregateLockAdapter implements LockPaymentAggregatePort {

    private final BookingRepository bookingRepository;
    private final EntityManager entityManager;

    @Override
    public void lockAndRefresh(PaymentTransaction transaction) {
        if (transaction == null || transaction.getId() == null || transaction.getBooking() == null
                || transaction.getBooking().getId() == null) {
            throw new IllegalArgumentException("Giao dich thanh toan khong hop le de khoa");
        }

        Booking lockedBooking = bookingRepository.findByIdForUpdate(transaction.getBooking().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        // The entities may have been loaded before another request committed. Refreshing
        // after acquiring the locks prevents a stale webhook/poller from overwriting it.
        entityManager.refresh(lockedBooking, LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(transaction, LockModeType.PESSIMISTIC_WRITE);
        transaction.setBooking(lockedBooking);
    }
}
