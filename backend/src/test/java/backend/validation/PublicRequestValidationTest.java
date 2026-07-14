package backend.validation;

import backend.payment.adapter.in.web.dto.request.CreatePaymentSessionRequest;
import backend.support.adapter.in.web.dto.request.CreateCustomerIssueReportRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PublicRequestValidationTest {

    @Test
    void rejectsInvalidPaymentSessionShape() {
        CreatePaymentSessionRequest request = new CreatePaymentSessionRequest();
        request.setBookingId(0);
        request.setMethod(" ");
        request.setPaymentOption("");

        assertEquals(Set.of("bookingId", "method", "paymentOption"), invalidProperties(request));
    }

    @Test
    void rejectsInvalidCustomerIssueReportShape() {
        CreateCustomerIssueReportRequest request = new CreateCustomerIssueReportRequest();
        request.setIssueType(" ");
        request.setBookingCode("B".repeat(51));
        request.setDescription("x".repeat(1001));

        assertEquals(Set.of("issueType", "bookingCode", "description"), invalidProperties(request));
    }

    private Set<String> invalidProperties(Object request) {
        try (ValidatorFactory validatorFactory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = validatorFactory.getValidator();
            return validator.validate(request).stream()
                    .map(ConstraintViolation::getPropertyPath)
                    .map(Object::toString)
                    .collect(Collectors.toSet());
        }
    }
}
