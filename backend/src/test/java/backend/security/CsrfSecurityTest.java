package backend.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.csrf.enabled=true")
@AutoConfigureMockMvc
class CsrfSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JavaMailSender javaMailSender;

    @Test
    void csrfEndpointIssuesTokenAndUnsafeRequestRequiresIt() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        containsString("HOMESTAY-XSRF-TOKEN=")
                ));

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(CsrfAccessDeniedHandler.ERROR_CODE))
                .andExpect(cookie().doesNotExist(AuthCookieService.ACCESS_COOKIE_NAME))
                .andExpect(cookie().doesNotExist(AuthCookieService.REFRESH_COOKIE_NAME));

        mockMvc.perform(post("/api/auth/logout").with(csrf().useInvalidToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(CsrfAccessDeniedHandler.ERROR_CODE))
                .andExpect(cookie().doesNotExist(AuthCookieService.ACCESS_COOKIE_NAME))
                .andExpect(cookie().doesNotExist(AuthCookieService.REFRESH_COOKIE_NAME));

        mockMvc.perform(post("/api/auth/logout").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void staleAccessCookieDoesNotBlockPublicCsrfEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/csrf")
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, "stale-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void unauthorizedResponseDoesNotClearAuthenticationCookies() throws Exception {
        mockMvc.perform(get("/api/auth/session")
                        .cookie(
                                new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, "stale-access-token"),
                                new Cookie(AuthCookieService.REFRESH_COOKIE_NAME, "refresh-token")
                        ))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(
                        "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
                ))
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }
}
