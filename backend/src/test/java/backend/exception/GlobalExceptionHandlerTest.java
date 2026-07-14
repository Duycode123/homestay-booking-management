package backend.exception;

import backend.common.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GlobalExceptionHandlerTest {

    @Test
    void emailDeliveryFailureReturnsSafeServiceUnavailableResponse() {
        EmailDeliveryException exception = new EmailDeliveryException(
                "SMTP authentication failed for internal-user@example.com",
                new RuntimeException("provider secret")
        );

        ResponseEntity<ApiResponse<String>> response =
                new GlobalExceptionHandler().handleEmailDeliveryException(exception);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals(
                "Dịch vụ email tạm thời không khả dụng. Vui lòng thử lại sau.",
                response.getBody().getMessage()
        );
        assertFalse(response.getBody().getMessage().contains("SMTP"));
        assertFalse(response.getBody().getMessage().contains("provider secret"));
    }
}
