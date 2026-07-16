package backend.addon.application.service;

import backend.addon.application.model.AddonActor;
import backend.addon.application.model.AddonBookingContext;
import backend.addon.application.port.in.AddonUseCase;
import backend.addon.application.port.out.AddonBookingContextPort;
import backend.addon.application.port.out.AddonPersistencePort;
import backend.addon.domain.model.*;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AddonApplicationService implements AddonUseCase {
    private static final int MAX_QUANTITY = 20;
    private final AddonPersistencePort persistencePort;
    private final AddonBookingContextPort bookingContextPort;

    @Override
    @Transactional(readOnly = true)
    public List<AddonCatalogItem> listAvailableForRoom(Integer roomId) {
        Integer tierId = bookingContextPort.findRoomTierId(requiredPositive(roomId, "roomId"))
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong"));
        return persistencePort.findActiveCatalogItems(tierId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddonCatalogItem> listAllCatalogItems() { return persistencePort.findAllCatalogItems(); }

    @Override
    @Transactional
    public AddonCatalogItem createCatalogItem(AddonCatalogItem item) {
        validateCatalog(item);
        return persistencePort.saveCatalogItem(normalizeCatalog(null, item));
    }

    @Override
    @Transactional
    public AddonCatalogItem updateCatalogItem(Long id, AddonCatalogItem item) {
        if (id == null || id <= 0) throw new IllegalArgumentException("serviceId khong hop le");
        persistencePort.findCatalogItem(id).orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dich vu"));
        validateCatalog(item);
        return persistencePort.saveCatalogItem(normalizeCatalog(id, item));
    }

    @Override
    @Transactional
    public AddonCatalogItem setCatalogItemActive(Long id, boolean active) {
        AddonCatalogItem current = persistencePort.findCatalogItem(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dich vu"));
        return persistencePort.saveCatalogItem(new AddonCatalogItem(current.id(), current.name(), current.description(),
                current.imageUrl(), current.price(), current.unit(), current.roomTierId(), current.roomTierName(),
                active, current.createdAt(), current.updatedAt()));
    }

    @Override
    @Transactional(readOnly = true)
    public AddonQuote quote(Integer roomId, List<AddonSelection> selections) {
        Integer tierId = bookingContextPort.findRoomTierId(requiredPositive(roomId, "roomId"))
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong"));
        if (selections == null || selections.isEmpty()) return AddonQuote.empty();

        Map<Long, AddonSelection> unique = new LinkedHashMap<>();
        for (AddonSelection selection : selections) {
            if (selection == null || selection.serviceId() == null || selection.serviceId() <= 0) {
                throw new IllegalArgumentException("Dich vu khong hop le");
            }
            if (unique.putIfAbsent(selection.serviceId(), selection) != null) {
                throw new IllegalArgumentException("Moi dich vu chi duoc chon mot lan");
            }
            if (selection.quantity() < 1 || selection.quantity() > MAX_QUANTITY) {
                throw new IllegalArgumentException("So luong dich vu phai tu 1 den " + MAX_QUANTITY);
            }
            if (selection.note() != null && selection.note().trim().length() > 300) {
                throw new IllegalArgumentException("Ghi chu dich vu toi da 300 ky tu");
            }
        }

        List<QuotedAddon> quoted = unique.values().stream().map(selection -> {
            AddonCatalogItem item = persistencePort.findCatalogItem(selection.serviceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dich vu"));
            if (!item.active()) throw new IllegalArgumentException("Dich vu " + item.name() + " dang tam ngung");
            if (item.roomTierId() != null && !item.roomTierId().equals(tierId)) {
                throw new IllegalArgumentException("Dich vu " + item.name() + " khong ap dung cho hang phong nay");
            }
            BigDecimal unitPrice = money(item.price());
            return new QuotedAddon(item.id(), item.name(), item.unit(), unitPrice, selection.quantity(),
                    money(unitPrice.multiply(BigDecimal.valueOf(selection.quantity()))), trimToNull(selection.note()));
        }).toList();
        BigDecimal total = quoted.stream().map(QuotedAddon::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AddonQuote(quoted, money(total));
    }

    @Override
    @Transactional
    public void attachInitialAddons(Integer bookingId, AddonQuote quote) {
        if (quote != null && !quote.items().isEmpty()) persistencePort.saveInitialBookingAddons(bookingId, quote.items());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingAddonItem> listForBookingInternal(Integer bookingId) {
        return persistencePort.findBookingAddons(requiredPositive(bookingId, "bookingId"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingAddonItem> listForManagement(Integer bookingId, String managementEmail) {
        int requiredBookingId = requiredPositive(bookingId, "bookingId");
        AddonActor actor = requireActor(managementEmail);
        if (!actor.isAdmin() && !actor.isStaff()) {
            throw new ForbiddenException("Ban khong co quyen xem dich vu cua booking");
        }
        if (actor.isStaff() && !bookingContextPort.canStaffAccessBooking(managementEmail, requiredBookingId)) {
            throw new ForbiddenException("Booking nay khong thuoc ca lam viec cua ban");
        }
        return persistencePort.findBookingAddons(requiredBookingId);
    }

    @Override
    @Transactional
    public List<BookingAddonItem> listForCustomer(Integer bookingId, String customerEmail) {
        requireCustomerOwner(bookingId, customerEmail);
        return persistencePort.findBookingAddons(bookingId);
    }

    @Override
    @Transactional
    public List<BookingAddonItem> requestDuringStay(Integer bookingId, String customerEmail, List<AddonSelection> selections) {
        AddonBookingContext context = requireCustomerOwner(bookingId, customerEmail);
        if (!"CHECKED_IN".equals(context.bookingStatus())) {
            throw new IllegalStateException("Chi co the goi them dich vu sau khi da check-in");
        }
        AddonActor actor = requireActor(customerEmail);
        AddonQuote quote = quoteForTier(context.roomTierId(), selections);
        if (quote.items().isEmpty()) throw new IllegalArgumentException("Vui long chon it nhat mot dich vu");
        persistencePort.saveDuringStayRequests(bookingId, actor.userId(), quote.items());
        return persistencePort.findBookingAddons(bookingId);
    }

    @Override
    @Transactional
    public BookingAddonItem cancelCustomerRequest(Integer bookingId, Long bookingAddonId, String customerEmail) {
        requireCustomerOwner(bookingId, customerEmail);
        BookingAddonItem item = findItem(bookingId, bookingAddonId);
        if (item.source() != AddonSource.DURING_STAY || item.status() != BookingAddonStatus.REQUESTED) {
            throw new IllegalStateException("Chi co the huy yeu cau dang cho nhan vien xac nhan");
        }
        return persistencePort.updateBookingAddon(item, BookingAddonStatus.CANCELLED, null, false);
    }

    @Override
    @Transactional
    public BookingAddonItem updateStatus(Integer bookingId, Long bookingAddonId, BookingAddonStatus target, String email) {
        if (target == null) throw new IllegalArgumentException("Trang thai dich vu khong duoc de trong");
        AddonActor actor = requireActor(email);
        if (!actor.isAdmin() && !actor.isStaff()) throw new ForbiddenException("Ban khong co quyen cap nhat dich vu");
        if (actor.isStaff() && !bookingContextPort.canStaffAccessBooking(email, bookingId)) {
            throw new ForbiddenException("Booking nay khong thuoc ca lam viec cua ban");
        }
        BookingAddonItem item = findItem(bookingId, bookingAddonId);
        if (target == BookingAddonStatus.CANCELLED
                && item.source() == AddonSource.BOOKING
                && item.status() != BookingAddonStatus.PENDING_PAYMENT) {
            throw new IllegalStateException(
                    "Dich vu dat truoc da nam trong khoan thanh toan; vui long xu ly qua nghiep vu hoan tien"
            );
        }
        if (!isTransitionAllowed(item.status(), target)) {
            throw new IllegalStateException("Khong the chuyen dich vu tu " + item.status() + " sang " + target);
        }
        boolean deliveredNow = target == BookingAddonStatus.DELIVERED;
        BookingAddonItem updated = persistencePort.updateBookingAddon(item, target, actor.userId(), deliveredNow);
        if (deliveredNow && item.source() == AddonSource.DURING_STAY) {
            bookingContextPort.addDeliveredAddonAmount(bookingId, item.totalAmount());
        }
        return updated;
    }

    @Override
    @Transactional
    public void confirmInitialAddons(Integer bookingId) {
        persistencePort.updateStatuses(bookingId, BookingAddonStatus.PENDING_PAYMENT, BookingAddonStatus.CONFIRMED);
    }

    @Override
    @Transactional
    public void cancelUndeliveredAddons(Integer bookingId) { persistencePort.cancelUndelivered(bookingId); }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getIncludedAddonAmount(Integer bookingId) {
        return money(persistencePort.findBookingAddons(bookingId).stream()
                .filter(item -> item.source() == AddonSource.BOOKING
                        ? item.status() != BookingAddonStatus.CANCELLED
                        : item.status() == BookingAddonStatus.DELIVERED)
                .map(BookingAddonItem::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private AddonQuote quoteForTier(Integer tierId, List<AddonSelection> selections) {
        if (selections == null || selections.isEmpty()) return AddonQuote.empty();
        Map<Long, AddonSelection> unique = new LinkedHashMap<>();
        for (AddonSelection selection : selections) {
            if (selection == null || selection.serviceId() == null || selection.quantity() < 1 || selection.quantity() > MAX_QUANTITY)
                throw new IllegalArgumentException("Dich vu hoac so luong khong hop le");
            if (unique.putIfAbsent(selection.serviceId(), selection) != null)
                throw new IllegalArgumentException("Moi dich vu chi duoc chon mot lan");
        }
        List<QuotedAddon> items = unique.values().stream().map(selection -> {
            AddonCatalogItem item = persistencePort.findCatalogItem(selection.serviceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dich vu"));
            if (!item.active() || item.roomTierId() != null && !item.roomTierId().equals(tierId))
                throw new IllegalArgumentException("Dich vu khong con ap dung cho phong nay");
            BigDecimal price = money(item.price());
            return new QuotedAddon(item.id(), item.name(), item.unit(), price, selection.quantity(),
                    money(price.multiply(BigDecimal.valueOf(selection.quantity()))), trimToNull(selection.note()));
        }).toList();
        return new AddonQuote(items, money(items.stream().map(QuotedAddon::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add)));
    }

    private AddonBookingContext requireCustomerOwner(Integer bookingId, String email) {
        AddonBookingContext context = bookingContextPort.loadBookingForUpdate(requiredPositive(bookingId, "bookingId"))
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay booking"));
        if (email == null || !context.customerEmail().equalsIgnoreCase(email))
            throw new ForbiddenException("Ban khong co quyen truy cap dich vu cua booking nay");
        return context;
    }

    private AddonActor requireActor(String email) {
        return bookingContextPort.findActor(email).orElseThrow(() -> new ForbiddenException("Phien dang nhap khong hop le"));
    }

    private BookingAddonItem findItem(Integer bookingId, Long itemId) {
        if (itemId == null || itemId <= 0) throw new IllegalArgumentException("bookingAddonId khong hop le");
        return persistencePort.findBookingAddonForUpdate(bookingId, itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dich vu trong booking"));
    }

    private boolean isTransitionAllowed(BookingAddonStatus from, BookingAddonStatus to) {
        if (to == BookingAddonStatus.CANCELLED) return from != BookingAddonStatus.DELIVERED && from != BookingAddonStatus.CANCELLED;
        return switch (from) {
            case REQUESTED -> to == BookingAddonStatus.CONFIRMED;
            case CONFIRMED -> to == BookingAddonStatus.PREPARED || to == BookingAddonStatus.DELIVERED;
            case PREPARED -> to == BookingAddonStatus.DELIVERED;
            default -> false;
        };
    }

    private void validateCatalog(AddonCatalogItem item) {
        if (item == null) throw new IllegalArgumentException("Du lieu dich vu khong duoc de trong");
        requireText(item.name(), "Ten dich vu", 120);
        requireText(item.description(), "Mo ta", 500);
        requireText(item.unit(), "Don vi tinh", 60);
        if (item.price() == null || item.price().compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Gia dich vu phai lon hon 0");
        if (item.imageUrl() != null && item.imageUrl().trim().length() > 500)
            throw new IllegalArgumentException("Duong dan anh toi da 500 ky tu");
    }

    private AddonCatalogItem normalizeCatalog(Long id, AddonCatalogItem item) {
        return new AddonCatalogItem(id, item.name().trim(), item.description().trim(), trimToNull(item.imageUrl()),
                money(item.price()), item.unit().trim(), item.roomTierId(), null, item.active(), item.createdAt(), item.updatedAt());
    }

    private Integer requiredPositive(Integer value, String field) {
        if (value == null || value <= 0) throw new IllegalArgumentException(field + " khong hop le");
        return value;
    }
    private void requireText(String value, String label, int max) {
        if (value == null || value.trim().isEmpty() || value.trim().length() > max)
            throw new IllegalArgumentException(label + " khong hop le");
    }
    private String trimToNull(String value) { return value == null || value.trim().isEmpty() ? null : value.trim(); }
    private BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
}
