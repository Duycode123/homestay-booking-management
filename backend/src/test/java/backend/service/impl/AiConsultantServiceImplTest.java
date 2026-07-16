package backend.service.impl;

import backend.dto.request.AiChatRequest;
import backend.dto.request.AiConversationContextRequest;
import backend.dto.response.AiChatResponse;
import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.repository.BookingRepository;
import backend.repository.DiscountCodeRepository;
import backend.repository.ReviewRepository;
import backend.repository.RoomRepository;
import backend.service.GeminiAiClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiConsultantServiceImplTest {

    private GeminiAiClient geminiAiClient;
    private AiConsultantServiceImpl service;

    @BeforeEach
    void setUp() {
        RoomRepository roomRepository = mock(RoomRepository.class);
        BookingRepository bookingRepository = mock(BookingRepository.class);
        DiscountCodeRepository discountCodeRepository = mock(DiscountCodeRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        EquipmentRepository equipmentRepository = mock(EquipmentRepository.class);
        geminiAiClient = mock(GeminiAiClient.class);

        when(roomRepository.findAllByOrderByRoomNameAsc()).thenReturn(List.of());
        when(equipmentRepository.search(null, null, null)).thenReturn(List.of());
        when(reviewRepository.findApprovedRoomReviewStats()).thenReturn(List.of());
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
}
