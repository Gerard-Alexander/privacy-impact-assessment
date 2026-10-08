ALTER TABLE `PiaAssessment`
    MODIFY COLUMN `piaName` VARCHAR(300) NULL;

INSERT IGNORE INTO `Unit` (`name`) VALUES ('n/a');

CREATE TEMPORARY TABLE `_PiaUnitNameMap` AS
SELECT
    `assessmentId`,
    CONCAT(
        'PIA-',
        `unitCode`,
        '-',
        CASE WHEN `unitNumber` < 1000 THEN LPAD(`unitNumber`, 3, '0') ELSE CAST(`unitNumber` AS CHAR) END
    ) AS `newPiaName`
FROM (
    SELECT
        `assessmentId`,
        `unitCode`,
        ROW_NUMBER() OVER (PARTITION BY `unitCode` ORDER BY `assessmentId`) AS `unitNumber`
    FROM (
        SELECT
            `sourceUnit`.`assessmentId`,
            COALESCE(
                NULLIF(
                    UPPER(TRIM(BOTH '-' FROM REGEXP_REPLACE(
                        CASE WHEN LOWER(`sourceUnit`.`unitName`) = 'n/a' THEN 'NA' ELSE `sourceUnit`.`unitName` END,
                        '[^A-Za-z0-9]+',
                        '-'
                    ))),
                    ''
                ),
                'UNIT'
            ) AS `unitCode`
        FROM (
            SELECT
                `assessment`.`id` AS `assessmentId`,
                COALESCE(
                    `headOffice`.`officeUnit`,
                    NULLIF(TRIM(`creator`.`Units`), ''),
                    'n/a'
                ) AS `unitName`
            FROM `PiaAssessment` AS `assessment`
            LEFT JOIN (
                SELECT `piaAssessment_id`, MAX(NULLIF(TRIM(`officeUnit`), '')) AS `officeUnit`
                FROM `AuthorizedParties`
                WHERE `userType` = 'HEAD_OFFICE'
                GROUP BY `piaAssessment_id`
            ) AS `headOffice` ON `headOffice`.`piaAssessment_id` = `assessment`.`id`
            LEFT JOIN `User` AS `creator` ON `creator`.`id` = `assessment`.`creatorId`
        ) AS `sourceUnit`
    ) AS `unitNames`
) AS `rankedNames`;

UPDATE `PiaAssessment`
SET `piaName` = CONCAT('__PIA_RENUMBER__', `id`);

UPDATE `PiaAssessment` AS `assessment`
JOIN `_PiaUnitNameMap` AS `unitMap` ON `unitMap`.`assessmentId` = `assessment`.`id`
SET `assessment`.`piaName` = `unitMap`.`newPiaName`;

DROP TEMPORARY TABLE `_PiaUnitNameMap`;