
INSERT INTO Study (number, name, createdAt) VALUES ('E-2024-001', 'Campagne Été 2024', CURRENT_TIMESTAMP);

INSERT INTO ProductType (name) VALUES ('PRESENTOIR DE COMPTOIR');
INSERT INTO ProductType (name) VALUES ('PRESENTOIR DE SOL');

-- Get IDs (assuming 1 and 2 for above)
INSERT INTO Element (name, productTypeId, quantity) VALUES ('Corps', 1, 1);
INSERT INTO Element (name, productTypeId, quantity) VALUES ('Fronton', 1, 1);
INSERT INTO Element (name, productTypeId, quantity) VALUES ('Socle', 1, 1);

INSERT INTO Element (name, productTypeId, quantity) VALUES ('Structure principale', 2, 1);
INSERT INTO Element (name, productTypeId, quantity) VALUES ('Header', 2, 1);
INSERT INTO Element (name, productTypeId, quantity) VALUES ('Base', 2, 1);
INSERT INTO Element (name, productTypeId, quantity) VALUES ('Etagère', 2, 3);

INSERT INTO Plate (name, width, height, cost, material) VALUES ('Microbis 1700x2000', 1700, 2000, 8.95, 'Microbis');
INSERT INTO Plate (name, width, height, cost, material) VALUES ('Carton Compact 1200x1600', 1200, 1600, 5.50, 'Carton Compact');
