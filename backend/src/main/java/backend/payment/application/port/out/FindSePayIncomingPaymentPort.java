package backend.payment.application.port.out;

import backend.payment.application.port.out.model.SePayIncomingPayment;
import backend.payment.application.port.out.model.SePayIncomingPaymentQuery;

import java.util.Optional;

public interface FindSePayIncomingPaymentPort {

    Optional<SePayIncomingPayment> findIncomingPayment(SePayIncomingPaymentQuery query);
}
