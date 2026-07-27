package com.example.ocr_challenge.service;

import com.example.ocr_challenge.dto.PostDto;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class BoardService {

    private final List<PostDto> posts = new ArrayList<>();
    private long idSequence = 1L;

    public BoardService() {
        // Initial sample posts
        createPost("환영합니다! OCR 스튜디오 커뮤니티입니다.", 
            "이미지에서 텍스트를 추출하고 결과를 자유롭게 공유해보세요!", 
            "익명관리자", 
            "샘플 OCR 인식 결과입니다.");
            
        createPost("손글씨 인식 팁 알고 계신가요?", 
            "선명한 고해상도 이미지를 올리고 대비를 명확히 하면 텍스트 인식률이 훨씬 좋아집니다.", 
            "익명사용자", 
            null);
    }

    public synchronized List<PostDto> getAllPosts() {
        return new ArrayList<>(posts);
    }

    public synchronized PostDto createPost(String title, String content, String author, String attachedOcrText) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String authorName = (author != null && !author.isBlank()) ? author : "익명";

        PostDto post = PostDto.builder()
                .id(idSequence++)
                .title(title)
                .content(content)
                .author(authorName)
                .createdAt(now)
                .likeCount(0)
                .attachedOcrText(attachedOcrText)
                .build();

        // Newest posts first
        posts.add(0, post);
        return post;
    }

    public synchronized boolean likePost(Long id) {
        for (PostDto post : posts) {
            if (post.getId().equals(id)) {
                int currentLikes = (post.getLikeCount() != null) ? post.getLikeCount() : 0;
                post.setLikeCount(currentLikes + 1);
                return true;
            }
        }
        return false;
    }

    public synchronized boolean deletePost(Long id) {
        return posts.removeIf(post -> post.getId().equals(id));
    }
}
