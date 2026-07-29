package com.example.ocr_challenge.service;

import com.example.ocr_challenge.dto.PostDto;
import com.example.ocr_challenge.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public List<PostDto> getAllPosts() {
        return boardRepository.findAll();
    }

    public PostCreationResult createPost(
            String title,
            String content,
            String author,
            String attachedOcrText
    ) {
        LocalDateTime now = LocalDateTime.now();
        String authorName = (author != null && !author.isBlank()) ? author : "익명";
        String deleteToken = generateDeleteToken();

        PostDto post = boardRepository.create(
                title,
                content,
                authorName,
                attachedOcrText,
                hashDeleteToken(deleteToken),
                now
        );
        return new PostCreationResult(post, deleteToken);
    }

    public boolean likePost(Long id) {
        return boardRepository.incrementLikeCount(id);
    }

    public DeleteResult deletePost(Long id, String deleteToken) {
        String storedHash = boardRepository.findDeleteTokenHash(id).orElse(null);
        if (storedHash == null) {
            return DeleteResult.NOT_FOUND;
        }
        if (deleteToken == null || deleteToken.isBlank()
                || !MessageDigest.isEqual(
                        storedHash.getBytes(java.nio.charset.StandardCharsets.US_ASCII),
                        hashDeleteToken(deleteToken).getBytes(java.nio.charset.StandardCharsets.US_ASCII)
                )) {
            return DeleteResult.FORBIDDEN;
        }

        return boardRepository.deleteById(id) ? DeleteResult.DELETED : DeleteResult.NOT_FOUND;
    }

    private String generateDeleteToken() {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashDeleteToken(String deleteToken) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(deleteToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    public record PostCreationResult(PostDto post, String deleteToken) {
    }

    public enum DeleteResult {
        DELETED,
        NOT_FOUND,
        FORBIDDEN
    }
}
