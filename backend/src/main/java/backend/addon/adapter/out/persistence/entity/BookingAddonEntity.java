package backend.addon.adapter.out.persistence.entity;

import backend.addon.domain.model.AddonSource;
import backend.addon.domain.model.BookingAddonStatus;
import backend.entity.Booking;
import backend.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_addon")
@Getter @Setter @NoArgsConstructor
public class BookingAddonEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "addon_service_id", nullable = false)
    private AddonServiceEntity service;
    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;
    @Column(nullable = false, length = 60)
    private String unit;
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;
    @Column(nullable = false)
    private int quantity;
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AddonSource source;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private BookingAddonStatus status;
    @Column(name = "customer_note", length = 300)
    private String customerNote;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "requested_by_user_id")
    private User requestedBy;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "confirmed_by_user_id")
    private User confirmedBy;
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", insertable = false)
    private LocalDateTime updatedAt;

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
