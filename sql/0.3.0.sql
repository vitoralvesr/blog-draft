USE `blog-draft`;
ALTER TABLE `articles`
	ADD COLUMN `slink` VARCHAR(100) NOT NULL AFTER `id`,
	ADD INDEX `articles_slink` (`slink`);
ALTER TABLE `articles`
	CHANGE COLUMN `slink` `slink` VARCHAR(100) NULL DEFAULT NULL AFTER `id`;	