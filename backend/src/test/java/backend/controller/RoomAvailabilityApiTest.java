package backend.controller;

import backend.booking.application.port.in.GetRoomAvailabilityUseCase;
import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.dto.response.RoomAvailabilityResponse;
import backend.dto.response.TimeSlotResponse;
import backend.room.application.port.in.CreateRoomUseCase;
import backend.room.application.port.in.DeleteRoomUseCase;
import backend.room.application.port.in.GetRoomDetailUseCase;
import backend.room.application.port.in.ListRoomsUseCase;
import backend.room.application.port.in.UpdateRoomStatusUseCase;
import backend.room.application.port.in.UpdateRoomUseCase;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RoomAvailabilityApiTest {

    @Mock
    private ListRoomsUseCase listRoomsUseCase;

    @Mock
    private GetRoomDetailUseCase getRoomDetailUseCase;

    @Mock
    private CreateRoomUseCase createRoomUseCase;

    @Mock
    private UpdateRoomUseCase updateRoomUseCase;

    @Mock
    private UpdateRoomStatusUseCase updateRoomStatusUseCase;

    @Mock
    private DeleteRoomUseCase deleteRoomUseCase;

    @Mock
    private GetRoomAvailabilityUseCase getRoomAvailabilityUseCase;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        JsonMapper objectMapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new RoomController(
                        listRoomsUseCase,
                        getRoomDetailUseCase,
                        createRoomUseCase,
                        updateRoomUseCase,
                        updateRoomStatusUseCase,
                        deleteRoomUseCase,
                        getRoomAvailabilityUseCase
                ))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void returnsAvailableSlotsForRequestedWindow() throws Exception {
        LocalDateTime from = LocalDateTime.of(2030, 1, 10, 9, 0);
        LocalDateTime to = LocalDateTime.of(2030, 1, 10, 17, 0);
        RoomAvailabilityResponse response = new RoomAvailabilityResponse(
                10,
                "Room A",
                from,
                to,
                true,
                List.of(
                        new TimeSlotResponse(from, from.plusHours(1)),
                        new TimeSlotResponse(from.plusHours(3), to)
                )
        );

        when(getRoomAvailabilityUseCase.getAvailableSlots(new GetRoomAvailabilityQuery(10, from, to)))
                .thenReturn(response);

        mockMvc.perform(get("/api/rooms/10/available-slots")
                        .param("from", "2030-01-10T09:00:00")
                        .param("to", "2030-01-10T17:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomId").value(10))
                .andExpect(jsonPath("$.data.availableSlots.length()").value(2))
                .andExpect(jsonPath("$.data.availableSlots[0].startTime")
                        .value("2030-01-10T09:00:00"))
                .andExpect(jsonPath("$.data.availableSlots[0].endTime")
                        .value("2030-01-10T10:00:00"));
    }
}
