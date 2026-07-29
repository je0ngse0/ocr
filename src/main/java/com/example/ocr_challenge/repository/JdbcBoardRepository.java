package com.example.ocr_challenge.repository;

import com.example.ocr_challenge.dto.PostDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JdbcBoardRepository implements BoardRepository {

    private static final DateTimeFormatter DISPLAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<PostDto> findAll() {
        return jdbcTemplate.query("""
                SELECT id, title, content, author, attached_ocr_text, like_count, created_at
                FROM posts
                ORDER BY created_at DESC, id DESC
                """, (rs, rowNum) -> PostDto.builder()
                .id(rs.getLong("id"))
                .title(rs.getString("title"))
                .content(rs.getString("content"))
                .author(rs.getString("author"))
                .attachedOcrText(rs.getString("attached_ocr_text"))
                .likeCount(rs.getInt("like_count"))
                .createdAt(rs.getTimestamp("created_at").toLocalDateTime().format(DISPLAY_DATE_FORMAT))
                .build());
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
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO posts (
                        title, content, author, attached_ocr_text,
                        like_count, delete_token_hash, created_at
                    )
                    VALUES (?, ?, ?, ?, 0, ?, ?)
                    """, new String[]{"id"});
            statement.setString(1, title);
            statement.setString(2, content);
            statement.setString(3, author);
            statement.setString(4, attachedOcrText);
            statement.setString(5, deleteTokenHash);
            statement.setTimestamp(6, Timestamp.valueOf(createdAt));
            return statement;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId == null) {
            throw new IllegalStateException("MySQL did not return a generated post id");
        }

        return PostDto.builder()
                .id(generatedId.longValue())
                .title(title)
                .content(content)
                .author(author)
                .attachedOcrText(attachedOcrText)
                .likeCount(0)
                .createdAt(createdAt.format(DISPLAY_DATE_FORMAT))
                .build();
    }

    @Override
    public boolean incrementLikeCount(Long id) {
        return jdbcTemplate.update("""
                UPDATE posts
                SET like_count = like_count + 1
                WHERE id = ?
                """, id) == 1;
    }

    @Override
    public Optional<String> findDeleteTokenHash(Long id) {
        List<String> hashes = jdbcTemplate.query("""
                SELECT delete_token_hash
                FROM posts
                WHERE id = ?
                """, (rs, rowNum) -> rs.getString("delete_token_hash"), id);
        return hashes.stream().findFirst();
    }

    @Override
    public boolean deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM posts WHERE id = ?", id) == 1;
    }
}
