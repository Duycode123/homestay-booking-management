package backend.equipment.adapter.out.persistence;

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

}
