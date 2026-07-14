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
    void rejectsEleventhSensitiveRequestFromSameAddressWithinWindow() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new ObjectMapper());
        FilterChain chain = mock(FilterChain.class);

        for (int requestNumber = 1; requestNumber <= 11; requestNumber++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("203.0.113.10");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, chain);

            if (requestNumber == 11) {
                assertEquals(429, response.getStatus());
                assertEquals("900", response.getHeader("Retry-After"));
            }
        }

        verify(chain, times(10)).doFilter(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }
}
