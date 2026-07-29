package com.example.ocr_challenge.repository;

import com.example.ocr_challenge.dto.PostDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BoardRepository {

    List<PostDto> findAll();

    PostDto create(
            String title,
            String content,
            String author,
            String attachedOcrText,
            String deleteTokenHash,
            LocalDateTime createdAt
    );

    boolean incrementLikeCount(Long id);

    Optional<String> findDeleteTokenHash(Long id);

    boolean deleteById(Long id);
}
