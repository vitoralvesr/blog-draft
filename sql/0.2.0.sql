USE `blog-draft`
ALTER TABLE `articles`
	ADD COLUMN `markdown_break` TINYINT(1) NULL DEFAULT NULL AFTER `trimmed_content`,
	DROP COLUMN `seq`;
