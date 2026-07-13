package backend.equipment.adapter.out.persistence;

import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<EquipmentJpaEntity, Integer> {

    boolean existsByRoom_Id(Integer roomId);

    @Query("""
            select e
            from EquipmentJpaEntity e
            join fetch e.room r
            order by r.roomName asc, e.name asc, e.id asc
            """)
    List<EquipmentJpaEntity> findAllWithRoom();

    @Query("""
            select e
            from EquipmentJpaEntity e
            join fetch e.room r
            where r.id = :roomId
            order by r.roomName asc, e.name asc, e.id asc
            """)
    List<EquipmentJpaEntity> findAllByRoomIdWithRoom(@Param("roomId") Integer roomId);

    @Query("""
            select e
            from EquipmentJpaEntity e
            join fetch e.room
            where e.id = :equipmentId
            """)
    Optional<EquipmentJpaEntity> findDetailById(@Param("equipmentId") Integer equipmentId);

    @Query("""
            select e
            from EquipmentJpaEntity e
            join fetch e.room r
            where (:roomId is null or r.id = :roomId)
              and (:type is null or e.type = :type)
              and (:status is null or e.status = :status)
            order by r.roomName asc, e.name asc, e.id asc
            """)
    List<EquipmentJpaEntity> search(
            @Param("roomId") Integer roomId,
            @Param("type") EquipmentType type,
            @Param("status") EquipmentStatus status
    );
}
