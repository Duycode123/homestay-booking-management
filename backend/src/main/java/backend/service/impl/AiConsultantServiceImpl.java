package backend.service.impl;

import backend.dto.request.AiChatRequest;
import backend.dto.request.AiChatTurnRequest;
import backend.dto.request.AiConversationContextRequest;
import backend.dto.response.AiAgentActionResponse;
import backend.dto.response.AiChatResponse;
import backend.dto.response.AiConversationContextResponse;
import backend.dto.response.AiSuggestedRoomResponse;
import backend.equipment.adapter.out.persistence.EquipmentJpaEntity;
import backend.equipment.adapter.out.persistence.EquipmentRepository;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.DiscountCode;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.repository.BookingRepository;
import backend.repository.DiscountCodeRepository;
import backend.repository.ReviewRepository;
import backend.repository.RoomRepository;
import backend.service.AiConsultantService;
import backend.service.GeminiAiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiConsultantServiceImpl implements AiConsultantService {

    private static final BigDecimal NIGHT_STAY_HOURS = BigDecimal.valueOf(22);
    private static final LocalTime CHECK_IN_TIME = LocalTime.of(14, 0);
    private static final LocalTime CHECK_OUT_TIME = LocalTime.of(12, 0);

    private static final List<BookingStatus> ROOM_BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.DEPOSIT_PAID,
            BookingStatus.PAID,
            BookingStatus.CHECKED_IN
    );

    private static final List<String> SUGGESTED_QUESTIONS = List.of(
            "Tôi muốn đặt phòng cho 2 người lớn",
            "Tìm phòng từ ngày mai trong 1 đêm",
            "Có phòng nào dưới 3 triệu một đêm không?",
            "Phòng rẻ nhất hiện tại là phòng nào?",
            "Phòng nào có 2 giường và Wi-Fi?",
            "Cho tôi xem tất cả phòng đang có",
            "Phòng nào phù hợp cho gia đình 4 người?",
            "Tôi muốn hỏi về thanh toán và đặt cọc"
    );

    private static final Pattern PEOPLE_PATTERN =
            Pattern.compile("(\\d{1,3})\\s*(nguoi|khach|thanh vien|ban)");
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(k|nghin|ngan|trieu|m|vnd|d|dong)\\b");
    private static final Pattern HOUR_RANGE_PATTERN =
            Pattern.compile("(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)?\\s*(?:-|den|toi|~)\\s*(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)?");
    private static final Pattern DURATION_PATTERN =
            Pattern.compile("(?:trong|khoang|tam)\\s*(\\d{1,2})\\s*(?:gio|tieng|h)");
    private static final Pattern START_HOUR_PATTERN =
            Pattern.compile("(?:luc|tu|bat dau luc)\\s*(\\d{1,2})(?:[:h](\\d{1,2}))?\\s*(?:h|gio)?");
    private static final Pattern DATE_PATTERN =
            Pattern.compile("(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{2,4}))?");
    private static final Pattern NIGHT_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:dem|night)");
    private static final Pattern ADULT_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:nguoi lon|adult)");
    private static final Pattern CHILD_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:tre em|tre nho|child|children)");
    private static final Pattern BEDROOM_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:phong ngu|bedroom)");
    private static final Pattern BED_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:giuong|bed)");
    private static final DateTimeFormatter PROMPT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final ReviewRepository reviewRepository;
    private final EquipmentRepository equipmentRepository;
    private final GeminiAiClient geminiAiClient;

    @Override
    @Transactional(readOnly = true)
    public AiChatResponse chat(AiChatRequest request) {
        String message = request.getMessage().trim();
        String normalizedMessage = normalize(message);
        AgentContext agentContext = resolveAgentContext(request, normalizedMessage);
        Integer people = agentContext.totalGuests() != null
                ? agentContext.totalGuests()
                : request.getPeople() != null ? request.getPeople() : extractPeople(normalizedMessage).orElse(null);
        BigDecimal maxPrice = agentContext.maxNightlyPrice() != null
                ? agentContext.maxNightlyPrice().divide(NIGHT_STAY_HOURS, 2, java.math.RoundingMode.HALF_UP)
                : request.getMaxPricePerHour() != null ? request.getMaxPricePerHour() : extractMaxPrice(normalizedMessage).orElse(null);
        TimeRange timeRange = agentContext.hasCompleteStay()
                ? new TimeRange(
                        agentContext.checkInDate().atTime(CHECK_IN_TIME),
                        agentContext.checkOutDate().atTime(CHECK_OUT_TIME)
                )
                : resolveTimeRange(request, normalizedMessage);

        List<AiSuggestedRoomResponse> allAvailableRooms = safeGetRoomContext(timeRange);
        List<AiSuggestedRoomResponse> matchedRooms = filterAgentRooms(
                filterRooms(allAvailableRooms, people, maxPrice, timeRange),
                agentContext
        );
        Integer selectedRoomId = resolveSelectedRoomId(agentContext, normalizedMessage, matchedRooms, allAvailableRooms);
        agentContext = agentContext.withSelectedRoomId(selectedRoomId);
        AgentTurn agentTurn = buildAgentTurn(agentContext, matchedRooms, allAvailableRooms);

        String localAnswer = "BOOKING".equals(agentContext.intent())
                ? agentTurn.answer()
                : buildAnswer(normalizedMessage, matchedRooms, allAvailableRooms, people, maxPrice, timeRange);
        String answer = localAnswer;
        String mode = "LOCAL_DB_RULES";
        boolean usedAi = false;

        if (geminiAiClient.isConfigured() && !"BOOKING".equals(agentContext.intent())) {
            try {
                String aiAnswer = geminiAiClient.chat(
                        buildSystemPrompt(),
                        buildGeminiPrompt(
                                buildConversationMessage(request.getHistory(), message),
                                matchedRooms,
                                allAvailableRooms,
                                people,
                                maxPrice,
                                timeRange,
                                localAnswer
                        )
                );
                if (isLikelyIncompleteAnswer(aiAnswer)) {
                    mode = "LOCAL_DB_RULES:GEMINI_INCOMPLETE";
                } else {
                    answer = aiAnswer;
                    mode = "GEMINI_RAG:" + geminiAiClient.getModel();
                    usedAi = true;
                }
            } catch (RuntimeException ignored) {
                answer = localAnswer;
            }
        }

        boolean showRoomCards = "BOOKING".equals(agentContext.intent())
                ? List.of("RECOMMENDING", "AWAITING_CONFIRMATION", "NO_MATCH").contains(agentTurn.state())
                : containsAny(normalizedMessage, "phong", "homestay", "gia", "suc chua", "tien nghi");

        return AiChatResponse.builder()
                .answer(answer)
                .suggestedRooms(showRoomCards ? matchedRooms.stream().limit(4).toList() : List.of())
                .interpretedStartTime(timeRange == null ? null : timeRange.startTime())
                .interpretedEndTime(timeRange == null ? null : timeRange.endTime())
                .interpretedPeople(people)
                .suggestedQuestions(buildTurnSuggestions(agentContext, agentTurn, matchedRooms))
                .usedAi(usedAi)
                .mode(mode)
                .state(agentTurn.state())
                .intent(agentContext.intent())
                .missingFields(agentTurn.missingFields())
                .context(toContextResponse(agentContext))
                .action(agentTurn.action())
                .build();
    }

    private List<String> buildTurnSuggestions(
            AgentContext context,
            AgentTurn turn,
            List<AiSuggestedRoomResponse> matchedRooms
    ) {
        if (!"BOOKING".equals(context.intent())) return getSuggestedQuestions();
        if (turn.missingFields().contains("checkInDate")) {
            return List.of("Nhận phòng ngày mai", "Tìm phòng cuối tuần này", "Xem tất cả phòng");
        }
        if (turn.missingFields().contains("checkOutDate")) {
            return List.of("Ở 1 đêm", "Ở 2 đêm", "Tôi muốn chọn ngày khác");
        }
        if (turn.missingFields().contains("guests")) {
            return List.of("2 người lớn", "2 người lớn và 1 trẻ em", "4 người lớn");
        }
        if ("RECOMMENDING".equals(turn.state())) {
            return matchedRooms.stream().limit(3).map(room -> "Chọn " + room.getRoomName()).toList();
        }
        return List.of("Tìm kỳ lưu trú khác", "Hỏi về thanh toán", "Xem chính sách hủy");
    }

    private AgentContext resolveAgentContext(AiChatRequest request, String normalizedMessage) {
        AiConversationContextRequest previous = request.getContext();
        boolean reset = containsAny(normalizedMessage, "bat dau lai", "xoa bo loc", "dat lai nhu cau", "reset");

        String conversationId = !reset && previous != null && previous.getConversationId() != null
                ? previous.getConversationId()
                : UUID.randomUUID().toString();
        String previousIntent = !reset && previous != null ? previous.getIntent() : null;
        String intent = resolveIntent(normalizedMessage, previousIntent);

        LocalDate checkIn = !reset && previous != null ? previous.getCheckInDate() : null;
        LocalDate checkOut = !reset && previous != null ? previous.getCheckOutDate() : null;
        List<LocalDate> dates = extractStayDates(normalizedMessage);
        if (dates.size() >= 2) {
            checkIn = dates.get(0);
            checkOut = dates.get(1);
        } else if (dates.size() == 1) {
            if (containsAny(normalizedMessage, "tra phong", "check out", "checkout")) {
                checkOut = dates.get(0);
            } else {
                checkIn = dates.get(0);
                if (checkOut != null && !checkOut.isAfter(checkIn)) {
                    checkOut = null;
                }
            }
        }

        Integer nights = extractInteger(NIGHT_PATTERN, normalizedMessage);
        if (checkIn != null && nights != null && nights > 0) {
            checkOut = checkIn.plusDays(nights);
        }

        Integer adults = !reset && previous != null ? previous.getAdults() : null;
        Integer children = !reset && previous != null ? previous.getChildren() : null;
        Integer explicitAdults = extractInteger(ADULT_PATTERN, normalizedMessage);
        Integer explicitChildren = extractInteger(CHILD_PATTERN, normalizedMessage);
        if (explicitAdults != null) adults = explicitAdults;
        if (explicitChildren != null) children = explicitChildren;
        if (explicitAdults == null && explicitChildren == null) {
            Integer genericPeople = request.getPeople() != null
                    ? request.getPeople()
                    : extractPeople(normalizedMessage).orElse(null);
            if (genericPeople != null) adults = genericPeople;
        }

        Integer bedrooms = !reset && previous != null ? previous.getBedrooms() : null;
        Integer beds = !reset && previous != null ? previous.getBeds() : null;
        Integer explicitBedrooms = extractInteger(BEDROOM_PATTERN, normalizedMessage);
        Integer explicitBeds = extractInteger(BED_PATTERN, normalizedMessage);
        if (explicitBedrooms != null) bedrooms = explicitBedrooms;
        if (explicitBeds != null) beds = explicitBeds;

        BigDecimal maxNightlyPrice = !reset && previous != null ? previous.getMaxNightlyPrice() : null;
        if (containsAny(normalizedMessage, "gia", "ngan sach", "toi da", "khong qua", "duoi")) {
            maxNightlyPrice = extractMaxPrice(normalizedMessage).orElse(maxNightlyPrice);
        }

        Set<String> amenities = new LinkedHashSet<>();
        if (!reset && previous != null && previous.getAmenities() != null) {
            amenities.addAll(previous.getAmenities());
        }
        amenities.addAll(findEquipmentKeywords(normalizedMessage));

        Integer selectedRoomId = !reset && previous != null ? previous.getSelectedRoomId() : null;
        return new AgentContext(
                conversationId,
                intent,
                checkIn,
                checkOut,
                positiveOrNull(adults),
                nonNegativeOrNull(children),
                positiveOrNull(bedrooms),
                positiveOrNull(beds),
                maxNightlyPrice,
                List.copyOf(amenities),
                selectedRoomId
        );
    }

    private String resolveIntent(String normalizedMessage, String previousIntent) {
        if (containsAny(normalizedMessage, "thanh toan", "dat coc", "sepay", "qr", "chuyen khoan", "tien mat")) {
            return "PAYMENT";
        }
        if (containsAny(normalizedMessage, "huy phong", "huy lich", "hoan tien", "doi lich")) {
            return "CANCELLATION";
        }
        if (containsAny(normalizedMessage, "ma giam gia", "coupon", "voucher", "khuyen mai", "serene10")) {
            return "COUPON";
        }
        if (containsAny(normalizedMessage, "dich vu them", "thue them", "addon", "bbq", "bua sang", "giuong phu")) {
            return "ADDON";
        }
        if (containsAny(normalizedMessage,
                "dat phong", "tim phong", "goi y phong", "phong nao", "con phong", "lich trong",
                "check in", "check-in", "nhan phong", "phong ngu", "giuong")) {
            return "BOOKING";
        }
        if ("BOOKING".equals(previousIntent) && normalizedMessage.length() <= 120) {
            return "BOOKING";
        }
        return "GENERAL";
    }

    private List<LocalDate> extractStayDates(String normalizedMessage) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate today = LocalDate.now();
        if (normalizedMessage.contains("ngay kia")) {
            dates.add(today.plusDays(2));
        } else if (normalizedMessage.contains("ngay mai")) {
            dates.add(today.plusDays(1));
        } else if (normalizedMessage.contains("hom nay") || normalizedMessage.contains("toi nay")) {
            dates.add(today);
        }

        Matcher matcher = DATE_PATTERN.matcher(normalizedMessage);
        while (matcher.find() && dates.size() < 2) {
            try {
                int day = Integer.parseInt(matcher.group(1));
                int month = Integer.parseInt(matcher.group(2));
                String yearGroup = matcher.group(3);
                int year = yearGroup == null
                        ? today.getYear()
                        : Integer.parseInt(yearGroup.length() == 2 ? "20" + yearGroup : yearGroup);
                LocalDate parsed = LocalDate.of(year, month, day);
                if (!dates.contains(parsed)) dates.add(parsed);
            } catch (RuntimeException ignored) {
                // Invalid natural-language date is handled as a missing field.
            }
        }
        return dates;
    }

    private Integer extractInteger(Pattern pattern, String normalizedMessage) {
        Matcher matcher = pattern.matcher(normalizedMessage);
        if (!matcher.find()) return null;
        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private List<AiSuggestedRoomResponse> filterAgentRooms(
            List<AiSuggestedRoomResponse> rooms,
            AgentContext context
    ) {
        return rooms.stream()
                .filter(room -> context.bedrooms() == null
                        || room.getBedroomCount() != null && room.getBedroomCount() >= context.bedrooms())
                .filter(room -> context.beds() == null
                        || room.getBedCount() != null && room.getBedCount() >= context.beds())
                .filter(room -> context.amenities().isEmpty() || context.amenities().stream().allMatch(amenity -> {
                    String searchable = normalize(blankToUnknown(room.getEquipmentSummary()) + " "
                            + String.join(" ", room.getEquipmentItems() == null ? List.of() : room.getEquipmentItems()));
                    return searchable.contains(normalize(amenity));
                }))
                .sorted(Comparator
                        .comparing((AiSuggestedRoomResponse room) -> room.getAverageRating() == null ? 0D : room.getAverageRating())
                        .reversed()
                        .thenComparing(AiSuggestedRoomResponse::getPricePerNight))
                .toList();
    }

    private Integer resolveSelectedRoomId(
            AgentContext context,
            String normalizedMessage,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms
    ) {
        if (!"BOOKING".equals(context.intent())) return context.selectedRoomId();

        List<AiSuggestedRoomResponse> mentioned = findMentionedRooms(allRooms, normalizedMessage);
        if (!mentioned.isEmpty()) return mentioned.get(0).getRoomId();

        if (containsAny(normalizedMessage, "phong dau tien", "phong so 1", "phong 1", "chon phong nay", "dat phong nay")
                && !matchedRooms.isEmpty()) {
            return matchedRooms.get(0).getRoomId();
        }
        return context.selectedRoomId();
    }

    private AgentTurn buildAgentTurn(
            AgentContext context,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms
    ) {
        if (!"BOOKING".equals(context.intent())) {
            return new AgentTurn("ANSWERING", List.of(), null);
        }

        List<String> missing = new ArrayList<>();
        if (context.checkInDate() == null) missing.add("checkInDate");
        if (context.checkOutDate() == null) missing.add("checkOutDate");
        if (context.adults() == null || context.adults() < 1) missing.add("guests");

        if (!missing.isEmpty()) {
            String question;
            if (missing.contains("checkInDate")) {
                question = "Bạn muốn nhận phòng ngày nào? Ví dụ: 20/07/2026.";
            } else if (missing.contains("checkOutDate")) {
                question = "Bạn muốn trả phòng ngày nào, hoặc ở mấy đêm?";
            } else {
                question = "Đoàn của bạn có bao nhiêu người lớn và trẻ em?";
            }
            String answer = "Mình đã ghi nhận nhu cầu hiện có" + summarizeContext(context)
                    + ". Để kiểm tra lịch phòng thật, " + lowerFirst(question);
            return new AgentTurn("COLLECTING_REQUIREMENTS", List.copyOf(missing), null, answer);
        }

        if (!context.checkOutDate().isAfter(context.checkInDate())) {
            return new AgentTurn(
                    "COLLECTING_REQUIREMENTS",
                    List.of("checkOutDate"),
                    null,
                    "Ngày trả phòng phải sau ngày nhận phòng. Bạn chọn lại ngày trả phòng giúp mình nhé."
            );
        }

        if (context.checkInDate().isBefore(LocalDate.now())) {
            return new AgentTurn(
                    "COLLECTING_REQUIREMENTS",
                    List.of("checkInDate", "checkOutDate"),
                    null,
                    "Ngày nhận phòng đã qua. Bạn chọn một kỳ lưu trú mới từ hôm nay trở đi để mình kiểm tra lịch thật nhé."
            );
        }

        if (matchedRooms.isEmpty()) {
            String answer = "Mình đã kiểm tra dữ liệu thật nhưng chưa có phòng đáp ứng trọn vẹn"
                    + summarizeContext(context)
                    + ". Bạn có thể đổi ngày, tăng ngân sách hoặc giảm một tiêu chí tiện nghi; mình sẽ kiểm tra lại ngay.";
            return new AgentTurn(
                    "NO_MATCH",
                    List.of(),
                    AiAgentActionResponse.builder().type("VIEW_ROOMS").label("Xem mọi phòng").href("/rooms").build(),
                    answer
            );
        }

        AiSuggestedRoomResponse selectedRoom = context.selectedRoomId() == null
                ? null
                : allRooms.stream().filter(room -> room.getRoomId().equals(context.selectedRoomId())).findFirst().orElse(null);
        if (selectedRoom != null && matchedRooms.stream().anyMatch(room -> room.getRoomId().equals(selectedRoom.getRoomId()))) {
            String answer = "Mình đã chuẩn bị **" + selectedRoom.getRoomName() + "** cho kỳ lưu trú "
                    + formatStay(context) + ", " + context.totalGuests() + " khách. Giá tham khảo "
                    + formatMoney(selectedRoom.getPricePerNight()) + "/đêm. Bấm nút bên dưới để kiểm tra lần cuối và xác nhận; phòng chỉ được giữ khi hệ thống tạo phiên thanh toán 5 phút.";
            return new AgentTurn(
                    "AWAITING_CONFIRMATION",
                    List.of(),
                    AiAgentActionResponse.builder()
                            .type("OPEN_BOOKING")
                            .label("Xác nhận đặt phòng")
                            .href(selectedRoom.getBookingUrl())
                            .roomId(selectedRoom.getRoomId())
                            .build(),
                    answer
            );
        }

        String roomNames = matchedRooms.stream().limit(3)
                .map(room -> "**" + room.getRoomName() + "** (" + formatMoney(room.getPricePerNight()) + "/đêm)")
                .collect(Collectors.joining(", "));
        String answer = "Mình tìm thấy " + matchedRooms.size() + " phòng còn trống " + formatStay(context)
                + " cho " + context.totalGuests() + " khách. Phù hợp nhất là " + roomNames
                + ". Bạn chọn tên một phòng hoặc bấm **Đặt phòng** trên thẻ để tiếp tục.";
        return new AgentTurn(
                "RECOMMENDING",
                List.of(),
                AiAgentActionResponse.builder().type("VIEW_ROOMS").label("Xem danh sách phù hợp").href(buildRoomsUrl(context)).build(),
                answer
        );
    }

    private AiConversationContextResponse toContextResponse(AgentContext context) {
        return AiConversationContextResponse.builder()
                .conversationId(context.conversationId())
                .intent(context.intent())
                .checkInDate(context.checkInDate())
                .checkOutDate(context.checkOutDate())
                .adults(context.adults())
                .children(context.children())
                .bedrooms(context.bedrooms())
                .beds(context.beds())
                .maxNightlyPrice(context.maxNightlyPrice())
                .amenities(context.amenities())
                .selectedRoomId(context.selectedRoomId())
                .build();
    }

    private String buildConversationMessage(List<AiChatTurnRequest> history, String currentMessage) {
        if (history == null || history.isEmpty()) return currentMessage;
        String transcript = history.stream()
                .filter(turn -> turn != null && turn.getContent() != null && !turn.getContent().isBlank())
                .skip(Math.max(0, history.size() - 8L))
                .map(turn -> ("assistant".equalsIgnoreCase(turn.getRole()) ? "Assistant" : "Guest")
                        + ": " + turn.getContent().trim())
                .collect(Collectors.joining("\n"));
        return transcript + "\nGuest: " + currentMessage;
    }

    private String summarizeContext(AgentContext context) {
        List<String> parts = new ArrayList<>();
        if (context.hasCompleteStay()) parts.add(formatStay(context));
        else if (context.checkInDate() != null) parts.add(" nhận phòng " + formatDate(context.checkInDate()));
        if (context.totalGuests() != null) parts.add(context.totalGuests() + " khách");
        if (context.bedrooms() != null) parts.add("từ " + context.bedrooms() + " phòng ngủ");
        if (context.beds() != null) parts.add("từ " + context.beds() + " giường");
        if (context.maxNightlyPrice() != null) parts.add("tối đa " + formatMoney(context.maxNightlyPrice()) + "/đêm");
        if (!context.amenities().isEmpty()) parts.add("có " + String.join(", ", context.amenities()));
        return parts.isEmpty() ? "" : ": " + String.join(", ", parts);
    }

    private String formatStay(AgentContext context) {
        return "từ " + formatDate(context.checkInDate()) + " đến " + formatDate(context.checkOutDate());
    }

    private String formatDate(LocalDate date) {
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String buildRoomsUrl(AgentContext context) {
        StringBuilder url = new StringBuilder("/rooms?checkIn=").append(context.checkInDate())
                .append("&checkOut=").append(context.checkOutDate())
                .append("&adults=").append(context.adults() == null ? context.totalGuests() : context.adults())
                .append("&children=").append(context.children() == null ? 0 : context.children());
        if (context.bedrooms() != null) url.append("&bedrooms=").append(context.bedrooms());
        if (context.beds() != null) url.append("&beds=").append(context.beds());
        if (context.maxNightlyPrice() != null) url.append("&maxPrice=").append(context.maxNightlyPrice().toPlainString());
        return url.toString();
    }

    private String buildRoomBookingUrl(Integer roomId, TimeRange timeRange) {
        if (timeRange == null) return "/rooms/" + roomId;
        return "/rooms/" + roomId
                + "?agentBooking=1&checkIn=" + timeRange.startTime().toLocalDate()
                + "&checkOut=" + timeRange.endTime().toLocalDate();
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) return true;
        }
        return false;
    }

    private Integer positiveOrNull(Integer value) {
        return value != null && value > 0 ? value : null;
    }

    private Integer nonNegativeOrNull(Integer value) {
        return value != null && value >= 0 ? value : null;
    }

    private String lowerFirst(String value) {
        if (value == null || value.isBlank()) return value;
        return Character.toLowerCase(value.charAt(0)) + value.substring(1);
    }

    @Override
    public List<String> getSuggestedQuestions() {
        return SUGGESTED_QUESTIONS;
    }

    private List<AiSuggestedRoomResponse> getRoomContext(TimeRange timeRange) {
        Map<Integer, List<EquipmentJpaEntity>> equipmentByRoom = getEquipmentByRoom();
        Map<Integer, ReviewRepository.RoomReviewStatsProjection> reviewStatsByRoom = getReviewStatsByRoom();
        Map<Integer, BookingRepository.RoomUpcomingBookingStatsProjection> bookingStatsByRoom = getBookingStatsByRoom();

        return roomRepository.findAllByOrderByRoomNameAsc().stream()
                .map(room -> toSuggestedRoom(
                        room,
                        timeRange,
                        equipmentByRoom.getOrDefault(room.getId(), List.of()),
                        reviewStatsByRoom.get(room.getId()),
                        bookingStatsByRoom.get(room.getId())
                ))
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour)
                        .thenComparing(AiSuggestedRoomResponse::getRoomName))
                .toList();
    }

    private List<AiSuggestedRoomResponse> safeGetRoomContext(TimeRange timeRange) {
        try {
            return getRoomContext(timeRange);
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private Map<Integer, List<EquipmentJpaEntity>> getEquipmentByRoom() {
        try {
            return equipmentRepository.search(null, null, null).stream()
                    .collect(Collectors.groupingBy(equipment -> equipment.getRoom().getId()));
        } catch (RuntimeException ignored) {
            return Map.of();
        }
    }

    private Map<Integer, ReviewRepository.RoomReviewStatsProjection> getReviewStatsByRoom() {
        try {
            return reviewRepository.findApprovedRoomReviewStats().stream()
                    .collect(Collectors.toMap(
                            ReviewRepository.RoomReviewStatsProjection::getRoomId,
                            stats -> stats
                    ));
        } catch (RuntimeException ignored) {
            return Map.of();
        }
    }

    private Map<Integer, BookingRepository.RoomUpcomingBookingStatsProjection> getBookingStatsByRoom() {
        try {
            LocalDateTime now = LocalDateTime.now();
            return bookingRepository.findUpcomingRoomBookingStats(
                            now,
                            now.plusDays(14),
                            ROOM_BLOCKING_STATUSES
                    )
                    .stream()
                    .collect(Collectors.toMap(
                            BookingRepository.RoomUpcomingBookingStatsProjection::getRoomId,
                            stats -> stats
                    ));
        } catch (RuntimeException ignored) {
            return Map.of();
        }
    }

    private AiSuggestedRoomResponse toSuggestedRoom(
            Room room,
            TimeRange timeRange,
            List<EquipmentJpaEntity> equipment,
            ReviewRepository.RoomReviewStatsProjection reviewStats,
            BookingRepository.RoomUpcomingBookingStatsProjection bookingStats
    ) {
        Boolean available = null;
        if (timeRange != null) {
            List<Booking> blockingBookings = bookingRepository.findBlockingBookings(
                    room.getId(),
                    timeRange.startTime(),
                    timeRange.endTime(),
                    ROOM_BLOCKING_STATUSES
            );
            available = blockingBookings.isEmpty();
        }

        return AiSuggestedRoomResponse.builder()
                .roomId(room.getId())
                .roomName(room.getRoomName())
                .roomTypeName(room.getRoomType().getTypeName())
                .roomTypeDescription(room.getRoomType().getDescription())
                .pricePerHour(room.getRoomType().getPricePerHour())
                .pricePerNight(room.getRoomType().getPricePerHour().multiply(NIGHT_STAY_HOURS))
                .capacity(room.getMaxPeople())
                .bedroomCount(room.getBedroomCount())
                .bedCount(room.getBedCount())
                .status(room.getStatus())
                .imageUrl(room.getImageUrl())
                .averageRating(reviewStats == null ? null : reviewStats.getAverageRating())
                .approvedReviewCount(reviewStats == null ? 0L : reviewStats.getReviewCount())
                .upcomingBookingCount(bookingStats == null ? 0L : bookingStats.getUpcomingBookingCount())
                .nextBookedStartTime(bookingStats == null || bookingStats.getNextStartTime() == null
                        ? null
                        : formatTime(bookingStats.getNextStartTime()))
                .equipmentSummary(buildEquipmentSummary(equipment, false))
                .unavailableEquipmentSummary(buildEquipmentSummary(equipment, true))
                .equipmentItems(buildEquipmentItems(equipment))
                .availableInRequestedTime(available)
                .reason(buildReason(room, available, equipment))
                .detailUrl("/rooms/" + room.getId())
                .bookingUrl(buildRoomBookingUrl(room.getId(), timeRange))
                .build();
    }

    private List<AiSuggestedRoomResponse> filterRooms(
            List<AiSuggestedRoomResponse> rooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        return rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .filter(room -> people == null || room.getCapacity() != null && room.getCapacity() >= people)
                .filter(room -> maxPrice == null || room.getPricePerHour().compareTo(maxPrice) <= 0)
                .filter(room -> timeRange == null || Boolean.TRUE.equals(room.getAvailableInRequestedTime()))
                .toList();
    }

    private String buildAnswer(
            String normalizedMessage,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        Optional<String> policyAnswer = buildPolicyAnswer(normalizedMessage);
        if (policyAnswer.isPresent()) {
            return policyAnswer.get();
        }

        if (allRooms.isEmpty()) {
            return "Hiện hệ thống chưa có dữ liệu phòng. Bạn thử quay lại sau hoặc liên hệ nhân viên để được hỗ trợ nhé.";
        }

        if (isAskingCheapestRoom(normalizedMessage)) {
            return buildCheapestRoomAnswer(matchedRooms.isEmpty() ? allRooms : matchedRooms);
        }

        if (isAskingRoomKnowledge(normalizedMessage)) {
            return buildRoomKnowledgeAnswer(allRooms, normalizedMessage);
        }

        if (isAskingAllRooms(normalizedMessage)) {
            return buildAllRoomsAnswer(allRooms);
        }

        if (matchedRooms.isEmpty()) {
            return buildNoRoomAnswer(allRooms, people, maxPrice, timeRange);
        }

        StringBuilder answer = new StringBuilder("Mình tìm thấy ");
        answer.append(matchedRooms.size()).append(" phòng phù hợp");

        if (people != null) {
            answer.append(" cho khoảng ").append(people).append(" người");
        }
        if (maxPrice != null) {
            answer.append(", giá không quá ").append(formatMoney(maxPrice)).append("/giờ");
        }
        if (timeRange != null) {
            answer.append(", còn trống từ ")
                    .append(formatTime(timeRange.startTime()))
                    .append(" đến ")
                    .append(formatTime(timeRange.endTime()));
        }
        answer.append(". ");

        answer.append("Bạn có thể tham khảo: ");
        answer.append(formatRoomList(matchedRooms));
        answer.append(".");

        if (timeRange == null) {
            answer.append(" Nếu bạn cho mình thêm ngày giờ muốn đặt, mình sẽ kiểm tra lịch trống chính xác hơn nha.");
        }

        return answer.toString();
    }

    private Optional<String> buildPolicyAnswer(String normalizedMessage) {
        if (containsAny(normalizedMessage, "xin chao", "chao ban", "hello", "hi homebot")
                && !containsAny(normalizedMessage, "phong", "dat", "gia", "thanh toan")) {
            return Optional.of("Chào bạn! Mình là HomeBot, trợ lý đặt phòng của The Serene Villa. Mình có thể tìm phòng theo ngày ở, số khách, ngân sách, số phòng ngủ, số giường và tiện nghi; đồng thời giải đáp về thanh toán, hủy phòng, ưu đãi và dịch vụ thuê thêm. Bạn đang dự định đi vào ngày nào?");
        }
        if (isAskingBookingGuide(normalizedMessage)) {
            return Optional.of("Để đặt phòng, bạn chọn phòng phù hợp, chọn ngày và khung giờ còn trống, kiểm tra tổng tiền, nhập coupon nếu có, rồi xác nhận đặt phòng. Sau đó hệ thống sẽ chuyển sang bước thanh toán SePay.");
        }
        if (isAskingPayment(normalizedMessage)) {
            return Optional.of("Hệ thống hỗ trợ thanh toán tiền mặt tại homestay hoặc thanh toán online qua SePay. Với online, bạn có thể đặt cọc 50% hoặc thanh toán toàn bộ tiền phòng. Mỗi mã QR và thời gian giữ phòng có hiệu lực đúng 5 phút; nếu hết hạn mà chưa thanh toán, phòng sẽ tự được nhả để khách khác đặt.");
        }
        if (isAskingCancellation(normalizedMessage)) {
            return Optional.of("Bạn có thể hủy lịch của mình nếu còn trước giờ nhận phòng tối thiểu 24 tiếng. Luồng hiện tại tính hoàn 100% số tiền đã thanh toán, nhưng việc chuyển tiền hoàn từ cổng thanh toán thật vẫn là bước vận hành riêng.");
        }
        if (isAskingCoupon(normalizedMessage)) {
            return Optional.of("Ma giam gia duoc nhap o buoc checkout. He thong se kiem tra ma ton tai, con han va gia tri don toi thieu truoc khi tinh tien. "
                    + buildCouponContext());
        }
        if (containsAny(normalizedMessage, "dich vu them", "thue them", "addon", "bua sang", "giuong phu", "bbq")) {
            return Optional.of("Bạn có thể chọn dịch vụ thuê thêm ngay trong bước xác nhận đặt phòng; sau khi check-in, các dịch vụ còn phục vụ cũng có thể được gọi thêm từ chi tiết booking. Giá và tình trạng phục vụ luôn lấy từ danh mục thật do admin quản lý, sau đó phần phát sinh sẽ được cộng vào số tiền cần kết toán.");
        }
        if (containsAny(normalizedMessage, "check in", "check-in", "nhan phong", "check out", "check-out", "tra phong")) {
            return Optional.of("Giờ nhận phòng tiêu chuẩn là 14:00 và trả phòng trước 12:00 ngày cuối cùng, tương ứng 1 đêm = 22 giờ. Nhân viên có thể check-in sớm tối đa 5 phút khi phòng đã sẵn sàng; nếu khách đến muộn sau 14:00, booking hợp lệ vẫn được nhân viên xử lý trong ca phụ trách.");
        }
        return Optional.empty();
    }

    private String buildSystemPrompt() {
        return """
                You are the The Serene Villa Management room consultant.
                Answer in friendly Vietnamese without markdown tables.
                Use only the provided room, booking, price, and policy context.
                Room context can include tier description, image URL, amenities, unavailable amenities, review rating, status, capacity, and requested-time availability.
                Understand short customer messages by intent: "4 nguoi" means they need a room for 4 people; "toi nay 18h-20h" means availability for that time; "phong co wifi/dieu hoa/tv/may nuoc nong" means amenity filtering.
                When the customer asks for a room, always recommend concrete room names from context when possible.
                Do not answer with generic uncertainty if the database context contains matching rooms or close alternatives.
                Do not invent room names, prices, capacity, availability, promotions, or payment rules.
                First answer the customer's direct question, then suggest the next best action.
                If no room fully matches, explain the blocking reason and suggest the closest alternatives from context.
                If the context is not enough, ask one short follow-up question.
                Keep the answer concise and practical for a guest who wants to book a homestay room.
                """;
    }

    private String buildGeminiPrompt(
            String originalMessage,
            List<AiSuggestedRoomResponse> matchedRooms,
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange,
            String fallbackAnswer
    ) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Customer message: ").append(originalMessage).append("\n\n");
        prompt.append("Current system time: ").append(formatTime(LocalDateTime.now())).append("\n\n");
        prompt.append("Interpreted filters:\n");
        prompt.append("- people: ").append(people == null ? "unknown" : people).append("\n");
        prompt.append("- max price per hour: ").append(maxPrice == null ? "unknown" : formatMoney(maxPrice)).append("\n");
        prompt.append("- requested time: ");
        if (timeRange == null) {
            prompt.append("unknown\n\n");
        } else {
            prompt.append(formatTime(timeRange.startTime()))
                    .append(" to ")
                    .append(formatTime(timeRange.endTime()))
                    .append("\n\n");
        }

        prompt.append("Business policy context:\n");
        prompt.append("- Guests can ask for homestay room suggestions by people count, budget, stay time, and desired amenities.\n");
        prompt.append("- A room in MAINTENANCE must not be suggested as bookable.\n");
        prompt.append("- If a requested time is known, only rooms with availableInRequestedTime=true are bookable for that time.\n");
        prompt.append("- Online checkout uses SePay. Customers may pay a 50% deposit or the full amount in the next checkout step.\n");
        prompt.append("- A payment QR and its room hold are valid for exactly 5 minutes. Chatting or viewing a room never holds it.\n");
        prompt.append("- Coupon validation is handled separately at checkout; do not promise a coupon unless context says so.\n\n");
        prompt.append("- If the user asks how to book, guide them to choose a room, choose time, confirm booking, then pay online.\n");
        prompt.append("- If the user asks about cancellation, say customer cancellation is supported before the policy deadline shown in their booking flow.\n\n");
        prompt.append("Active coupon context:\n");
        prompt.append(buildCouponContext()).append("\n\n");
        prompt.append("Privacy rule:\n");
        prompt.append("- Never reveal guest names, emails, phone numbers, booking notes, payment references, secrets, or another guest's booking detail.\n");
        prompt.append("- You may discuss only public room facts, amenity facts, review aggregates, coupon rules, and availability/booking aggregates.\n\n");

        prompt.append("Matched rooms to prioritize:\n");
        appendRoomContext(prompt, matchedRooms);
        prompt.append("\nAll room context from database:\n");
        appendRoomContext(prompt, allRooms);
        prompt.append("\nDeterministic fallback answer:\n");
        prompt.append(fallbackAnswer).append("\n\n");
        prompt.append("Write the final answer now. Mention 1-3 best rooms when useful.");
        return prompt.toString();
    }

    private void appendRoomContext(StringBuilder prompt, List<AiSuggestedRoomResponse> rooms) {
        if (rooms.isEmpty()) {
            prompt.append("- none\n");
            return;
        }

        rooms.stream()
                .forEach(room -> prompt.append("- ")
                        .append("id=").append(room.getRoomId())
                        .append(" | name=")
                        .append(room.getRoomName())
                        .append(" | type=").append(room.getRoomTypeName())
                        .append(" | typeDescription=").append(blankToUnknown(room.getRoomTypeDescription()))
                        .append(" | price=").append(formatMoney(room.getPricePerHour()))
                        .append("/hour | capacity=")
                        .append(room.getCapacity() == null ? "unknown" : room.getCapacity())
                        .append(" | status=").append(room.getStatus())
                        .append(" | imageUrl=").append(blankToUnknown(room.getImageUrl()))
                        .append(" | averageRating=").append(formatRating(room))
                        .append(" | upcomingBookingsNext14Days=").append(room.getUpcomingBookingCount() == null ? 0 : room.getUpcomingBookingCount())
                        .append(" | nextBookedStartTime=").append(blankToUnknown(room.getNextBookedStartTime()))
                        .append(" | equipment=").append(blankToUnknown(room.getEquipmentSummary()))
                        .append(" | unavailableEquipment=").append(blankToUnknown(room.getUnavailableEquipmentSummary()))
                        .append(" | equipmentDetails=").append(room.getEquipmentItems() == null || room.getEquipmentItems().isEmpty()
                                ? "unknown"
                                : String.join(" / ", room.getEquipmentItems()))
                        .append(" | availableInRequestedTime=")
                        .append(room.getAvailableInRequestedTime() == null ? "unknown" : room.getAvailableInRequestedTime())
                        .append(" | reason=").append(room.getReason())
                        .append("\n"));
    }

    private String buildRoomKnowledgeAnswer(List<AiSuggestedRoomResponse> rooms, String normalizedMessage) {
        if (rooms.isEmpty()) {
            return "Hien he thong chua co du lieu phong.";
        }

        List<String> equipmentKeywords = findEquipmentKeywords(normalizedMessage);
        List<AiSuggestedRoomResponse> targetRooms = findMentionedRooms(rooms, normalizedMessage);
        if (targetRooms.isEmpty()) {
            targetRooms = rooms;
        }

        if (!equipmentKeywords.isEmpty()) {
            targetRooms = targetRooms.stream()
                    .filter(room -> {
                        String equipmentSummary = normalize(blankToUnknown(room.getEquipmentSummary()));
                        return equipmentKeywords.stream().allMatch(equipmentSummary::contains);
                    })
                    .toList();
            if (targetRooms.isEmpty()) {
                return "Minh chua thay phong nao co thiet bi phu hop voi yeu cau nay trong du lieu hien tai.";
            }
        }

        if (isAskingRating(normalizedMessage)) {
            targetRooms = targetRooms.stream()
                    .sorted(Comparator.comparing(
                            (AiSuggestedRoomResponse room) -> room.getAverageRating() == null ? -1D : room.getAverageRating()
                    ).reversed().thenComparing(AiSuggestedRoomResponse::getRoomName))
                    .toList();
        }

        return "Minh co thong tin phong nhu sau: "
                + targetRooms.stream()
                .map(this::formatDetailedRoom)
                .reduce((first, second) -> first + " | " + second)
                .orElse("chua co phong phu hop")
                + ".";
    }

    private List<AiSuggestedRoomResponse> findMentionedRooms(
            List<AiSuggestedRoomResponse> rooms,
            String normalizedMessage
    ) {
        return rooms.stream()
                .filter(room -> {
                    String normalizedName = normalize(room.getRoomName());
                    if (normalizedMessage.contains(normalizedName)) {
                        return true;
                    }
                    for (String part : normalizedName.split("\\s*-\\s*")) {
                        String trimmed = part.trim();
                        if (trimmed.length() >= 4 && normalizedMessage.contains(trimmed)) {
                            return true;
                        }
                    }
                    return false;
                })
                .toList();
    }

    private List<String> findEquipmentKeywords(String normalizedMessage) {
        List<String> keywords = new ArrayList<>();
        if (normalizedMessage.contains("wifi") || normalizedMessage.contains("wi-fi")) {
            keywords.add("wi-fi");
        }
        if (normalizedMessage.contains("dieu hoa") || normalizedMessage.contains("may lanh")) {
            keywords.add("dieu hoa");
        }
        if (normalizedMessage.contains("tv") || normalizedMessage.contains("tivi")) {
            keywords.add("tv");
        }
        if (normalizedMessage.contains("may nuoc nong") || normalizedMessage.contains("binh nuoc nong")) {
            keywords.add("nuoc nong");
        }
        return keywords;
    }

    private String formatDetailedRoom(AiSuggestedRoomResponse room) {
        StringBuilder detail = new StringBuilder()
                .append(room.getRoomName())
                .append(" - ")
                .append(room.getRoomTypeName())
                .append(", gia ")
                .append(formatMoney(room.getPricePerHour()))
                .append("/gio")
                .append(capacityText(room))
                .append(statusText(room));

        if (room.getRoomTypeDescription() != null && !room.getRoomTypeDescription().isBlank()) {
            detail.append(", mo ta: ").append(room.getRoomTypeDescription());
        }
        detail.append(", danh gia: ").append(formatRating(room));
        if (room.getEquipmentSummary() != null && !room.getEquipmentSummary().isBlank()) {
            detail.append(", thiet bi san sang: ").append(room.getEquipmentSummary());
        }
        if (room.getUnavailableEquipmentSummary() != null && !room.getUnavailableEquipmentSummary().isBlank()) {
            detail.append(", thiet bi khong san sang: ").append(room.getUnavailableEquipmentSummary());
        }
        return detail.toString();
    }

    private String buildAllRoomsAnswer(List<AiSuggestedRoomResponse> rooms) {
        return "Hien he thong co cac phong sau: "
                + rooms.stream()
                .map(this::formatDetailedRoom)
                .reduce((first, second) -> first + " | " + second)
                .orElse("chua co du lieu phong")
                + ".";
    }

    private String buildCheapestRoomAnswer(List<AiSuggestedRoomResponse> rooms) {
        List<AiSuggestedRoomResponse> activeRooms = rooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                .toList();

        if (activeRooms.isEmpty()) {
            return "Hiện chưa có phòng nào sẵn sàng để tư vấn. Bạn thử lại sau nhé.";
        }

        AiSuggestedRoomResponse cheapestRoom = activeRooms.get(0);
        return "Phòng rẻ nhất hiện tại là " + cheapestRoom.getRoomName()
                + ", giá " + formatMoney(cheapestRoom.getPricePerHour()) + "/giờ"
                + capacityText(cheapestRoom)
                + ".";
    }

    private String buildNoRoomAnswer(
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        StringBuilder answer = new StringBuilder("Mình chưa tìm thấy phòng phù hợp với yêu cầu này.");

        if (people != null) {
            boolean hasCapacityData = allRooms.stream().anyMatch(room -> room.getCapacity() != null);
            if (!hasCapacityData) {
                answer.append(" Hiện DB chưa có dữ liệu sức chứa phòng, nên mình không thể tư vấn chính xác theo số lượng ")
                        .append(people)
                        .append(" người.");
            } else {
                answer.append(" Không có phòng nào đủ sức chứa cho ")
                        .append(people)
                        .append(" người.");
            }
        }

        if (maxPrice != null) {
            answer.append(" Bạn cũng đang giới hạn ngân sách ")
                    .append(formatMoney(maxPrice))
                    .append("/giờ.");
        }

        if (timeRange != null) {
            answer.append(" Khung giờ bạn hỏi là ")
                    .append(formatTime(timeRange.startTime()))
                    .append(" đến ")
                    .append(formatTime(timeRange.endTime()))
                    .append(".");
        } else {
            answer.append(" Bạn có thể cho mình thêm ngày giờ muốn đặt để mình kiểm tra lịch trống chính xác hơn nhé.");
        }

        String alternatives = buildAlternativeSuggestions(allRooms, people, maxPrice, timeRange);
        if (!alternatives.isBlank()) {
            answer.append(" ").append(alternatives);
        }

        return answer.toString();
    }

    private String buildAlternativeSuggestions(
            List<AiSuggestedRoomResponse> allRooms,
            Integer people,
            BigDecimal maxPrice,
            TimeRange timeRange
    ) {
        List<AiSuggestedRoomResponse> activeRooms = allRooms.stream()
                .filter(room -> room.getStatus() != RoomStatus.MAINTENANCE)
                .toList();

        if (activeRooms.isEmpty()) {
            return "";
        }

        if (timeRange != null && people != null) {
            List<AiSuggestedRoomResponse> enoughCapacityButBusy = activeRooms.stream()
                    .filter(room -> room.getCapacity() != null && room.getCapacity() >= people)
                    .filter(room -> Boolean.FALSE.equals(room.getAvailableInRequestedTime()))
                    .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                    .limit(3)
                    .toList();
            if (!enoughCapacityButBusy.isEmpty()) {
                return "Có phòng đủ sức chứa nhưng đang bận khung giờ này: "
                        + formatRoomList(enoughCapacityButBusy)
                        + ". Bạn thử đổi giờ hoặc chọn ngày khác nhé.";
            }
        }

        if (people != null) {
            List<AiSuggestedRoomResponse> closestCapacity = activeRooms.stream()
                    .filter(room -> room.getCapacity() != null)
                    .sorted(Comparator.comparing(AiSuggestedRoomResponse::getCapacity).reversed()
                            .thenComparing(AiSuggestedRoomResponse::getPricePerHour))
                    .limit(3)
                    .toList();
            if (!closestCapacity.isEmpty()) {
                return "Phương án gần nhất theo sức chứa là: " + formatRoomList(closestCapacity) + ".";
            }
        }

        if (maxPrice != null) {
            List<AiSuggestedRoomResponse> closestPrice = activeRooms.stream()
                    .sorted(Comparator.comparing(AiSuggestedRoomResponse::getPricePerHour))
                    .limit(3)
                    .toList();
            if (!closestPrice.isEmpty()) {
                return "Các phòng rẻ nhất hiện có là: " + formatRoomList(closestPrice) + ".";
            }
        }

        return "";
    }

    private String formatRoomList(List<AiSuggestedRoomResponse> rooms) {
        return rooms.stream()
                .map(room -> room.getRoomName()
                        + " - " + room.getRoomTypeName()
                        + ", " + formatMoney(room.getPricePerHour()) + "/giờ"
                        + capacityText(room)
                        + statusText(room))
                .reduce((first, second) -> first + "; " + second)
                .orElse("chưa có phòng phù hợp");
    }

    private List<String> buildEquipmentItems(List<EquipmentJpaEntity> equipment) {
        return equipment.stream()
                .sorted(Comparator.comparing((EquipmentJpaEntity item) -> item.getType().name())
                        .thenComparing(EquipmentJpaEntity::getName))
                .map(this::formatEquipment)
                .toList();
    }

    private String buildEquipmentSummary(List<EquipmentJpaEntity> equipment, boolean unavailableOnly) {
        if (equipment.isEmpty()) {
            return unavailableOnly ? "" : "chua co du lieu thiet bi";
        }

        List<String> items = equipment.stream()
                .filter(item -> unavailableOnly
                        ? !"GOOD".equals(item.getStatus().name())
                        : "GOOD".equals(item.getStatus().name()))
                .sorted(Comparator.comparing((EquipmentJpaEntity item) -> item.getType().name())
                        .thenComparing(EquipmentJpaEntity::getName))
                .map(item -> item.getType() + " - " + item.getName())
                .toList();

        if (items.isEmpty()) {
            return unavailableOnly ? "" : "chua co thiet bi san sang";
        }
        return String.join("; ", items);
    }

    private String formatEquipment(EquipmentJpaEntity equipment) {
        StringBuilder text = new StringBuilder()
                .append(equipment.getType())
                .append(" - ")
                .append(equipment.getName())
                .append(" (")
                .append(equipment.getStatus())
                .append(")");
        if (equipment.getNotes() != null && !equipment.getNotes().isBlank()) {
            text.append(": ").append(equipment.getNotes());
        }
        return text.toString();
    }

    private String buildReason(Room room, Boolean available, List<EquipmentJpaEntity> equipment) {
        List<String> reasons = new ArrayList<>();
        reasons.add("Giá " + formatMoney(room.getRoomType().getPricePerHour()) + "/giờ");

        if (room.getMaxPeople() != null) {
            reasons.add("sức chứa tối đa " + room.getMaxPeople() + " người");
        } else {
            reasons.add("chưa có dữ liệu sức chứa");
        }

        if (available != null) {
            reasons.add(available ? "còn trống trong khung giờ yêu cầu" : "đã có lịch trong khung giờ yêu cầu");
        }

        String equipmentSummary = buildEquipmentSummary(equipment, false);
        if (!equipmentSummary.isBlank()) {
            reasons.add("tien nghi san sang: " + equipmentSummary);
        }

        return String.join(", ", reasons);
    }

    private String capacityText(AiSuggestedRoomResponse room) {
        return room.getCapacity() == null ? ", chưa có dữ liệu sức chứa" : ", tối đa " + room.getCapacity() + " người";
    }

    private String statusText(AiSuggestedRoomResponse room) {
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            return ", đang bảo trì";
        }
        if (Boolean.TRUE.equals(room.getAvailableInRequestedTime())) {
            return ", đang trống";
        }
        if (Boolean.FALSE.equals(room.getAvailableInRequestedTime())) {
            return ", đã có lịch";
        }
        return "";
    }

    private boolean isAskingRoomKnowledge(String normalizedMessage) {
        return normalizedMessage.contains("thiet bi")
                || normalizedMessage.contains("tien nghi")
                || normalizedMessage.contains("wifi")
                || normalizedMessage.contains("wi-fi")
                || normalizedMessage.contains("dieu hoa")
                || normalizedMessage.contains("may lanh")
                || normalizedMessage.contains("tv")
                || normalizedMessage.contains("tivi")
                || normalizedMessage.contains("may nuoc nong")
                || normalizedMessage.contains("binh nuoc nong")
                || normalizedMessage.contains("chi tiet phong")
                || normalizedMessage.contains("thong tin phong")
                || normalizedMessage.contains("danh gia")
                || normalizedMessage.contains("duoc danh gia cao")
                || normalizedMessage.contains("tot nhat")
                || normalizedMessage.contains("review")
                || normalizedMessage.contains("rating")
                || normalizedMessage.contains("phong co gi")
                || normalizedMessage.contains("xem phong")
                || normalizedMessage.contains("tat ca phong")
                || normalizedMessage.contains("danh sach phong")
                || normalizedMessage.contains("co nhung phong nao");
    }

    private boolean isAskingRating(String normalizedMessage) {
        return normalizedMessage.contains("danh gia")
                || normalizedMessage.contains("duoc danh gia cao")
                || normalizedMessage.contains("tot nhat")
                || normalizedMessage.contains("review")
                || normalizedMessage.contains("rating");
    }

    private boolean isAskingAllRooms(String normalizedMessage) {
        return normalizedMessage.contains("tat ca phong")
                || normalizedMessage.contains("danh sach phong")
                || normalizedMessage.contains("co nhung phong nao")
                || normalizedMessage.contains("xem phong");
    }

    private boolean isAskingCheapestRoom(String normalizedMessage) {
        return normalizedMessage.contains("re nhat")
                || normalizedMessage.contains("gia thap nhat")
                || normalizedMessage.contains("phong re");
    }

    private boolean isAskingBookingGuide(String normalizedMessage) {
        return normalizedMessage.contains("huong dan dat")
                || normalizedMessage.contains("cach dat")
                || normalizedMessage.contains("lam sao dat")
                || normalizedMessage.contains("dat phong nhu the nao")
                || normalizedMessage.contains("quy trinh dat");
    }

    private boolean isAskingPayment(String normalizedMessage) {
        return normalizedMessage.contains("thanh toan")
                || normalizedMessage.contains("chuyen khoan")
                || normalizedMessage.contains("sepay")
                || normalizedMessage.contains("dat coc")
                || normalizedMessage.contains("coc bao nhieu")
                || normalizedMessage.contains("tra tien");
    }

    private boolean isAskingCancellation(String normalizedMessage) {
        return normalizedMessage.contains("huy lich")
                || normalizedMessage.contains("huy phong")
                || normalizedMessage.contains("huy booking")
                || normalizedMessage.contains("hoan tien")
                || normalizedMessage.contains("refund")
                || normalizedMessage.contains("doi lich");
    }

    private boolean isAskingCoupon(String normalizedMessage) {
        return normalizedMessage.contains("coupon")
                || normalizedMessage.contains("ma giam gia")
                || normalizedMessage.contains("giam gia")
                || normalizedMessage.contains("voucher");
    }

    private TimeRange resolveTimeRange(AiChatRequest request, String normalizedMessage) {
        if (request.getStartTime() != null && request.getEndTime() != null) {
            validateTimeRange(request.getStartTime(), request.getEndTime());
            return new TimeRange(request.getStartTime(), request.getEndTime());
        }

        return extractHourRange(normalizedMessage)
                .or(() -> extractStartWithDuration(normalizedMessage))
                .orElse(null);
    }

    private Optional<TimeRange> extractStartWithDuration(String normalizedMessage) {
        Matcher startMatcher = START_HOUR_PATTERN.matcher(normalizedMessage);
        Matcher durationMatcher = DURATION_PATTERN.matcher(normalizedMessage);
        if (!startMatcher.find() || !durationMatcher.find()) {
            return Optional.empty();
        }

        int startHour = Integer.parseInt(startMatcher.group(1));
        int startMinute = parseMinute(startMatcher.group(2));
        int durationHours = Integer.parseInt(durationMatcher.group(1));
        if (!isValidHourMinute(startHour, startMinute, false) || durationHours <= 0 || durationHours > 12) {
            return Optional.empty();
        }

        LocalDate date = resolveRequestedDate(normalizedMessage, startHour, startMinute);
        LocalDateTime startTime = LocalDateTime.of(date, LocalTime.of(startHour, startMinute));
        LocalDateTime endTime = startTime.plusHours(durationHours);
        return Optional.of(new TimeRange(startTime, endTime));
    }

    private Optional<TimeRange> extractHourRange(String normalizedMessage) {
        Matcher matcher = HOUR_RANGE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int startHour = Integer.parseInt(matcher.group(1));
        int startMinute = parseMinute(matcher.group(2));
        int endHour = Integer.parseInt(matcher.group(3));
        int endMinute = parseMinute(matcher.group(4));
        if (!isValidHourMinute(startHour, startMinute, false) || !isValidHourMinute(endHour, endMinute, true)) {
            return Optional.empty();
        }

        LocalDate date = resolveRequestedDate(normalizedMessage, startHour, startMinute);
        LocalTime start = LocalTime.of(startHour, startMinute);
        LocalTime end = endHour == 24 ? LocalTime.MAX : LocalTime.of(endHour, endMinute);
        if (!start.isBefore(end)) {
            return Optional.empty();
        }

        return Optional.of(new TimeRange(LocalDateTime.of(date, start), LocalDateTime.of(date, end)));
    }

    private LocalDate resolveRequestedDate(String normalizedMessage, int startHour, int startMinute) {
        Optional<LocalDate> explicitDate = extractExplicitDate(normalizedMessage);
        if (explicitDate.isPresent()) {
            return explicitDate.get();
        }

        LocalDate date = LocalDate.now();
        if (normalizedMessage.contains("ngay kia") || normalizedMessage.contains("mot kia")) {
            return date.plusDays(2);
        }
        if (normalizedMessage.contains("ngay mai") || normalizedMessage.contains("mai")) {
            return date.plusDays(1);
        }
        if (normalizedMessage.contains("hom nay") || normalizedMessage.contains("nay")) {
            return date;
        }

        return LocalTime.of(startHour, startMinute).isBefore(LocalTime.now()) ? date.plusDays(1) : date;
    }

    private Optional<LocalDate> extractExplicitDate(String normalizedMessage) {
        Matcher matcher = DATE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        int day = Integer.parseInt(matcher.group(1));
        int month = Integer.parseInt(matcher.group(2));
        String rawYear = matcher.group(3);
        int year = rawYear == null ? LocalDate.now().getYear() : Integer.parseInt(rawYear);
        if (year < 100) {
            year += 2000;
        }

        try {
            return Optional.of(LocalDate.of(year, month, day));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private int parseMinute(String value) {
        return value == null || value.isBlank() ? 0 : Integer.parseInt(value);
    }

    private boolean isValidHourMinute(int hour, int minute, boolean allowTwentyFour) {
        int maxHour = allowTwentyFour ? 24 : 23;
        if (hour < 0 || hour > maxHour || minute < 0 || minute > 59) {
            return false;
        }
        return hour != 24 || minute == 0;
    }

    private Optional<Integer> extractPeople(String normalizedMessage) {
        Matcher matcher = PEOPLE_PATTERN.matcher(normalizedMessage);
        if (!matcher.find()) {
            return Optional.empty();
        }

        return Optional.of(Integer.parseInt(matcher.group(1)));
    }

    private Optional<BigDecimal> extractMaxPrice(String normalizedMessage) {
        Matcher matcher = PRICE_PATTERN.matcher(normalizedMessage);
        while (matcher.find()) {
            BigDecimal value = new BigDecimal(matcher.group(1).replace(',', '.'));
            String unit = matcher.group(2);
            if (unit.equals("k") || unit.equals("nghin") || unit.equals("ngan")) {
                return Optional.of(value.multiply(BigDecimal.valueOf(1000)));
            }
            if (unit.equals("trieu") || unit.equals("m")) {
                return Optional.of(value.multiply(BigDecimal.valueOf(1_000_000)));
            }
            return Optional.of(value);
        }

        return Optional.empty();
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
        }
    }

    private String normalize(String value) {
        String lowerCaseValue = value.toLowerCase();
        String normalizedValue = Normalizer.normalize(lowerCaseValue, Normalizer.Form.NFD);
        return normalizedValue.replaceAll("\\p{M}", "").replace('đ', 'd');
    }

    private boolean isLikelyIncompleteAnswer(String answer) {
        if (answer == null || answer.isBlank()) {
            return true;
        }

        String trimmed = answer.trim();
        if (trimmed.matches(".*[.!?]$")) {
            return false;
        }

        String normalized = normalize(trimmed).trim();
        return trimmed.endsWith(",")
                || trimmed.endsWith(":")
                || trimmed.endsWith(";")
                || trimmed.endsWith("-")
                || normalized.matches(".*\\b(co the|la|gom|nhu|voi|va|hoac|tu|den|de|cho|ban|phong|mot so|tham khao)$");
    }

    private String blankToUnknown(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }

    private String buildCouponContext() {
        List<DiscountCode> activeCoupons;
        try {
            LocalDate today = LocalDate.now();
            activeCoupons = discountCodeRepository.findAll().stream()
                    .filter(coupon -> coupon.getExpiresAt() == null || !coupon.getExpiresAt().isBefore(today))
                    .sorted(Comparator.comparing(DiscountCode::getCode, String.CASE_INSENSITIVE_ORDER))
                    .toList();
        } catch (RuntimeException ignored) {
            return "Coupon data is temporarily unavailable.";
        }

        if (activeCoupons.isEmpty()) {
            return "No active coupon data is available right now.";
        }

        return "Active coupons: " + activeCoupons.stream()
                .map(this::formatCoupon)
                .collect(Collectors.joining("; "));
    }

    private String formatCoupon(DiscountCode coupon) {
        StringBuilder text = new StringBuilder()
                .append(coupon.getCode())
                .append(" - ")
                .append(formatDiscountValue(coupon));

        if (coupon.getMinOrderValue() != null && coupon.getMinOrderValue().compareTo(BigDecimal.ZERO) > 0) {
            text.append(", min order ").append(formatMoney(coupon.getMinOrderValue()));
        }
        if (coupon.getExpiresAt() != null) {
            text.append(", expires ").append(coupon.getExpiresAt());
        }
        return text.toString();
    }

    private String formatDiscountValue(DiscountCode coupon) {
        if (coupon.getType() == null || coupon.getValue() == null) {
            return "discount value unknown";
        }
        if ("PERCENTAGE".equals(coupon.getType().name())) {
            return coupon.getValue().stripTrailingZeros().toPlainString() + "% off";
        }
        return formatMoney(coupon.getValue()) + " off";
    }

    private String formatRating(AiSuggestedRoomResponse room) {
        if (room.getAverageRating() == null || room.getApprovedReviewCount() == null || room.getApprovedReviewCount() == 0) {
            return "chua co review da duyet";
        }
        return String.format("%.1f/5 (%d review)", room.getAverageRating(), room.getApprovedReviewCount());
    }

    private String formatMoney(BigDecimal amount) {
        return amount.stripTrailingZeros().toPlainString() + "đ";
    }

    private String formatTime(LocalDateTime time) {
        return time.format(PROMPT_TIME_FORMATTER);
    }

    private record TimeRange(LocalDateTime startTime, LocalDateTime endTime) {
    }

    private record AgentContext(
            String conversationId,
            String intent,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer adults,
            Integer children,
            Integer bedrooms,
            Integer beds,
            BigDecimal maxNightlyPrice,
            List<String> amenities,
            Integer selectedRoomId
    ) {
        private Integer totalGuests() {
            if (adults == null && children == null) return null;
            return (adults == null ? 0 : adults) + (children == null ? 0 : children);
        }

        private boolean hasCompleteStay() {
            return checkInDate != null && checkOutDate != null;
        }

        private AgentContext withSelectedRoomId(Integer roomId) {
            return new AgentContext(
                    conversationId, intent, checkInDate, checkOutDate, adults, children,
                    bedrooms, beds, maxNightlyPrice, amenities, roomId
            );
        }
    }

    private record AgentTurn(
            String state,
            List<String> missingFields,
            AiAgentActionResponse action,
            String answer
    ) {
        private AgentTurn(String state, List<String> missingFields, AiAgentActionResponse action) {
            this(state, missingFields, action, "");
        }
    }
}
