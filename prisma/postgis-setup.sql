-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add a PostGIS geography column to the agents table after Prisma migration
-- This column will be used for ST_DWithin spatial queries
ALTER TABLE agents ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Populate the geography column from lat/lng values
UPDATE agents
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

-- Spatial index for fast geospatial lookups
CREATE INDEX IF NOT EXISTS idx_agents_location ON agents USING GIST (location);

-- Trigger to auto-sync the location column when lat/lng changes
CREATE OR REPLACE FUNCTION sync_agent_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_agent_location ON agents;
CREATE TRIGGER trg_sync_agent_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON agents
  FOR EACH ROW
  EXECUTE FUNCTION sync_agent_location();
