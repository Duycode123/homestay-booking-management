package backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class AuthRateLimitFilterTest {

    @Test
    void rejectsTwentyFirstSensitiveRequestFromSameAddressWithinWindow() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new ObjectMapper());
        FilterChain chain = mock(FilterChain.class);

        for (int requestNumber = 1; requestNumber <= 21; requestNumber++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("203.0.113.10");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, chain);

            if (requestNumber == 21) {
                assertEquals(429, response.getStatus());
                assertEquals("900", response.getHeader("Retry-After"));
            }
        }

        verify(chain, times(20)).doFilter(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void separatesRequestsFromDifferentForwardedClientAddresses() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new ObjectMapper());
        FilterChain chain = mock(FilterChain.class);

        for (int requestNumber = 0; requestNumber < 20; requestNumber++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("10.0.0.10");
            request.addHeader("X-Forwarded-For", "198.51.100.10, 10.0.0.10");
            filter.doFilter(request, new MockHttpServletResponse(), chain);
        }

        MockHttpServletRequest anotherClientRequest = new MockHttpServletRequest("POST", "/api/auth/login");
        anotherClientRequest.setRemoteAddr("10.0.0.10");
        anotherClientRequest.addHeader("X-Forwarded-For", "198.51.100.11, 10.0.0.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(anotherClientRequest, response, chain);

        assertEquals(200, response.getStatus());
    }
}
