package backend.coupon.adapter.in.web;

import backend.coupon.application.model.CouponTopUsagePoint;
import backend.coupon.application.model.CouponUsageReport;
import backend.coupon.application.model.CouponUsageTrendPoint;
import backend.coupon.application.port.in.CreateCouponUseCase;
import backend.coupon.application.port.in.DeleteCouponUseCase;
import backend.coupon.application.port.in.GetCouponDetailUseCase;
import backend.coupon.application.port.in.GetCouponUsageReportUseCase;
import backend.coupon.application.port.in.ListCouponsUseCase;
import backend.coupon.application.port.in.UpdateCouponUseCase;
import backend.coupon.application.port.in.query.GetCouponUsageReportQuery;
import backend.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminCouponControllerTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-07-04T12:00:00Z"),
            ZoneId.of("UTC")
    );

    @Mock
    private ListCouponsUseCase listCouponsUseCase;

    @Mock
    private GetCouponDetailUseCase getCouponDetailUseCase;

    @Mock
    private CreateCouponUseCase createCouponUseCase;

    @Mock
    private UpdateCouponUseCase updateCouponUseCase;

    @Mock
    private DeleteCouponUseCase deleteCouponUseCase;

    @Mock
    private GetCouponUsageReportUseCase getCouponUsageReportUseCase;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        JsonMapper objectMapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminCouponController(
                        listCouponsUseCase,
                        getCouponDetailUseCase,
                        createCouponUseCase,
                        updateCouponUseCase,
                        deleteCouponUseCase,
                        getCouponUsageReportUseCase,
                        FIXED_CLOCK
                ))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void returnsUsageReportForFrontendMapping() throws Exception {
        CouponUsageReport report = new CouponUsageReport(
                3,
                new BigDecimal("175000.00"),
                List.of(new CouponUsageTrendPoint(LocalDate.of(2026, 7, 1), 3, new BigDecimal("175000.00"))),
                List.of(new CouponTopUsagePoint(7, "SUMMER10", 3, new BigDecimal("175000.00")))
        );
        ArgumentCaptor<GetCouponUsageReportQuery> queryCaptor =
                ArgumentCaptor.forClass(GetCouponUsageReportQuery.class);

        when(getCouponUsageReportUseCase.getCouponUsageReport(any())).thenReturn(report);

        mockMvc.perform(get("/api/admin/coupons/usage-report")
                        .param("startDate", "2026-07-01")
                        .param("endDate", "2026-07-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsed").value(3))
                .andExpect(jsonPath("$.data.totalDiscountGiven").value(175000.00))
                .andExpect(jsonPath("$.data.trend[0].date").value("2026-07-01"))
                .andExpect(jsonPath("$.data.trend[0].usageCount").value(3))
                .andExpect(jsonPath("$.data.topCoupons[0].couponId").value(7))
                .andExpect(jsonPath("$.data.topCoupons[0].code").value("SUMMER10"));

        org.mockito.Mockito.verify(getCouponUsageReportUseCase).getCouponUsageReport(queryCaptor.capture());
        assertEquals(LocalDate.of(2026, 7, 1), queryCaptor.getValue().startDate());
        assertEquals(LocalDate.of(2026, 7, 31), queryCaptor.getValue().endDate());
    }

    @Test
    void usesDefaultThirtyDayWindowForUsageReport() throws Exception {
        when(getCouponUsageReportUseCase.getCouponUsageReport(any())).thenReturn(
                new CouponUsageReport(0, BigDecimal.ZERO, List.of(), List.of())
        );
        ArgumentCaptor<GetCouponUsageReportQuery> queryCaptor =
                ArgumentCaptor.forClass(GetCouponUsageReportQuery.class);

        mockMvc.perform(get("/api/admin/coupons/usage-report"))
                .andExpect(status().isOk());

        org.mockito.Mockito.verify(getCouponUsageReportUseCase).getCouponUsageReport(queryCaptor.capture());
        assertEquals(LocalDate.of(2026, 6, 5), queryCaptor.getValue().startDate());
        assertEquals(LocalDate.of(2026, 7, 4), queryCaptor.getValue().endDate());
    }
}
