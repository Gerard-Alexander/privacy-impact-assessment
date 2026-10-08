-- Add the user's organizational unit and assign existing accounts n/a.
ALTER TABLE `User`
    ADD COLUMN `Units` VARCHAR(20) NOT NULL DEFAULT 'n/a';