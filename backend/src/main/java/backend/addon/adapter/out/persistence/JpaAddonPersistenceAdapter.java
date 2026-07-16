package backend.addon.adapter.out.persistence;

import backend.addon.adapter.out.persistence.entity.AddonServiceEntity;
import backend.addon.adapter.out.persistence.entity.BookingAddonEntity;
import backend.addon.adapter.out.persistence.repository.AddonServiceJpaRepository;
import backend.addon.adapter.out.persistence.repository.BookingAddonJpaRepository;
import backend.addon.application.port.out.AddonPersistencePort;
import backend.addon.domain.model.*;
import backend.entity.Booking;
import backend.entity.RoomType;
import backend.entity.User;
import backend.repository.BookingRepository;
import backend.repository.RoomTypeRepository;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JpaAddonPersistenceAdapter implements AddonPersistencePort {
    private final AddonServiceJpaRepository catalogRepository;
    private final BookingAddonJpaRepository bookingAddonRepository;
    private final BookingRepository bookingRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final UserRepository userRepository;

    @Override
    public List<AddonCatalogItem> findAllCatalogItems() {
        return catalogRepository.findAllByOrderByActiveDescNameAsc().stream().map(this::toDomain).toList();
    }

    @Override
    public List<AddonCatalogItem> findActiveCatalogItems(Integer roomTierId) {
        return catalogRepository.findAvailable(roomTierId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<AddonCatalogItem> findCatalogItem(Long id) {
        return catalogRepository.findById(id).map(this::toDomain);
    }

    @Override
    public AddonCatalogItem saveCatalogItem(AddonCatalogItem item) {
        AddonServiceEntity entity = item.id() == null
                ? new AddonServiceEntity()
                : catalogRepository.findById(item.id()).orElseThrow();
        entity.setName(item.name());
        entity.setDescription(item.description());
        entity.setImageUrl(item.imageUrl());
        entity.setPrice(item.price());
        entity.setUnit(item.unit());
        entity.setActive(item.active());
        RoomType tier = item.roomTierId() == null ? null : roomTypeRepository.findById(item.roomTierId()).orElseThrow();
        entity.setRoomTier(tier);
        return toDomain(catalogRepository.save(entity));
    }

    @Override
    public void saveInitialBookingAddons(Integer bookingId, List<QuotedAddon> items) {
        saveItems(bookingId, null, items, AddonSource.BOOKING, BookingAddonStatus.PENDING_PAYMENT);
    }

    @Override
    public void saveDuringStayRequests(Integer bookingId, Integer requestedByUserId, List<QuotedAddon> items) {
        saveItems(bookingId, requestedByUserId, items, AddonSource.DURING_STAY, BookingAddonStatus.REQUESTED);
    }

    private void saveItems(Integer bookingId, Integer userId, List<QuotedAddon> items,
                           AddonSource source, BookingAddonStatus status) {
        Booking booking = bookingRepository.getReferenceById(bookingId);
        User requester = userId == null ? null : userRepository.getReferenceById(userId);
        List<BookingAddonEntity> entities = items.stream().map(item -> {
            BookingAddonEntity entity = new BookingAddonEntity();
            entity.setBooking(booking);
            entity.setService(catalogRepository.getReferenceById(item.serviceId()));
            entity.setServiceName(item.name());
            entity.setUnit(item.unit());
            entity.setUnitPrice(item.unitPrice());
            entity.setQuantity(item.quantity());
            entity.setTotalAmount(item.totalAmount());
            entity.setCustomerNote(item.note());
            entity.setSource(source);
            entity.setStatus(status);
            entity.setRequestedBy(requester);
            return entity;
        }).toList();
        bookingAddonRepository.saveAll(entities);
    }

    @Override
    public List<BookingAddonItem> findBookingAddons(Integer bookingId) {
        return bookingAddonRepository.findByBooking_IdOrderByCreatedAtAscIdAsc(bookingId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<BookingAddonItem> findBookingAddonForUpdate(Integer bookingId, Long bookingAddonId) {
        return bookingAddonRepository.findForUpdate(bookingId, bookingAddonId).map(this::toDomain);
    }

    @Override
    public BookingAddonItem updateBookingAddon(BookingAddonItem item, BookingAddonStatus status,
                                                Integer confirmedByUserId, boolean markDelivered) {
        BookingAddonEntity entity = bookingAddonRepository.findForUpdate(item.bookingId(), item.id()).orElseThrow();
        entity.setStatus(status);
        if (confirmedByUserId != null) entity.setConfirmedBy(userRepository.getReferenceById(confirmedByUserId));
        if (markDelivered) entity.setDeliveredAt(LocalDateTime.now());
        return toDomain(bookingAddonRepository.save(entity));
    }

    @Override
    public void updateStatuses(Integer bookingId, BookingAddonStatus from, BookingAddonStatus to) {
        bookingAddonRepository.updateStatus(bookingId, from, to);
    }

    @Override
    public void cancelUndelivered(Integer bookingId) { bookingAddonRepository.cancelUndelivered(bookingId); }

    private AddonCatalogItem toDomain(AddonServiceEntity entity) {
        RoomType tier = entity.getRoomTier();
        return new AddonCatalogItem(entity.getId(), entity.getName(), entity.getDescription(), entity.getImageUrl(),
                entity.getPrice(), entity.getUnit(), tier == null ? null : tier.getId(),
                tier == null ? null : tier.getTypeName(), entity.isActive(), entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private BookingAddonItem toDomain(BookingAddonEntity entity) {
        return new BookingAddonItem(entity.getId(), entity.getBooking().getId(), entity.getService().getId(),
                entity.getServiceName(), entity.getUnit(), entity.getUnitPrice(), entity.getQuantity(),
                entity.getTotalAmount(), entity.getSource(), entity.getStatus(), entity.getCustomerNote(),
                entity.getDeliveredAt(), entity.getCreatedAt());
    }
}
