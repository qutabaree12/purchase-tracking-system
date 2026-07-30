INSERT INTO Employé (id_emp, nom_emp, prénom_emp, email_emp, mot_de_passe, role, etat) VALUES
-- Administrateurs
(1,  'Benali',    'Ahmed',     'ahmed.benali@algerietelecom.dz',    'pass123', 'admin',             'actif'),
(2,  'Ouali',     'Fatima',    'fatima.ouali@algerietelecom.dz',    'pass123', 'admin',             'actif'),

-- Demandeurs (structure métier)
(3,  'Kadi',      'Sofiane',   'sofiane.kadi@algerietelecom.dz',     'pass123', 'demandeur',         'actif'),
(4,  'Boukhelif', 'Nadia',     'nadia.boukhelif@algerietelecom.dz',  'pass123', 'demandeur',         'actif'),
(5,  'Cherif',    'Mohamed',   'mohamed.cherif@algerietelecom.dz',   'pass123', 'demandeur',         'actif'),

-- Chefs de département
(6,  'Toumi',     'Rachid',    'rachid.toumi@algerietelecom.dz',     'pass123', 'chef département',  'actif'),
(7,  'Slimani',   'Zahia',     'zahia.slimani@algerietelecom.dz',    'pass123', 'chef département',  'actif'),

-- Acheteurs
(8,  'Mokhtari',  'Ali',       'ali.mokhtari@algerietelecom.dz',     'pass123', 'acheteur',          'actif'),
(9,  'Ziani',     'Yamina',    'yamina.ziani@algerietelecom.dz',     'pass123', 'acheteur',          'actif'),
(10, 'Hadjadj',   'Lynda',     'lynda.hadjadj@algerietelecom.dz',    'pass123', 'acheteur',          'actif'),

-- Transitaires
(11, 'Belaid',    'Nour',      'nour.belaid@algerietelecom.dz',      'pass123', 'transitaire',       'actif'),
(12, 'Said',      'Hocine',    'hocine.said@algerietelecom.dz',      'pass123', 'transitaire',       'actif'),

-- Directeur
(13, 'Guenoun',   'Tahar',     'tahar.guenoun@algerietelecom.dz',    'pass123', 'directeur',         'actif'),

-- Archivés
(14, 'Sebbah',    'Mouloud',   'mouloud.sebbah@algerietelecom.dz',   'pass123', 'acheteur',          'archivé'),
(15, 'Bouaziz',   'Leila',     'leila.bouaziz@algerietelecom.dz',    'pass123', 'demandeur',         'archivé');
