package backend.controller;

import backend.auth.application.port.in.LoginUserUseCase;
import backend.auth.application.port.in.LogoutUseCase;
import backend.auth.application.port.in.RefreshSessionUseCase;
import backend.auth.application.port.in.RegisterUserUseCase;
import backend.auth.application.port.in.ResendEmailVerificationUseCase;
import backend.auth.application.port.in.RequestPasswordResetUseCase;
import backend.auth.application.port.in.ResetPasswordUseCase;
import backend.auth.application.port.in.VerifyEmailUseCase;
import backend.auth.application.port.in.command.RequestPasswordResetCommand;
import backend.config.FrontendUrlBuilder;
import backend.exception.GlobalExceptionHandler;
import backend.security.AuthCookieService;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerValidationTest {

    @Mock
    private RegisterUserUseCase registerUserUseCase;
    @Mock
    private LoginUserUseCase loginUserUseCase;
    @Mock
    private RefreshSessionUseCase refreshSessionUseCase;
    @Mock
    private LogoutUseCase logoutUseCase;
    @Mock
    private RequestPasswordResetUseCase requestPasswordResetUseCase;
    @Mock
    private ResetPasswordUseCase resetPasswordUseCase;
    @Mock
    private VerifyEmailUseCase verifyEmailUseCase;
    @Mock
    private ResendEmailVerificationUseCase resendEmailVerificationUseCase;
    @Mock
    private AuthCookieService authCookieService;
    @Mock
    private FrontendUrlBuilder frontendUrlBuilder;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        JsonMapper objectMapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(
                        registerUserUseCase,
                        loginUserUseCase,
                        refreshSessionUseCase,
                        logoutUseCase,
                        requestPasswordResetUseCase,
                        resetPasswordUseCase,
                        verifyEmailUseCase,
                        resendEmailVerificationUseCase,
                        authCookieService,
                        frontendUrlBuilder
                ))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void rejectsRegistrationWhenPasswordHasNoNumber() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Nguyen Van A",
                                  "email": "customer@example.com",
                                  "phone": "0912345678",
                                  "dateOfBirth": "2000-01-01",
                                  "password": "onlyletters"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.password")
                        .value("Mật khẩu phải có ít nhất một chữ cái và một chữ số"));

        verify(registerUserUseCase, never()).register(any());
    }

    @Test
    void rejectsRegistrationWhenPhoneIsNotVietnameseMobileNumber() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Nguyen Van A",
                                  "email": "customer@example.com",
                                  "phone": "0212345678",
                                  "dateOfBirth": "2000-01-01",
                                  "password": "password1"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.phone")
                        .value("Số điện thoại di động Việt Nam không đúng định dạng"));

        verify(registerUserUseCase, never()).register(any());
    }

    @Test
    void rejectsForgotPasswordWhenEmailIsMalformed() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.email").value("Email không đúng định dạng"));

        verify(requestPasswordResetUseCase, never()).requestPasswordReset(any());
    }

    @Test
    void rejectsResetPasswordWhenTokenIsMalformed() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"not-a-uuid","newPassword":"newPassword1"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.token")
                        .value("Token đặt lại mật khẩu không đúng định dạng"));

        verify(resetPasswordUseCase, never()).resetPassword(any());
    }

    @Test
    void rejectsVerifyEmailWhenTokenIsMalformed() throws Exception {
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"not-a-uuid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.token")
                        .value("Token xác thực email không đúng định dạng"));

        verify(verifyEmailUseCase, never()).verifyEmail(any());
    }

    @Test
    void returnsBadRequestWhenForgotPasswordBodyIsMissing() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Nội dung yêu cầu không hợp lệ"));

        verify(requestPasswordResetUseCase, never()).requestPasswordReset(any());
    }

    @Test
    void mapsValidForgotPasswordRequestToUseCaseCommand() throws Exception {
        when(frontendUrlBuilder.linkTo("/reset-password?token="))
                .thenReturn("http://localhost:3000/reset-password?token=");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"customer@example.com\"}"))
                .andExpect(status().isOk());

        ArgumentCaptor<RequestPasswordResetCommand> commandCaptor =
                ArgumentCaptor.forClass(RequestPasswordResetCommand.class);
        verify(requestPasswordResetUseCase).requestPasswordReset(commandCaptor.capture());
        assertEquals("customer@example.com", commandCaptor.getValue().email());
        assertEquals(
                "http://localhost:3000/reset-password?token=",
                commandCaptor.getValue().resetPasswordUrlBase()
        );
    }
}
