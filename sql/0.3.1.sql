USE `blog-draft`;
ALTER TABLE `articles`
	CHANGE COLUMN `trimmed_content` `trimmed_content` VARCHAR(1000) NULL DEFAULT NULL AFTER `content`;
