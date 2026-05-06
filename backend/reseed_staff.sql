-- Clear existing staff to avoid confusion with broken records
DELETE FROM bussdev_staffs;

-- Re-insert DIVA
INSERT INTO users (id, email, "fullName", "passwordHash", roles) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'diva@dreamlab.id', 'DIVA', 'pass', '{COMMERCIAL}'::"UserRole"[]) 
ON CONFLICT (email) DO UPDATE SET "fullName" = 'DIVA', roles = '{COMMERCIAL}'::"UserRole"[];

INSERT INTO bussdev_staffs (id, name, "userId", "targetRevenue", "isActive") 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'DIVA', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1000000000, true);

-- Re-insert NISA
INSERT INTO users (id, email, "fullName", "passwordHash", roles) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'nisa@dreamlab.id', 'NISA', 'pass', '{COMMERCIAL}'::"UserRole"[]) 
ON CONFLICT (email) DO UPDATE SET "fullName" = 'NISA', roles = '{COMMERCIAL}'::"UserRole"[];

INSERT INTO bussdev_staffs (id, name, "userId", "targetRevenue", "isActive") 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'NISA', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 1000000000, true);
