INSERT INTO "master_currencies" (id, code, symbol, "exchangeRate", "isMain") 
VALUES ('784b8d78-659c-4993-9c87-991f868019e0', 'IDR', 'Rp', 1.0, true), ('984b8d78-659c-4993-9c87-991f868019e1', 'USD', '$', 15500.0, false) 
ON CONFLICT (code) DO NOTHING; 

INSERT INTO "master_tax_rates" (id, name, rate, "isActive", description) 
VALUES ('884b8d78-659c-4993-9c87-991f868019e2', 'PPN 11%', 11.0, true, 'Pajak Pertambahan Nilai 11%'), ('884b8d78-659c-4993-9c87-991f868019e3', 'NON_TAX', 0.0, true, 'No Tax applied') 
ON CONFLICT (name) DO NOTHING;
