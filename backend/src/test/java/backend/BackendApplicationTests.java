package backend;

import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.auth.application.port.out.EmailVerificationNotificationPort;
import backend.entity.Customer;
import backend.entity.Role;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.User;
import backend.repository.CustomerRepository;
import backend.repository.RoomRepository;
import backend.repository.RoomTypeRepository;
import backend.repository.UserRepository;
import backend.security.AuthCookieService;
import backend.security.CustomUserDetailsService;
import backend.security.JwtService;
import backend.service.TokenRevocationService;
import backend.user.application.model.UserAvatarUploadResult;
import backend.user.application.port.out.UserAvatarStoragePort;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.mockito.ArgumentMatchers;

import static org.mockito.ArgumentMatchers.argThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BackendApplicationTests {

    @MockBean
    private JavaMailSender javaMailSender;

    @MockBean
    private EmailVerificationNotificationPort emailVerificationNotificationPort;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TokenRevocationService tokenRevocationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CustomerRepository customerRepository;

    @MockBean
    private RoomRepository roomRepository;

    @MockBean
    private RoomTypeRepository roomTypeRepository;

    @MockBean
    private EquipmentRepository equipmentRepository;

    @MockBean
    private UserAvatarStoragePort userAvatarStoragePort;

    @MockBean
    private AuthenticationManager authenticationManager;

    @Test
    void contextLoads() {
    }

    @Test
    void rootHealthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    void logoutRevokesAccessAndRefreshTokens() throws Exception {
        User user = User.builder()
                .email("logout-test@example.com")
                .password("unused")
                .role(Role.CUSTOMER)
                .build();
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(
                                new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken),
                                new Cookie(AuthCookieService.REFRESH_COOKIE_NAME, refreshToken)
                        ))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("\u0110\u0103ng xu\u1ea5t th\u00e0nh c\u00f4ng"))
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(cookie().maxAge(AuthCookieService.ACCESS_COOKIE_NAME, 0))
                .andExpect(cookie().maxAge(AuthCookieService.REFRESH_COOKIE_NAME, 0));

        assertTrue(tokenRevocationService.isRevoked(accessToken));
        assertTrue(tokenRevocationService.isRevoked(refreshToken));
    }

    @Test
    void sessionAuthenticatesFromHttpOnlyAccessCookie() throws Exception {
        User user = User.builder()
                .email("cookie-session@example.com")
                .password("unused")
                .role(Role.CUSTOMER)
                .build();
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(get("/api/auth/session")
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void sessionReturnsUnauthorizedWithoutAccessCookie() throws Exception {
        mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void changePasswordEncodesNewPasswordForAuthenticatedUser() throws Exception {
        User user = User.builder()
                .email("change-password@example.com")
                .password(passwordEncoder.encode("oldSecret123"))
                .role(Role.CUSTOMER)
                .build();
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(put("/api/users/me/password")
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken))
                        .contentType("application/json")
                        .content("""
                                {
                                  "currentPassword": "oldSecret123",
                                  "newPassword": "newSecret123",
                                  "confirmPassword": "newSecret123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng"));

        assertTrue(passwordEncoder.matches("newSecret123", user.getPassword()));
        assertFalse("newSecret123".equals(user.getPassword()));
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() throws Exception {
        User user = User.builder()
                .email("wrong-current@example.com")
                .password(passwordEncoder.encode("oldSecret123"))
                .role(Role.CUSTOMER)
                .build();
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(put("/api/users/me/password")
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken))
                        .contentType("application/json")
                        .content("""
                                {
                                  "currentPassword": "wrongSecret123",
                                  "newPassword": "newSecret123",
                                  "confirmPassword": "newSecret123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i kh\u00f4ng \u0111\u00fang."));
    }

    @Test
    void loginSetsHttpOnlyCookiesWithoutExposingTokensInBody() throws Exception {
        User user = User.builder()
                .email("login@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "email": "login@example.com",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly(AuthCookieService.ACCESS_COOKIE_NAME, true))
                .andExpect(cookie().httpOnly(AuthCookieService.REFRESH_COOKIE_NAME, true))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    void refreshRotatesRefreshTokenAndSetsNewHttpOnlyCookies() throws Exception {
        User user = User.builder()
                .email("refresh@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();
        String currentRefreshToken = jwtService.generateRefreshToken(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie(AuthCookieService.REFRESH_COOKIE_NAME, currentRefreshToken)))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly(AuthCookieService.ACCESS_COOKIE_NAME, true))
                .andExpect(cookie().httpOnly(AuthCookieService.REFRESH_COOKIE_NAME, true))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());

        assertTrue(tokenRevocationService.isRevoked(currentRefreshToken));
    }

    @Test
    void revokedRefreshTokenCannotBeUsedAgain() throws Exception {
        User user = User.builder()
                .email("reused-refresh@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();
        String refreshToken = jwtService.generateRefreshToken(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie(AuthCookieService.REFRESH_COOKIE_NAME, refreshToken)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie(AuthCookieService.REFRESH_COOKIE_NAME, refreshToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void accessTokenCannotBeUsedAsRefreshToken() throws Exception {
        User user = User.builder()
                .email("wrong-token-type@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();
        String accessToken = jwtService.generateAccessToken(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie(AuthCookieService.REFRESH_COOKIE_NAME, accessToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerReturnsCreatedForValidCustomer() throws Exception {
        when(userRepository.existsByEmail("new-customer@example.com")).thenReturn(false);
        when(customerRepository.existsByPhone("0912345678")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Nguyen Van A",
                                  "email": "new-customer@example.com",
                                  "phone": "0912345678",
                                  "dateOfBirth": "2000-05-20",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));

        verify(customerRepository).save(argThat(customer ->
                LocalDate.of(2000, 5, 20).equals(customer.getDateOfBirth())
        ));
    }

    @Test
    void registerReturnsBadRequestForDuplicateEmail() throws Exception {
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Nguyen Van A",
                                  "email": "existing@example.com",
                                  "phone": "0912345678",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void registerReturnsBadRequestForDuplicatePhone() throws Exception {
        when(userRepository.existsByEmail("phone-owner@example.com")).thenReturn(false);
        when(customerRepository.existsByPhone("0912345678")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "fullName": "Nguyen Van A",
                                  "email": "phone-owner@example.com",
                                  "phone": "0912345678",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void roomsAreAvailableWithoutAuthentication() throws Exception {
        RoomType roomType = RoomType.builder()
                .id(1)
                .typeName("Standard")
                .pricePerHour(new BigDecimal("150000"))
                .capacity(6)
                .build();
        Room room = Room.builder()
                .id(10)
                .roomName("Room A")
                .roomType(roomType)
                .floor(1)
                .maxPeople(6)
                .status(RoomStatus.AVAILABLE)
                .build();
        when(roomRepository.findAll(ArgumentMatchers.<Specification<Room>>any(), any(Sort.class)))
                .thenReturn(List.of(room));

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(10))
                .andExpect(jsonPath("$.data[0].roomType.typeName").value("Standard"));
    }

    @Test
    void roomTypesAreAvailableWithoutAuthentication() throws Exception {
        RoomType roomType = RoomType.builder()
                .id(1)
                .typeName("Standard")
                .pricePerHour(new BigDecimal("150000"))
                .capacity(6)
                .build();
        when(roomTypeRepository.findAllByOrderByTypeNameAsc()).thenReturn(List.of(roomType));

        mockMvc.perform(get("/api/room-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].typeName").value("Standard"));
    }

    @Test
    void uploadAvatarStoresCloudinaryUrlForAuthenticatedUser() throws Exception {
        User user = User.builder()
                .email("avatar-user@example.com")
                .password("unused")
                .role(Role.CUSTOMER)
                .build();
        Customer customer = Customer.builder()
                .id(10)
                .account(user)
                .fullName("Avatar User")
                .email(user.getEmail())
                .phone("0912345678")
                .build();

        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerRepository.findByAccount_Email(user.getEmail())).thenReturn(Optional.of(customer));
        when(userAvatarStoragePort.uploadAvatar(any())).thenReturn(
                new UserAvatarUploadResult("https://res.cloudinary.com/demo/image/upload/v1/avatars/avatar-user.jpg")
        );
        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(new MockMultipartFile("file", "avatar-user.jpg", "image/jpeg", new byte[]{1, 2, 3}))
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("avatar-user@example.com"))
                .andExpect(jsonPath("$.avatarUrl").value("https://res.cloudinary.com/demo/image/upload/v1/avatars/avatar-user.jpg"));

        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/avatars/avatar-user.jpg", user.getAvatarUrl());
    }

    @Test
    void adminEquipmentApiAllowsStaffRole() throws Exception {
        User user = User.builder()
                .email("staff-equipment@example.com")
                .password("unused")
                .role(Role.STAFF)
                .build();
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(equipmentRepository.findAllWithRoom()).thenReturn(List.of());
        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(get("/api/admin/equipment")
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void adminEquipmentApiRejectsCustomerRole() throws Exception {
        User user = User.builder()
                .email("customer-equipment@example.com")
                .password("unused")
                .role(Role.CUSTOMER)
                .build();
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(get("/api/admin/equipment")
                        .cookie(new Cookie(AuthCookieService.ACCESS_COOKIE_NAME, accessToken)))
                .andExpect(status().isForbidden());
    }
}
