package backend.auth.adapter.out.persistence;

import backend.auth.adapter.out.persistence.entity.OAuthIdentityEntity;
import backend.auth.adapter.out.persistence.repository.OAuthIdentityJpaRepository;
import backend.auth.application.port.out.OAuthIdentityPort;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuthIdentityPersistenceAdapter implements OAuthIdentityPort {
    private final OAuthIdentityJpaRepository oauthIdentityRepository;
    private final UserRepository userRepository;

    @Override
    public Optional<Integer> findAccountId(String provider, String providerSubject) {
        return oauthIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject)
                .map(identity -> identity.getAccount().getId());
    }

    @Override
    public void link(Integer accountId, String provider, String providerSubject) {
        OAuthIdentityEntity identity = oauthIdentityRepository
                .findByProviderAndProviderSubject(provider, providerSubject)
                .orElseGet(() -> OAuthIdentityEntity.builder()
                        .account(userRepository.getReferenceById(accountId))
                        .provider(provider)
                        .providerSubject(providerSubject)
                        .createdAt(LocalDateTime.now())
                        .build());
        identity.setLastLoginAt(LocalDateTime.now());
        oauthIdentityRepository.save(identity);
    }

    @Override
    public void recordLogin(String provider, String providerSubject) {
        oauthIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject)
                .ifPresent(identity -> {
                    identity.setLastLoginAt(LocalDateTime.now());
                    oauthIdentityRepository.save(identity);
                });
    }
}
