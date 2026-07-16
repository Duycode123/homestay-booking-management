package backend.addon.adapter.out.persistence.repository;

import backend.addon.adapter.out.persistence.entity.AddonServiceEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AddonServiceJpaRepository extends JpaRepository<AddonServiceEntity, Long> {
    @EntityGraph(attributePaths = "roomTier")
    List<AddonServiceEntity> findAllByOrderByActiveDescNameAsc();

    @EntityGraph(attributePaths = "roomTier")
    @Query("select s from AddonServiceEntity s where s.active = true and (s.roomTier is null or s.roomTier.id = :tierId) order by s.name")
    List<AddonServiceEntity> findAvailable(@Param("tierId") Integer tierId);
}
