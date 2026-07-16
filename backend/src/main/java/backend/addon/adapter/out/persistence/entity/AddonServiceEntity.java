package backend.addon.adapter.out.persistence.entity;

import backend.entity.RoomType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "addon_service")
@Getter
@Setter
@NoArgsConstructor
public class AddonServiceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 120)
    private String name;
    @Column(nullable = false, length = 500)
    private String description;
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    @Column(nullable = false, length = 60)
    private String unit;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "room_tier_id")
    private RoomType roomTier;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", insertable = false)
    private LocalDateTime updatedAt;

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
