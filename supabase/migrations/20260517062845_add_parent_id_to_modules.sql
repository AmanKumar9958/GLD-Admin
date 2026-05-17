-- Add parent_id column to modules table to support sub-modules / hierarchical folders
ALTER TABLE modules
ADD COLUMN parent_id UUID REFERENCES modules(id) ON DELETE CASCADE;
