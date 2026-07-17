package backend.auth.adapter.out.persistence.repository;

import backend.auth.adapter.out.persistence.entity.OAuthIdentityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OAuthIdentityJpaRepository extends JpaRepository<OAuthIdentityEntity, Long> {
    Optional<OAuthIdentityEntity> findByProviderAndProviderSubject(String provider, String providerSubject);
}
