package backend.service.impl;

import backend.dto.request.AiChatRequest;
import backend.dto.request.AiConversationContextRequest;
import backend.dto.response.AiChatResponse;
import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.entity.Booking;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.repository.BookingRepository;
import backend.repository.DiscountCodeRepository;
import backend.repository.ReviewRepository;
import backend.repository.RoomRepository;
import backend.service.GeminiAiClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiConsultantServiceImplTest {

    private GeminiAiClient geminiAiClient;
    private RoomRepository roomRepository;
    private BookingRepository bookingRepository;
    private AiConsultantServiceImpl service;

    @BeforeEach
    void setUp() {
        roomRepository = mock(RoomRepository.class);
        bookingRepository = mock(BookingRepository.class);
        DiscountCodeRepository discountCodeRepository = mock(DiscountCodeRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        EquipmentRepository equipmentRepository = mock(EquipmentRepository.class);
        geminiAiClient = mock(GeminiAiClient.class);

        when(roomRepository.findAllByOrderByRoomNameAsc()).thenReturn(List.of());
        when(equipmentRepository.search(null, null, null)).thenReturn(List.of());
        when(reviewRepository.findApprovedRoomReviewStats()).thenReturn(List.of());
        when(bookingRepository.findBlockingBookings(anyInt(), any(), any(), anyList())).thenReturn(List.of());
        when(geminiAiClient.isConfigured()).thenReturn(false);

        service = new AiConsultantServiceImpl(
                roomRepository,
                bookingRepository,
                discountCodeRepository,
                reviewRepository,
                equipmentRepository,
                geminiAiClient
        );
    }

    @Test
    void shouldKeepStayDatesAndAskForGuestsAcrossTurns() {
        AiChatRequest firstRequest = new AiChatRequest();
        firstRequest.setMessage("Tôi muốn đặt phòng từ 20/07/2027 đến 22/07/2027");

        AiChatResponse firstResponse = service.chat(firstRequest);

        assertThat(firstResponse.getIntent()).isEqualTo("BOOKING");
        assertThat(firstResponse.getState()).isEqualTo("COLLECTING_REQUIREMENTS");
        assertThat(firstResponse.getMissingFields()).containsExactly("guests");
        assertThat(firstResponse.getContext().getCheckInDate()).isEqualTo(LocalDate.of(2027, 7, 20));
        assertThat(firstResponse.getContext().getCheckOutDate()).isEqualTo(LocalDate.of(2027, 7, 22));

        AiConversationContextRequest context = new AiConversationContextRequest();
        context.setConversationId(firstResponse.getContext().getConversationId());
        context.setIntent(firstResponse.getContext().getIntent());
        context.setCheckInDate(firstResponse.getContext().getCheckInDate());
        context.setCheckOutDate(firstResponse.getContext().getCheckOutDate());

        AiChatRequest secondRequest = new AiChatRequest();
        secondRequest.setMessage("2 người lớn và 1 trẻ em");
        secondRequest.setContext(context);

        AiChatResponse secondResponse = service.chat(secondRequest);

        assertThat(secondResponse.getContext().getCheckInDate()).isEqualTo(LocalDate.of(2027, 7, 20));
        assertThat(secondResponse.getContext().getCheckOutDate()).isEqualTo(LocalDate.of(2027, 7, 22));
        assertThat(secondResponse.getContext().getAdults()).isEqualTo(2);
        assertThat(secondResponse.getContext().getChildren()).isEqualTo(1);
        assertThat(secondResponse.getInterpretedPeople()).isEqualTo(3);
        assertThat(secondResponse.getMissingFields()).isEmpty();
    }

    @Test
    void shouldUseCurrentPaymentPolicy() {
        AiChatRequest request = new AiChatRequest();
        request.setMessage("Thanh toán SePay và đặt cọc như thế nào?");

        AiChatResponse response = service.chat(request);

        assertThat(response.getIntent()).isEqualTo("PAYMENT");
        assertThat(response.getAnswer()).contains("50%", "5 phút");
    }

    @Test
    void shouldNotTreatChatAsAConfirmedBooking() {
        AiChatRequest request = new AiChatRequest();
        request.setMessage("Tôi muốn đặt phòng");

        AiChatResponse response = service.chat(request);

        assertThat(response.getState()).isEqualTo("COLLECTING_REQUIREMENTS");
        assertThat(response.getAction()).isNull();
        assertThat(response.getMissingFields()).contains("checkInDate", "checkOutDate", "guests");
    }

    @Test
    void shouldRecommendAvailableRoomFromRealRoomDataAndRequireExplicitConfirmation() {
        Room room = availableRoom();
        when(roomRepository.findAllByOrderByRoomNameAsc()).thenReturn(List.of(room));

        AiChatRequest searchRequest = new AiChatRequest();
        searchRequest.setMessage("Tôi muốn đặt phòng từ 20/07/2027 đến 22/07/2027 cho 2 người lớn");

        AiChatResponse searchResponse = service.chat(searchRequest);

        assertThat(searchResponse.getState()).isEqualTo("RECOMMENDING");
        assertThat(searchResponse.getSuggestedRooms()).extracting("roomName")
                .containsExactly("Deluxe Garden 203");
        assertThat(searchResponse.getSuggestedRooms().get(0).getBookingUrl())
                .contains("/rooms/7", "agentBooking=1", "checkIn=2027-07-20", "checkOut=2027-07-22");

        AiChatRequest selectRequest = new AiChatRequest();
        selectRequest.setMessage("Tôi muốn đặt phòng Deluxe Garden 203");
        selectRequest.setContext(copyContext(searchResponse));

        AiChatResponse selectResponse = service.chat(selectRequest);

        assertThat(selectResponse.getState()).isEqualTo("AWAITING_CONFIRMATION");
        assertThat(selectResponse.getAction()).isNotNull();
        assertThat(selectResponse.getAction().getType()).isEqualTo("OPEN_BOOKING");
        assertThat(selectResponse.getAction().getLabel()).isEqualTo("Xác nhận đặt phòng");
        assertThat(selectResponse.getAction().getHref())
                .contains("/rooms/7", "agentBooking=1", "checkIn=2027-07-20", "checkOut=2027-07-22");
    }

    @Test
    void shouldNeverRecommendRoomBlockedByAnExistingBooking() {
        when(roomRepository.findAllByOrderByRoomNameAsc()).thenReturn(List.of(availableRoom()));
        when(bookingRepository.findBlockingBookings(anyInt(), any(), any(), anyList()))
                .thenReturn(List.of(mock(Booking.class)));

        AiChatRequest request = new AiChatRequest();
        request.setMessage("Tìm phòng từ 20/07/2027 đến 22/07/2027 cho 2 người lớn");

        AiChatResponse response = service.chat(request);

        assertThat(response.getState()).isEqualTo("NO_MATCH");
        assertThat(response.getSuggestedRooms()).isEmpty();
        assertThat(response.getAction()).isNotNull();
        assertThat(response.getAction().getType()).isEqualTo("VIEW_ROOMS");
    }

    private AiConversationContextRequest copyContext(AiChatResponse response) {
        AiConversationContextRequest context = new AiConversationContextRequest();
        context.setConversationId(response.getContext().getConversationId());
        context.setIntent(response.getContext().getIntent());
        context.setCheckInDate(response.getContext().getCheckInDate());
        context.setCheckOutDate(response.getContext().getCheckOutDate());
        context.setAdults(response.getContext().getAdults());
        context.setChildren(response.getContext().getChildren());
        context.setBedrooms(response.getContext().getBedrooms());
        context.setBeds(response.getContext().getBeds());
        context.setMaxNightlyPrice(response.getContext().getMaxNightlyPrice());
        context.setAmenities(response.getContext().getAmenities());
        return context;
    }

    private Room availableRoom() {
        RoomType roomType = RoomType.builder()
                .id(2)
                .typeName("Deluxe")
                .description("Phòng hướng vườn")
                .pricePerHour(BigDecimal.valueOf(150_000))
                .active(true)
                .build();
        return Room.builder()
                .id(7)
                .roomName("Deluxe Garden 203")
                .roomType(roomType)
                .maxPeople(4)
                .bedroomCount(2)
                .bedCount(2)
                .status(RoomStatus.AVAILABLE)
                .imageUrl("https://example.com/deluxe-garden.jpg")
                .build();
    }
}
