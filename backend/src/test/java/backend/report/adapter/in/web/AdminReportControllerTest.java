package backend.report.adapter.in.web;

import backend.exception.GlobalExceptionHandler;
import backend.report.adapter.in.web.mapper.RevenueUsageReportWebMapper;
import backend.report.adapter.in.web.mapper.RoomPerformanceReportWebMapper;
import backend.report.domain.model.ReportBucket;
import backend.report.domain.model.RoomPerformanceReport;
import backend.report.domain.model.RoomPerformanceSummary;
import backend.report.domain.model.RevenueUsagePeriod;
import backend.report.domain.model.RevenueUsageReport;
import backend.report.domain.model.RoomUsageSummary;
import backend.report.domain.port.in.GetRoomPerformanceReportQuery;
import backend.report.domain.port.in.GetRoomPerformanceReportUseCase;
import backend.report.domain.port.in.GetRevenueUsageReportUseCase;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.math.BigDecimal;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminReportControllerTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-07-04T12:00:00Z"),
            ZoneId.of("UTC")
    );

    @Mock
    private GetRevenueUsageReportUseCase getRevenueUsageReportUseCase;

    @Mock
    private GetRoomPerformanceReportUseCase getRoomPerformanceReportUseCase;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        JsonMapper objectMapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminReportController(
                        getRevenueUsageReportUseCase,
                        new RevenueUsageReportWebMapper(),
                        getRoomPerformanceReportUseCase,
                        new RoomPerformanceReportWebMapper(),
                        FIXED_CLOCK
                ))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void usesDefaultThirtyDayWindowForRevenueUsageReport() throws Exception {
        RevenueUsageReport report = new RevenueUsageReport(
                LocalDateTime.of(2026, 6, 5, 0, 0),
                LocalDateTime.of(2026, 7, 5, 0, 0),
                ReportBucket.DAY,
                new BigDecimal("600000.00"),
                3,
                new BigDecimal("6.00"),
                List.of(
                        new RevenueUsagePeriod(
                                LocalDateTime.of(2026, 6, 15, 0, 0),
                                new BigDecimal("600000.00"),
                                3,
                                new BigDecimal("6.00")
                        )
                ),
                List.of(
                        new RoomUsageSummary(
                                1,
                                "Deluxe Balcony 201",
                                "VIP",
                                new BigDecimal("600000.00"),
                                3,
                                new BigDecimal("6.00")
                        )
                )
        );
        ArgumentCaptor<backend.report.domain.port.in.GetRevenueUsageReportQuery> queryCaptor =
                ArgumentCaptor.forClass(backend.report.domain.port.in.GetRevenueUsageReportQuery.class);

        when(getRevenueUsageReportUseCase.getRevenueUsageReport(any())).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/revenue-usage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Revenue and room usage report loaded successfully"))
                .andExpect(jsonPath("$.data.totalRevenue").value(600000.00))
                .andExpect(jsonPath("$.data.totalBookings").value(3))
                .andExpect(jsonPath("$.data.periods[0].bookingCount").value(3));

        org.mockito.Mockito.verify(getRevenueUsageReportUseCase).getRevenueUsageReport(queryCaptor.capture());
        assertEquals(LocalDateTime.of(2026, 6, 5, 0, 0), queryCaptor.getValue().from());
        assertEquals(LocalDateTime.of(2026, 7, 5, 0, 0), queryCaptor.getValue().to());
        assertEquals(ReportBucket.DAY, queryCaptor.getValue().bucket());
    }

    @Test
    void usesDefaultThirtyDayDateRangeForRoomPerformanceReport() throws Exception {
        RoomPerformanceReport report = new RoomPerformanceReport(
                LocalDate.of(2026, 6, 5),
                LocalDate.of(2026, 7, 4),
                4,
                List.of(new RoomPerformanceSummary(1, "Deluxe Balcony 201", "VIP", 4))
        );
        ArgumentCaptor<GetRoomPerformanceReportQuery> queryCaptor =
                ArgumentCaptor.forClass(GetRoomPerformanceReportQuery.class);

        when(getRoomPerformanceReportUseCase.getRoomPerformanceReport(any())).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/room-performance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.startDate").value("2026-06-05"))
                .andExpect(jsonPath("$.data.endDate").value("2026-07-04"));

        org.mockito.Mockito.verify(getRoomPerformanceReportUseCase).getRoomPerformanceReport(queryCaptor.capture());
        assertEquals(LocalDate.of(2026, 6, 5), queryCaptor.getValue().startDate());
        assertEquals(LocalDate.of(2026, 7, 4), queryCaptor.getValue().endDate());
    }

    @Test
    void returnsRoomPerformanceReportForInclusiveDateRange() throws Exception {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        RoomPerformanceReport report = new RoomPerformanceReport(
                startDate,
                endDate,
                7,
                List.of(
                        new RoomPerformanceSummary(1, "Deluxe Balcony 201", "Premium", 5),
                        new RoomPerformanceSummary(2, "Deluxe City View 202", "Standard", 2),
                        new RoomPerformanceSummary(3, "Family Suite 301", "Standard", 0)
                )
        );

        when(getRoomPerformanceReportUseCase.getRoomPerformanceReport(
                new GetRoomPerformanceReportQuery(startDate, endDate)
        )).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/room-performance")
                        .param("startDate", "2026-07-01")
                        .param("endDate", "2026-07-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Room performance report loaded successfully"))
                .andExpect(jsonPath("$.data.startDate").value("2026-07-01"))
                .andExpect(jsonPath("$.data.endDate").value("2026-07-31"))
                .andExpect(jsonPath("$.data.totalSuccessfulBookings").value(7))
                .andExpect(jsonPath("$.data.rooms.length()").value(3))
                .andExpect(jsonPath("$.data.rooms[0].roomName").value("Deluxe Balcony 201"))
                .andExpect(jsonPath("$.data.rooms[2].successfulBookingCount").value(0));
    }

    @Test
    void surfacesValidationErrorsFromRoomPerformanceUseCase() throws Exception {
        when(getRoomPerformanceReportUseCase.getRoomPerformanceReport(any()))
                .thenThrow(new IllegalArgumentException("endDate must be on or after startDate"));

        mockMvc.perform(get("/api/admin/reports/room-performance")
                        .param("startDate", "2026-07-31")
                        .param("endDate", "2026-07-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("endDate must be on or after startDate"));
    }
}
