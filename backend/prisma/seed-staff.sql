INSERT INTO "rnd_staff" (id, name, role, "isActive") 
VALUES 
(gen_random_uuid(), 'Amira', 'HEAD_RND', true),
(gen_random_uuid(), 'Panca', 'ASSISTANT_RND', true),
(gen_random_uuid(), 'Yaya', 'RND_STAFF', true)
ON CONFLICT DO NOTHING;
