package com.notesphere.security;

import com.notesphere.entity.User;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom UserDetailsService that loads user data from the database.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        if (identifier == null || identifier.isBlank()) {
            throw new UsernameNotFoundException("Username or email cannot be empty");
        }
        String clean = identifier.trim();
        User user = userRepository.findByEmail(clean)
                .or(() -> userRepository.findByEmail(clean.toLowerCase()))
                .or(() -> userRepository.findByUsername(clean))
                .or(() -> userRepository.findByUsername(clean.toLowerCase()))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with identifier: " + identifier));
        return UserPrincipal.create(user);
    }

    /**
     * Load user by ID — used by JWT filter after token validation.
     */
    public UserDetails loadUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserPrincipal.create(user);
    }
}
