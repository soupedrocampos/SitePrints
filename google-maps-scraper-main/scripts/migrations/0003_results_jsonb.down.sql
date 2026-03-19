BEGIN;
    ALTER TABLE results 
        ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS openhours TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS pluscode TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS rating NUMERIC NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

    -- Recover data from JSONB if available
    UPDATE results SET
        title = COALESCE(data->>'title', ''),
        category = COALESCE(data->>'category', ''),
        address = COALESCE(data->>'address', ''),
        openhours = COALESCE(data->>'openhours', ''),
        website = COALESCE(data->>'website', ''),
        phone = COALESCE(data->>'phone', ''),
        pluscode = COALESCE(data->>'pluscode', ''),
        review_count = COALESCE((data->>'review_count')::INT, 0),
        rating = COALESCE((data->>'rating')::NUMERIC, 0),
        latitude = (data->>'latitude')::DOUBLE PRECISION,
        longitude = (data->>'longitude')::DOUBLE PRECISION;

    ALTER TABLE results DROP COLUMN IF EXISTS data;
COMMIT;
