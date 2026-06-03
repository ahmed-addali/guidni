-- PostgreSQL Triggers for Qdrant Synchronization
-- This script creates a trigger function that broadcasts JSON payloads via pg_notify
-- whenever an INSERT, UPDATE, or DELETE occurs on the entity tables.
-- The planner-agent listens to 'qdrant_sync' to update the RAG index automatically.

CREATE OR REPLACE FUNCTION notify_qdrant_sync()
RETURNS trigger AS $$
DECLARE
    payload json;
    entity_type text;
BEGIN
    -- Determine entity type based on table name (lowercase string matching our _MODEL_TYPE_MAP)
    entity_type := lower(TG_TABLE_NAME);
    
    IF TG_OP = 'DELETE' THEN
        payload := json_build_object(
            'action', TG_OP,
            'table', entity_type,
            'id', OLD.id
        );
    ELSE
        payload := json_build_object(
            'action', TG_OP,
            'table', entity_type,
            'id', NEW.id
        );
    END IF;
    
    -- Send notification on channel 'qdrant_sync'
    PERFORM pg_notify('qdrant_sync', payload::text);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. Activity
DROP TRIGGER IF EXISTS trg_qdrant_sync_activity ON "Activity";
CREATE TRIGGER trg_qdrant_sync_activity
AFTER INSERT OR UPDATE OR DELETE ON "Activity"
FOR EACH ROW EXECUTE FUNCTION notify_qdrant_sync();

-- 2. Stay
DROP TRIGGER IF EXISTS trg_qdrant_sync_stay ON "Stay";
CREATE TRIGGER trg_qdrant_sync_stay
AFTER INSERT OR UPDATE OR DELETE ON "Stay"
FOR EACH ROW EXECUTE FUNCTION notify_qdrant_sync();

-- 3. Restaurant
DROP TRIGGER IF EXISTS trg_qdrant_sync_restaurant ON "Restaurant";
CREATE TRIGGER trg_qdrant_sync_restaurant
AFTER INSERT OR UPDATE OR DELETE ON "Restaurant"
FOR EACH ROW EXECUTE FUNCTION notify_qdrant_sync();

-- 4. Attraction
DROP TRIGGER IF EXISTS trg_qdrant_sync_attraction ON "Attraction";
CREATE TRIGGER trg_qdrant_sync_attraction
AFTER INSERT OR UPDATE OR DELETE ON "Attraction"
FOR EACH ROW EXECUTE FUNCTION notify_qdrant_sync();

-- 5. Rental
DROP TRIGGER IF EXISTS trg_qdrant_sync_rental ON "Rental";
CREATE TRIGGER trg_qdrant_sync_rental
AFTER INSERT OR UPDATE OR DELETE ON "Rental"
FOR EACH ROW EXECUTE FUNCTION notify_qdrant_sync();

-- 6. Transfer
DROP TRIGGER IF EXISTS trg_qdrant_sync_transfer ON "Transfer";
CREATE TRIGGER trg_qdrant_sync_transfer
AFTER INSERT OR UPDATE OR DELETE ON "Transfer"
FOR EACH ROW EXECUTE FUNCTION notify_qdrant_sync();
