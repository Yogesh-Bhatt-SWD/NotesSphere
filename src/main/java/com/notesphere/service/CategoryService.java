package com.notesphere.service;

import com.notesphere.dto.request.CategoryRequest;
import com.notesphere.dto.response.CategoryResponse;
import com.notesphere.dto.response.CategorySuggestionResponse;
import com.notesphere.entity.Category;
import com.notesphere.entity.JournalEntry;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.DuplicateResourceException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.CategoryRepository;
import com.notesphere.repository.JournalEntryRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing predefined and user custom categories,
 * safe deletion with journal re-association, and NLP category suggestions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final JournalEntryRepository journalRepository;
    private final TaggingService taggingService;

    public static final List<String> PREDEFINED_CATEGORIES = List.of(
            "Mindfulness", "Goals", "Daily Life", "Work & Projects", "Reflections",
            "Study", "Travel", "Health", "Fitness", "Personal Growth", "Other"
    );

    @PostConstruct
    @Transactional
    public void initPredefinedCategories() {
        for (String catName : PREDEFINED_CATEGORIES) {
            if (!categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue(catName)) {
                Category cat = Category.builder()
                        .name(catName)
                        .predefined(true)
                        .userId(null)
                        .color(getColorForPredefined(catName))
                        .icon(getIconForPredefined(catName))
                        .build();
                categoryRepository.save(cat);
                log.info("Initialized predefined category: {}", catName);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAvailableCategories(String userId) {
        return categoryRepository.findAllAvailableForUser(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(String userId, CategoryRequest request) {
        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue(trimmedName)) {
            throw new DuplicateResourceException("Category", "name", trimmedName + " (already exists as a predefined category)");
        }

        if (categoryRepository.existsByNameIgnoreCaseAndUserId(trimmedName, userId)) {
            throw new DuplicateResourceException("Category", "name", trimmedName);
        }

        Category category = Category.builder()
                .name(trimmedName)
                .predefined(false)
                .userId(userId)
                .icon(request.getIcon() != null ? request.getIcon().trim() : "Folder")
                .color(request.getColor() != null ? request.getColor().trim() : "#00B69B")
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Custom category created by user {}: {}", userId, saved.getName());
        return mapToResponse(saved);
    }

    @Transactional
    public CategoryResponse renameCategory(String userId, String categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (category.isPredefined()) {
            throw new BadRequestException("Cannot rename global predefined category");
        }

        if (!userId.equals(category.getUserId())) {
            throw new AccessDeniedException("You do not have permission to modify this category");
        }

        String newName = request.getName().trim();
        if (!category.getName().equalsIgnoreCase(newName)) {
            if (categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue(newName) ||
                    categoryRepository.existsByNameIgnoreCaseAndUserId(newName, userId)) {
                throw new DuplicateResourceException("Category", "name", newName);
            }

            String oldName = category.getName();
            category.setName(newName);

            // Update existing user journals referencing old name
            List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtDesc(userId);
            for (JournalEntry entry : entries) {
                if (oldName.equalsIgnoreCase(entry.getCategory())) {
                    entry.setCategory(newName);
                    journalRepository.save(entry);
                }
            }
        }

        if (request.getIcon() != null) category.setIcon(request.getIcon().trim());
        if (request.getColor() != null) category.setColor(request.getColor().trim());

        Category updated = categoryRepository.save(category);
        log.info("Custom category renamed by user {}: {}", userId, updated.getName());
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteCategory(String userId, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (category.isPredefined()) {
            throw new BadRequestException("Cannot delete global predefined category");
        }

        if (!userId.equals(category.getUserId())) {
            throw new AccessDeniedException("You do not have permission to delete this category");
        }

        // Safely re-associate existing journals to "Other"
        String deletedName = category.getName();
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (JournalEntry entry : entries) {
            if (deletedName.equalsIgnoreCase(entry.getCategory())) {
                entry.setCategory("Other");
                journalRepository.save(entry);
            }
        }

        categoryRepository.delete(category);
        log.info("Custom category deleted by user {}: {}", userId, deletedName);
    }

    public CategorySuggestionResponse suggestCategory(String content) {
        String classified = taggingService.classifyCategory(content);
        return CategorySuggestionResponse.builder()
                .suggestedCategory(classified)
                .confidence(classified.equals("Other") ? 0.5 : 0.85)
                .build();
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .predefined(category.isPredefined())
                .userId(category.getUserId())
                .icon(category.getIcon())
                .color(category.getColor())
                .createdAt(category.getCreatedAt())
                .build();
    }

    private String getColorForPredefined(String name) {
        return switch (name) {
            case "Mindfulness" -> "#06B6D4";
            case "Goals" -> "#F59E0B";
            case "Daily Life" -> "#10B981";
            case "Work & Projects" -> "#3B82F6";
            case "Reflections" -> "#8B5CF6";
            case "Study" -> "#6366F1";
            case "Travel" -> "#FF8F6B";
            case "Health" -> "#EC4899";
            case "Fitness" -> "#14B8A6";
            case "Personal Growth" -> "#EAB308";
            default -> "#94A3B8";
        };
    }

    private String getIconForPredefined(String name) {
        return switch (name) {
            case "Mindfulness" -> "Coffee";
            case "Goals" -> "Target";
            case "Daily Life" -> "Calendar";
            case "Work & Projects" -> "Briefcase";
            case "Reflections" -> "BookOpen";
            case "Study" -> "GraduationCap";
            case "Travel" -> "Compass";
            case "Health" -> "HeartPulse";
            case "Fitness" -> "Activity";
            case "Personal Growth" -> "TrendingUp";
            default -> "Folder";
        };
    }
}
