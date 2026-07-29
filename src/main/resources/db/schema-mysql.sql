CREATE TABLE posts (
    id                BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    content           TEXT NOT NULL,
    author            VARCHAR(50) NOT NULL DEFAULT '익명',
    attached_ocr_text TEXT,
    like_count        INTEGER NOT NULL DEFAULT 0,
    delete_token_hash VARCHAR(255) NOT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_posts_title_not_blank
        CHECK (char_length(trim(title)) > 0),
    CONSTRAINT chk_posts_content_not_blank
        CHECK (char_length(trim(content)) > 0),
    CONSTRAINT chk_posts_author_not_blank
        CHECK (char_length(trim(author)) > 0),
    CONSTRAINT chk_posts_like_count_non_negative
        CHECK (like_count >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_posts_created_at
    ON posts (created_at DESC);
