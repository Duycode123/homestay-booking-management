package backend.amenity.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface CommonAmenityJpaRepository extends JpaRepository<CommonAmenityEntity, Long> {
    @EntityGraph(attributePaths = "rooms")
    List<CommonAmenityEntity> findAllByActiveTrueOrderByDisplayOrderAscNameAsc();

    @EntityGraph(attributePaths = "rooms")
    @Query("""
            select distinct amenity
            from CommonAmenityEntity amenity
            join amenity.rooms room
            where amenity.active = true and room.id = :roomId
            order by amenity.displayOrder asc, amenity.name asc
            """)
    List<CommonAmenityEntity> findActiveByRoomId(@Param("roomId") Integer roomId);

    @EntityGraph(attributePaths = "rooms")
    List<CommonAmenityEntity> findAllByOrderByDisplayOrderAscNameAsc();

    @EntityGraph(attributePaths = "rooms")
    Optional<CommonAmenityEntity> findWithRoomsById(Long id);

    boolean existsByNameIgnoreCase(String name);
}
