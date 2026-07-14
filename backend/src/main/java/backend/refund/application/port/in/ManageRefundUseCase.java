package backend.refund.application.port.in;

import backend.refund.application.port.in.command.CompleteRefundCommand;
import backend.refund.application.port.in.command.FailRefundCommand;
import backend.refund.application.port.in.command.StartRefundCommand;
import backend.refund.application.port.in.query.RefundSearchQuery;
import backend.refund.domain.model.BookingRefund;

import java.util.List;

public interface ManageRefundUseCase {
    List<BookingRefund> listRefunds(RefundSearchQuery query);

    BookingRefund startRefund(StartRefundCommand command);

    BookingRefund completeRefund(CompleteRefundCommand command);

    BookingRefund failRefund(FailRefundCommand command);
}
