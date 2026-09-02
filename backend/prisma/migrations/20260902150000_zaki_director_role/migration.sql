-- Set zaki@nexerp.id to DIRECTOR role
UPDATE users
SET roles = ARRAY['DIRECTOR']::"UserRole"[]
WHERE email = 'zaki@nexerp.id';