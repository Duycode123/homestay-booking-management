package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, unique = true)
    private String roomName;

    @ManyToOne
    @JoinColumn(name = "room_tier_id", nullable = false)
    private RoomType roomType;

    @Transient
    private Integer floor;

    @Column(name = "max_people", nullable = false)
    private Integer maxPeople;

    @Column(name = "bedroom_count", nullable = false)
    private Integer bedroomCount;

    @Column(name = "bed_count", nullable = false)
    private Integer bedCount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "room_status")
    private RoomStatus status;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "accommodation_type", nullable = false, length = 30)
    private AccommodationType accommodationType;

    @Column(name = "address_line", length = 255)
    private String addressLine;

    @Column(name = "ward", length = 120)
    private String ward;

    @Column(name = "district", length = 120)
    private String district;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "check_in_radius_m", nullable = false)
    private Integer checkInRadiusMeters;

    @Column(name = "bathroom_count", nullable = false)
    private Integer bathroomCount;

    @Column(name = "base_nightly_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseNightlyRate;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "image_url_2", length = 500)
    private String imageUrl2;

    @Column(name = "image_url_3", length = 500)
    private String imageUrl3;

    @Column(name = "image_url_4", length = 500)
    private String imageUrl4;

    @Transient
    private LocalDateTime createdAt;

    @Transient
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = RoomStatus.AVAILABLE;
        }
        if (bedroomCount == null) {
            bedroomCount = 1;
        }
        if (bedCount == null) {
            bedCount = 1;
        }
        if (bathroomCount == null) {
            bathroomCount = 1;
        }
        if (accommodationType == null) {
            accommodationType = AccommodationType.VILLA;
        }
        if (city == null || city.isBlank()) {
            city = "Hà Nội";
        }
        if (checkInRadiusMeters == null) {
            checkInRadiusMeters = 100;
        }
        if (baseNightlyRate == null && roomType != null && roomType.getPricePerHour() != null) {
            baseNightlyRate = roomType.getPricePerHour().multiply(BigDecimal.valueOf(22));
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
