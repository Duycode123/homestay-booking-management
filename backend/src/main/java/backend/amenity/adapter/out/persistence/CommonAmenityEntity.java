package backend.amenity.adapter.out.persistence;

import backend.entity.Room;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "common_amenity")
@Getter
@Setter
@NoArgsConstructor
class CommonAmenityEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "icon_name", nullable = false, length = 60)
    private String iconName;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(nullable = false)
    private boolean active;

    @ManyToMany
    @JoinTable(
            name = "room_included_amenity",
            joinColumns = @JoinColumn(name = "amenity_id"),
            inverseJoinColumns = @JoinColumn(name = "room_id")
    )
    @OrderBy("roomName ASC")
    private Set<Room> rooms = new LinkedHashSet<>();
}
