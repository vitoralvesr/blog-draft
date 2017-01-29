USE `blog-draft`;
ALTER TABLE `articles`
	ADD COLUMN `status` ENUM('published','draft','trashed') NOT NULL DEFAULT 'published' AFTER `edited`;