package com.notesphere.dto.request;
 
import com.notesphere.entity.enums.JournalVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishJournalRequest {
 
    private String communityId;
 
    private JournalVisibility visibility;
 
    public PublishJournalRequest(String communityId) {
        this.communityId = communityId;
        this.visibility = JournalVisibility.COMMUNITY;
    }
}

