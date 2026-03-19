BEGIN;
    -- 1. Add new column with default
    ALTER TABLE results ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';

    -- 2. Migrate data
    UPDATE results SET data = jsonb_build_object(
        'title', title,
        'category', category,
        'address', address,
        'openhours', openhours,
        'website', website,
        'phone', phone,
        'pluscode', pluscode,
        'review_count', review_count,
        'rating', rating,
        'latitude', latitude,
        'longitude', longitude
    ) WHERE data = '{}';

    -- 3. Drop old columns
    ALTER TABLE results DROP COLUMN IF EXISTS title;
    ALTER TABLE results DROP COLUMN IF EXISTS category;
    ALTER TABLE results DROP COLUMN IF EXISTS address;
    ALTER TABLE results DROP COLUMN IF EXISTS openhours;
    ALTER TABLE results DROP COLUMN IF EXISTS website;
    ALTER TABLE results DROP COLUMN IF EXISTS phone;
    ALTER TABLE results DROP COLUMN IF EXISTS pluscode;
    ALTER TABLE results DROP COLUMN IF EXISTS review_count;
    ALTER TABLE results DROP COLUMN IF EXISTS rating;
    ALTER TABLE results DROP COLUMN IF EXISTS latitude; 
    ALTER TABLE results DROP COLUMN IF EXISTS longitude;
COMMIT;
