package backend.room.application.service;

import backend.dto.response.PagedResponse;
import backend.dto.response.RoomResponse;
import backend.dto.response.RoomTypeResponse;
import backend.entity.Role;
import backend.entity.Room;
import backend.entity.RoomStatus;
import backend.entity.RoomType;
import backend.entity.User;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.room.application.port.in.CreateRoomUseCase;
import backend.room.application.port.in.CreateRoomTypeUseCase;
import backend.room.application.port.in.DeleteRoomUseCase;
import backend.room.application.port.in.DeleteRoomTypeUseCase;
import backend.room.application.port.in.GetRoomDetailUseCase;
import backend.room.application.port.in.GetRoomTypeDetailUseCase;
import backend.room.application.port.in.ListRoomTypesUseCase;
import backend.room.application.port.in.ListRoomsUseCase;
import backend.room.application.port.in.UpdateRoomStatusUseCase;
import backend.room.application.port.in.UpdateRoomTypeUseCase;
import backend.room.application.port.in.UpdateRoomUseCase;
import backend.room.application.port.in.command.CreateRoomCommand;
import backend.room.application.port.in.command.CreateRoomTypeCommand;
import backend.room.application.port.in.command.DeleteRoomCommand;
import backend.room.application.port.in.command.DeleteRoomTypeCommand;
import backend.room.application.port.in.command.UpdateRoomCommand;
import backend.room.application.port.in.command.UpdateRoomStatusCommand;
import backend.room.application.port.in.command.UpdateRoomTypeCommand;
import backend.room.application.port.in.query.GetRoomDetailQuery;
import backend.room.application.port.in.query.GetRoomTypeDetailQuery;
import backend.room.application.port.in.query.ListRoomsQuery;
import backend.room.application.model.PageResult;
import backend.room.application.port.out.RoomActorPort;
import backend.room.application.port.out.RoomCatalogPort;
import backend.room.application.port.out.RoomMutationPort;
import backend.room.application.port.out.model.RoomSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomUseCaseService implements
        ListRoomsUseCase,
        GetRoomDetailUseCase,
        CreateRoomUseCase,
        UpdateRoomUseCase,
        UpdateRoomStatusUseCase,
        DeleteRoomUseCase,
        ListRoomTypesUseCase,
        GetRoomTypeDetailUseCase,
        CreateRoomTypeUseCase,
        UpdateRoomTypeUseCase,
        DeleteRoomTypeUseCase {

    private static final Pattern LOCAL_ROOM_IMAGE_PATH = Pattern.compile(
            "^/images/rooms/[A-Za-z0-9][A-Za-z0-9/_-]*\\.(?i:jpg|jpeg|png|webp)$"
    );

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    private final RoomCatalogPort roomCatalogPort;
    private final RoomMutationPort roomMutationPort;
    private final RoomActorPort roomActorPort;

    @Override
    public List<RoomResponse> getRooms(ListRoomsQuery query) {
        return roomCatalogPort.loadRooms(toSearchCriteria(query, null, null)).stream()
                .map(RoomResponse::from)
                .toList();
    }

    @Override
    public PagedResponse<RoomResponse> getRoomsPage(ListRoomsQuery query) {
        int page = query.page() == null ? 0 : query.page();
        int size = query.size() == null ? DEFAULT_PAGE_SIZE : query.size();

        if (page < 0) {
            throw new IllegalArgumentException("page phai lon hon hoac bang 0");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("size phai nam trong khoang 1-" + MAX_PAGE_SIZE);
        }

        PageResult<Room> roomPage = roomCatalogPort.searchRooms(toSearchCriteria(query, page, size));

        return PagedResponse.of(
                roomPage.content().stream().map(RoomResponse::from).toList(),
                roomPage.page(),
                roomPage.size(),
                roomPage.totalElements(),
                roomPage.totalPages(),
                roomPage.first(),
                roomPage.last()
        );
    }

    private RoomSearchCriteria toSearchCriteria(ListRoomsQuery query, Integer page, Integer size) {
        if (query.minCapacity() != null && query.minCapacity() < 1) {
            throw new IllegalArgumentException("minCapacity phai lon hon hoac bang 1");
        }

        String search = query.search() == null || query.search().trim().isBlank()
                ? null
                : query.search().trim();

        return new RoomSearchCriteria(
                query.roomTypeId(),
                query.status(),
                search,
                query.minCapacity(),
                page,
                size
        );
    }

    @Override
    public RoomResponse getRoom(GetRoomDetailQuery query) {
        if (query.roomId() == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }

        Room room = roomCatalogPort.loadRoom(query.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng homestay"));

        return RoomResponse.from(room);
    }

    @Override
    @Transactional
    public RoomResponse createRoom(CreateRoomCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền thêm phòng homestay");

        String roomName = normalizeRequired(command.roomName(), "Tên phòng không được để trống");

        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId không được để trống");
        }
        validateMaxPeople(command.maxPeople());
        validateSleepingLayout(command.bedroomCount(), command.bedCount());

        if (roomCatalogPort.existsRoomName(roomName)) {
            throw new IllegalArgumentException("Tên phòng đã tồn tại");
        }

        RoomType roomType = loadActiveRoomTypeForUpdateRequired(command.roomTypeId());

        Room room = Room.builder()
                .roomName(roomName)
                .roomType(roomType)
                .maxPeople(command.maxPeople())
                .bedroomCount(command.bedroomCount())
                .bedCount(command.bedCount())
                .imageUrl(normalizeOptionalImageUrl(command.imageUrl()))
                .status(command.status() == null ? RoomStatus.AVAILABLE : command.status())
                .build();

        applyAdditionalImages(room, command.additionalImageUrls());

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(UpdateRoomCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền quản lý phòng homestay");

        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }
        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId không được để trống");
        }
        if (command.status() == null) {
            throw new IllegalArgumentException("Trạng thái phòng không được để trống");
        }
        validateMaxPeople(command.maxPeople());
        validateSleepingLayout(command.bedroomCount(), command.bedCount());

        Room room = roomCatalogPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng homestay"));

        String roomName = normalizeRequired(command.roomName(), "Tên phòng không được để trống");
        if (!room.getRoomName().equals(roomName) && roomCatalogPort.existsRoomName(roomName)) {
            throw new IllegalArgumentException("Tên phòng đã tồn tại");
        }

        RoomType roomType = loadActiveRoomTypeForUpdateRequired(command.roomTypeId());

        room.setRoomName(roomName);
        room.setRoomType(roomType);
        room.setMaxPeople(command.maxPeople());
        room.setBedroomCount(command.bedroomCount());
        room.setBedCount(command.bedCount());
        room.setImageUrl(normalizeOptionalImageUrl(command.imageUrl()));
        applyAdditionalImages(room, command.additionalImageUrls());
        room.setStatus(command.status());

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    @Transactional
    public RoomResponse updateRoomStatus(UpdateRoomStatusCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền quản lý phòng homestay");

        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }
        if (command.status() == null) {
            throw new IllegalArgumentException("Trạng thái phòng không được để trống");
        }

        Room room = roomCatalogPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng homestay"));

        room.setStatus(command.status());

        return RoomResponse.from(roomMutationPort.saveRoom(room));
    }

    @Override
    @Transactional
    public void deleteRoom(DeleteRoomCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền quản lý phòng homestay");

        if (command.roomId() == null) {
            throw new IllegalArgumentException("roomId không được để trống");
        }

        Room room = roomCatalogPort.loadRoomForUpdate(command.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng homestay"));

        if (roomCatalogPort.existsActiveBookingForRoom(command.roomId())) {
            throw new IllegalStateException("Không thể xóa phòng đang có booking chờ thanh toán, đã thanh toán hoặc đang check-in");
        }

        room.setStatus(RoomStatus.INACTIVE);
        roomMutationPort.saveRoom(room);
    }

    @Override
    public List<RoomTypeResponse> getRoomTypes() {
        return roomCatalogPort.loadRoomTypes().stream()
                .map(RoomTypeResponse::from)
                .toList();
    }

    @Override
    public RoomTypeResponse getRoomType(GetRoomTypeDetailQuery query) {
        if (query.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId không được để trống");
        }

        return RoomTypeResponse.from(loadRoomTypeRequired(query.roomTypeId()));
    }

    @Override
    @Transactional
    public RoomTypeResponse createRoomType(CreateRoomTypeCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền thêm loại phòng");

        String typeName = normalizeRequired(command.typeName(), "Tên loại phòng không được để trống");
        BigDecimal pricePerHour = validatePricePerHour(command.pricePerHour());

        if (roomCatalogPort.existsRoomTypeName(typeName)) {
            throw new IllegalArgumentException("Tên loại phòng đã tồn tại");
        }

        RoomType roomType = RoomType.builder()
                .typeName(typeName)
                .description(normalizeOptionalDescription(command.description()))
                .pricePerHour(pricePerHour)
                .active(true)
                .build();

        return RoomTypeResponse.from(roomMutationPort.saveRoomType(roomType));
    }

    @Override
    @Transactional
    public RoomTypeResponse updateRoomType(UpdateRoomTypeCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền quản lý loại phòng");

        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId không được để trống");
        }

        RoomType roomType = loadRoomTypeForUpdateRequired(command.roomTypeId());
        String typeName = normalizeRequired(command.typeName(), "Tên loại phòng không được để trống");
        BigDecimal pricePerHour = validatePricePerHour(command.pricePerHour());

        if (!roomType.getTypeName().equals(typeName) && roomCatalogPort.existsRoomTypeName(typeName)) {
            throw new IllegalArgumentException("Tên loại phòng đã tồn tại");
        }

        roomType.setTypeName(typeName);
        roomType.setDescription(normalizeOptionalDescription(command.description()));
        roomType.setPricePerHour(pricePerHour);

        return RoomTypeResponse.from(roomMutationPort.saveRoomType(roomType));
    }

    @Override
    @Transactional
    public void deleteRoomType(DeleteRoomTypeCommand command) {
        User currentUser = getCurrentUser(command.currentUserEmail());
        assertAdminRole(currentUser, "Chỉ admin có quyền quản lý loại phòng");

        if (command.roomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId không được để trống");
        }

        RoomType roomType = loadRoomTypeForUpdateRequired(command.roomTypeId());

        if (roomCatalogPort.existsActiveRoomForRoomType(command.roomTypeId())) {
            throw new IllegalStateException("Không thể xóa hạng phòng vì vẫn còn phòng đang hoạt động thuộc hạng này");
        }

        roomType.setActive(false);
        roomMutationPort.saveRoomType(roomType);
    }

    private User getCurrentUser(String email) {
        String normalizedEmail = normalizeRequired(email, "Người dùng hiện tại không hợp lệ");

        return roomActorPort.loadUserByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private void assertAdminRole(User currentUser, String message) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException(message);
        }
    }

    private RoomType loadRoomTypeRequired(Integer roomTypeId) {
        return roomCatalogPort.loadRoomType(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại phòng"));
    }

    private RoomType loadRoomTypeForUpdateRequired(Integer roomTypeId) {
        return roomCatalogPort.loadRoomTypeForUpdate(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại phòng"));
    }

    private RoomType loadActiveRoomTypeForUpdateRequired(Integer roomTypeId) {
        RoomType roomType = loadRoomTypeForUpdateRequired(roomTypeId);
        if (!roomType.isActive()) {
            throw new IllegalStateException("Không thể gán phòng vào hạng phòng đã ngừng hoạt động");
        }
        return roomType;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private void validateMaxPeople(Integer maxPeople) {
        if (maxPeople == null) {
            throw new IllegalArgumentException("Sức chứa tối đa không được để trống");
        }
        if (maxPeople < 1 || maxPeople > 100) {
            throw new IllegalArgumentException("Sức chứa tối đa phải nằm trong khoảng 1-100");
        }
    }

    private BigDecimal validatePricePerHour(BigDecimal pricePerHour) {
        if (pricePerHour == null) {
            throw new IllegalArgumentException("Giá theo giờ không được để trống");
        }
        if (pricePerHour.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá theo giờ phải lớn hơn 0");
        }

        return pricePerHour;
    }

    private String normalizeOptionalDescription(String description) {
        if (description == null || description.trim().isBlank()) {
            return null;
        }

        String normalized = description.trim();
        if (normalized.length() > 2000) {
            throw new IllegalArgumentException("Mô tả loại phòng tối đa 2000 ký tự");
        }

        return normalized;
    }

    private String normalizeOptionalImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isBlank()) {
            return null;
        }

        String normalized = imageUrl.trim();
        if (normalized.length() > 500) {
            throw new IllegalArgumentException("URL ảnh phòng tối đa 500 ký tự");
        }
        boolean remoteUrl = normalized.matches("^https?://.+");
        boolean localAsset = LOCAL_ROOM_IMAGE_PATH.matcher(normalized).matches();
        if (!remoteUrl && !localAsset) {
            throw new IllegalArgumentException(
                    "Ảnh phòng phải là URL http/https hoặc đường dẫn /images/rooms/ten-anh.jpg"
            );
        }

        return normalized;
    }

    private void validateSleepingLayout(Integer bedroomCount, Integer bedCount) {
        if (bedroomCount == null || bedroomCount < 1 || bedroomCount > 20) {
            throw new IllegalArgumentException("So phong ngu phai nam trong khoang 1-20");
        }
        if (bedCount == null || bedCount < 1 || bedCount > 50) {
            throw new IllegalArgumentException("So giuong phai nam trong khoang 1-50");
        }
        if (bedCount < bedroomCount) {
            throw new IllegalArgumentException("So giuong khong duoc nho hon so phong ngu");
        }
    }

    private void applyAdditionalImages(Room room, List<String> imageUrls) {
        List<String> normalized = imageUrls == null ? List.of() : imageUrls.stream()
                .map(this::normalizeOptionalImageUrl)
                .filter(value -> value != null && !value.isBlank())
                .toList();

        if (normalized.size() > 3) {
            throw new IllegalArgumentException("Mỗi phòng chỉ được có tối đa 4 ảnh");
        }

        room.setImageUrl2(normalized.size() > 0 ? normalized.get(0) : null);
        room.setImageUrl3(normalized.size() > 1 ? normalized.get(1) : null);
        room.setImageUrl4(normalized.size() > 2 ? normalized.get(2) : null);
    }
}
