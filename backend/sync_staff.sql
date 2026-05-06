INSERT INTO users (id, email, "fullName", "passwordHash", roles) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'diva@dreamlab.id', 'DIVA', 'pass', '{COMMERCIAL}'::"UserRole"[]) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, "fullName", "passwordHash", roles) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'nisa@dreamlab.id', 'NISA', 'pass', '{COMMERCIAL}'::"UserRole"[]) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO bussdev_staffs (id, name, "userId", "targetRevenue", "isActive") 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'DIVA', (SELECT id FROM users WHERE email='diva@dreamlab.id'), 1000000000, true) 
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO bussdev_staffs (id, name, "userId", "targetRevenue", "isActive") 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'NISA', (SELECT id FROM users WHERE email='nisa@dreamlab.id'), 1000000000, true) 
ON CONFLICT ("userId") DO NOTHING;
