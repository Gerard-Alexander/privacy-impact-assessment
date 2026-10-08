ALTER TABLE `User`
    MODIFY COLUMN `Units` VARCHAR(255) NOT NULL DEFAULT 'n/a';

ALTER TABLE `Unit`
    MODIFY COLUMN `name` VARCHAR(255) NOT NULL;

INSERT IGNORE INTO `Unit` (`name`)
SELECT DISTINCT TRIM(`officeUnit`)
FROM `AuthorizedParties`
WHERE `officeUnit` IS NOT NULL AND TRIM(`officeUnit`) <> '';

INSERT IGNORE INTO `Unit` (`name`)
SELECT DISTINCT TRIM(`Units`)
FROM `User`
WHERE `Units` IS NOT NULL AND TRIM(`Units`) <> '' AND TRIM(`Units`) <> 'n/a';