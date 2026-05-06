-- 1. Ensure Diva and Nisa are the only active staffs
UPDATE bussdev_staffs SET "isActive" = false;

-- 2. Update/Create DIVA
INSERT INTO users (id, email, "fullName", "passwordHash", roles) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'diva@dreamlab.id', 'DIVA', 'pass', '{COMMERCIAL}'::"UserRole"[]) 
ON CONFLICT (email) DO UPDATE SET roles = '{COMMERCIAL}'::"UserRole"[];

INSERT INTO bussdev_staffs (id, name, "userId", "targetRevenue", "isActive") 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'DIVA', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1000000000, true)
ON CONFLICT ("userId") DO UPDATE SET name = 'DIVA', "isActive" = true;

-- 3. Update/Create NISA
INSERT INTO users (id, email, "fullName", "passwordHash", roles) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'nisa@dreamlab.id', 'NISA', 'pass', '{COMMERCIAL}'::"UserRole"[]) 
ON CONFLICT (email) DO UPDATE SET roles = '{COMMERCIAL}'::"UserRole"[];

INSERT INTO bussdev_staffs (id, name, "userId", "targetRevenue", "isActive") 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'NISA', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 1000000000, true)
ON CONFLICT ("userId") DO UPDATE SET name = 'NISA', "isActive" = true;
