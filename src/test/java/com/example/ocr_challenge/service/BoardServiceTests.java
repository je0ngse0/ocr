package com.example.ocr_challenge.service;

import com.example.ocr_challenge.dto.PostDto;
import com.example.ocr_challenge.repository.BoardRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class BoardServiceTests {

    @Test
    void persistsAndDeletesPostOnlyWithCreationToken() {
        InMemoryBoardRepository repository = new InMemoryBoardRepository();
        BoardService service = new BoardService(repository);
        BoardService.PostCreationResult created =
                service.createPost("title", "content", "author", null);

        assertThat(repository.findDeleteTokenHash(created.post().getId()))
                .hasValueSatisfying(hash -> assertThat(hash).hasSize(64));
        assertThat(service.deletePost(created.post().getId(), "wrong-token"))
                .isEqualTo(BoardService.DeleteResult.FORBIDDEN);
        assertThat(service.getAllPosts()).contains(created.post());

        assertThat(service.deletePost(created.post().getId(), created.deleteToken()))
                .isEqualTo(BoardService.DeleteResult.DELETED);
        assertThat(service.getAllPosts()).doesNotContain(created.post());
    }

    @Test
    void returnsNotFoundForUnknownPost() {
        BoardService service = new BoardService(new InMemoryBoardRepository());

        assertThat(service.deletePost(999L, "any-token"))
                .isEqualTo(BoardService.DeleteResult.NOT_FOUND);
    }

    private static final class InMemoryBoardRepository implements BoardRepository {
        private final Map<Long, PostDto> posts = new LinkedHashMap<>();
        private final Map<Long, String> tokenHashes = new LinkedHashMap<>();
        private long sequence = 1L;

        @Override
        public List<PostDto> findAll() {
            return new ArrayList<>(posts.values());
        }

        @Override
        public PostDto create(
                String title,
                String content,
                String author,
                String attachedOcrText,
                String deleteTokenHash,
                LocalDateTime createdAt
        ) {
            PostDto post = PostDto.builder()
                    .id(sequence++)
                    .title(title)
                    .content(content)
                    .author(author)
                    .attachedOcrText(attachedOcrText)
                    .likeCount(0)
                    .createdAt(createdAt.toString())
                    .build();
            posts.put(post.getId(), post);
            tokenHashes.put(post.getId(), deleteTokenHash);
            return post;
        }

        @Override
        public boolean incrementLikeCount(Long id) {
            PostDto post = posts.get(id);
            if (post == null) {
                return false;
            }
            post.setLikeCount(post.getLikeCount() + 1);
            return true;
        }

        @Override
        public Optional<String> findDeleteTokenHash(Long id) {
            return Optional.ofNullable(tokenHashes.get(id));
        }

        @Override
        public boolean deleteById(Long id) {
            tokenHashes.remove(id);
            return posts.remove(id) != null;
        }
    }
}
