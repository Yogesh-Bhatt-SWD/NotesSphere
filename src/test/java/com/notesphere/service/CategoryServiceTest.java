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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private TaggingService taggingService;

    @InjectMocks
    private CategoryService categoryService;

    private Category customCategory;
    private Category predefinedCategory;

    @BeforeEach
    void setUp() {
        customCategory = Category.builder()
                .id("cat-1")
                .name("Productivity Hacks")
                .predefined(false)
                .userId("user-1")
                .icon("Zap")
                .color("#00B69B")
                .createdAt(Instant.now())
                .build();

        predefinedCategory = Category.builder()
                .id("cat-pred-1")
                .name("Mindfulness")
                .predefined(true)
                .userId(null)
                .icon("Coffee")
                .color("#06B6D4")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Create custom category succeeds when unique")
    void createCategory_Success() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Productivity Hacks")
                .icon("Zap")
                .color("#00B69B")
                .build();

        when(categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue("Productivity Hacks")).thenReturn(false);
        when(categoryRepository.existsByNameIgnoreCaseAndUserId("Productivity Hacks", "user-1")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(customCategory);

        CategoryResponse response = categoryService.createCategory("user-1", request);

        assertNotNull(response);
        assertEquals("Productivity Hacks", response.getName());
        assertFalse(response.isPredefined());
        assertEquals("user-1", response.getUserId());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Create custom category fails if name duplicates predefined category")
    void createCategory_Fails_WhenDuplicatesPredefined() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Mindfulness")
                .build();

        when(categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue("Mindfulness")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                categoryService.createCategory("user-1", request));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    @DisplayName("Create custom category fails if user already has category with same name")
    void createCategory_Fails_WhenUserAlreadyHasCategory() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Productivity Hacks")
                .build();

        when(categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue("Productivity Hacks")).thenReturn(false);
        when(categoryRepository.existsByNameIgnoreCaseAndUserId("Productivity Hacks", "user-1")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                categoryService.createCategory("user-1", request));
    }

    @Test
    @DisplayName("Rename custom category updates journals with old category name")
    void renameCategory_Success_UpdatesExistingJournals() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Deep Work")
                .build();

        JournalEntry entry = JournalEntry.builder()
                .id("j-1")
                .userId("user-1")
                .title("Focus session")
                .category("Productivity Hacks")
                .build();

        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(customCategory));
        when(categoryRepository.existsByNameIgnoreCaseAndPredefinedTrue("Deep Work")).thenReturn(false);
        when(categoryRepository.existsByNameIgnoreCaseAndUserId("Deep Work", "user-1")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(journalRepository.findByUserIdOrderByCreatedAtDesc("user-1")).thenReturn(List.of(entry));

        CategoryResponse response = categoryService.renameCategory("user-1", "cat-1", request);

        assertNotNull(response);
        assertEquals("Deep Work", response.getName());
        assertEquals("Deep Work", entry.getCategory());
        verify(journalRepository).save(entry);
    }

    @Test
    @DisplayName("Rename predefined category throws BadRequestException")
    void renameCategory_Fails_OnPredefinedCategory() {
        CategoryRequest request = CategoryRequest.builder().name("New Name").build();
        when(categoryRepository.findById("cat-pred-1")).thenReturn(Optional.of(predefinedCategory));

        assertThrows(BadRequestException.class, () ->
                categoryService.renameCategory("user-1", "cat-pred-1", request));
    }

    @Test
    @DisplayName("Rename another user's category throws AccessDeniedException")
    void renameCategory_Fails_WhenNotOwner() {
        CategoryRequest request = CategoryRequest.builder().name("Hacked").build();
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(customCategory));

        assertThrows(AccessDeniedException.class, () ->
                categoryService.renameCategory("user-attacker", "cat-1", request));
    }

    @Test
    @DisplayName("Delete custom category re-associates affected journals to 'Other'")
    void deleteCategory_Success_ReassociatesToOther() {
        JournalEntry entry = JournalEntry.builder()
                .id("j-1")
                .userId("user-1")
                .title("Journal 1")
                .category("Productivity Hacks")
                .build();

        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(customCategory));
        when(journalRepository.findByUserIdOrderByCreatedAtDesc("user-1")).thenReturn(List.of(entry));

        categoryService.deleteCategory("user-1", "cat-1");

        assertEquals("Other", entry.getCategory());
        verify(journalRepository).save(entry);
        verify(categoryRepository).delete(customCategory);
    }

    @Test
    @DisplayName("Delete predefined category throws BadRequestException")
    void deleteCategory_Fails_OnPredefined() {
        when(categoryRepository.findById("cat-pred-1")).thenReturn(Optional.of(predefinedCategory));

        assertThrows(BadRequestException.class, () ->
                categoryService.deleteCategory("user-1", "cat-pred-1"));
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Suggest category delegates to NLP tagging service without modifying journal")
    void suggestCategory_Success() {
        when(taggingService.classifyCategory(anyString())).thenReturn("Study");

        CategorySuggestionResponse response = categoryService.suggestCategory("I reviewed algorithm problems and data structures");

        assertNotNull(response);
        assertEquals("Study", response.getSuggestedCategory());
        assertTrue(response.getConfidence() > 0.5);
    }
}
