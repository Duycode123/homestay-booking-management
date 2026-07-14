package backend.amenity.adapter.out.persistence;

import backend.amenity.application.port.out.CommonAmenityCatalogPort;
import backend.amenity.domain.model.CommonAmenity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
class CommonAmenityPersistenceAdapter implements CommonAmenityCatalogPort {
    private final CommonAmenityJpaRepository repository;

    @Override
    public List<CommonAmenity> findActiveAmenities() {
        return repository.findAllByActiveTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<CommonAmenity> findAllAmenities() {
        return repository.findAllByOrderByDisplayOrderAscNameAsc().stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<CommonAmenity> findById(Long id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsByName(String name) {
        return repository.existsByNameIgnoreCase(name);
    }

    @Override
    public CommonAmenity save(CommonAmenity amenity) {
        CommonAmenityEntity entity = amenity.id() == null
                ? new CommonAmenityEntity()
                : repository.findById(amenity.id()).orElseGet(CommonAmenityEntity::new);
        entity.setName(amenity.name());
        entity.setDescription(amenity.description());
        entity.setIconName(amenity.iconName());
        entity.setImageUrl(amenity.imageUrl());
        entity.setDisplayOrder(amenity.displayOrder());
        entity.setActive(amenity.active());
        return toDomain(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    private CommonAmenity toDomain(CommonAmenityEntity entity) {
        return new CommonAmenity(
                entity.getId(), entity.getName(), entity.getDescription(), entity.getIconName(),
                entity.getImageUrl(), entity.getDisplayOrder(), entity.isActive()
        );
    }
}
