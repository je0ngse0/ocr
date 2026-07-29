package com.example.ocr_challenge.repository;

import com.example.ocr_challenge.dto.PostDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class JdbcBoardRepositoryTests {

    private JdbcBoardRepository repository;

    @BeforeEach
    void setUp() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:board;MODE=MySQL;DB_CLOSE_DELAY=-1",
                "sa",
                ""
        );
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.execute("DROP TABLE IF EXISTS posts");
        jdbcTemplate.execute("""
                CREATE TABLE posts (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    content TEXT NOT NULL,
                    author VARCHAR(50) NOT NULL DEFAULT '익명',
                    attached_ocr_text TEXT,
                    like_count INTEGER NOT NULL DEFAULT 0,
                    delete_token_hash VARCHAR(255) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
        repository = new JdbcBoardRepository(jdbcTemplate);
    }

    @Test
    void executesPostCrudQueries() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 28, 20, 10);
        PostDto created = repository.create(
                "title",
                "content",
                "author",
                "ocr text",
                "a".repeat(64),
                createdAt
        );

        assertThat(created.getId()).isPositive();
        assertThat(repository.findAll())
                .singleElement()
                .satisfies(post -> {
                    assertThat(post.getTitle()).isEqualTo("title");
                    assertThat(post.getLikeCount()).isZero();
                });
        assertThat(repository.incrementLikeCount(created.getId())).isTrue();
        assertThat(repository.findAll().get(0).getLikeCount()).isEqualTo(1);
        assertThat(repository.findDeleteTokenHash(created.getId())).contains("a".repeat(64));
        assertThat(repository.deleteById(created.getId())).isTrue();
        assertThat(repository.findAll()).isEmpty();
    }
}
