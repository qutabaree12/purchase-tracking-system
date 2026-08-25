# Department Feature — Setup Documentation

## Purpose

Prior to this change, the `chef département` (department head) role had no way to filter
the list of purchase requests (`DemandeAchat`) — every department head could see every
request in the system, regardless of who submitted it.

The root cause: there was no relationship between an employee and an organizational
department. A `DOT` (geographic zone, e.g. "Alger-Centre") can contain **multiple**
departments (e.g. Purchasing, Marketing, IT), so filtering directly by `DOT` was not
accurate enough — a department head is responsible for one specific department, not
an entire geographic zone.

**Solution:** introduce a `Departement` model, linked to both a `DOT` and a chef
(via `id_chef`), and give each `Employe` an optional `id_departement` foreign key.
The `DemandeAchatViewSet.get_queryset()` now filters requests for a department head
by walking the relation: `DemandeAchat → id_demandeur → id_departement → id_chef`.

## Django model changes

Added to `backend/authentication/models.py`:

```python
class Departement(models.Model):
    """Département d'Algérie Telecom, rattaché à une DOT géographique."""

    id_departement = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    dot = models.CharField(max_length=30)
    id_chef = models.ForeignKey(
        'Employe',
        on_delete=models.SET_NULL,
        db_column='id_chef',
        null=True,
        blank=True,
        related_name='departements_diriges',
    )

    class Meta:
        db_table = 'departement'
        managed = True
```

Added to `Employe`:

```python
id_departement = models.ForeignKey(
    Departement,
    on_delete=models.SET_NULL,
    db_column='id_departement',
    null=True,
    blank=True,
    related_name='employes',
)
```

Applied via:

```bash
python manage.py makemigrations authentication
python manage.py migrate
```

## Backend filter (demandes/views.py)

```python
def get_queryset(self):
    qs = DemandeAchat.objects.select_related('id_demandeur').prefetch_related('lignes__id_produit')
    role = getattr(self.request.user, 'role', None)
    if role == 'acheteur':
        qs = qs.filter(id_acheteur=self.request.user)
    elif role == 'demandeur':
        qs = qs.filter(id_demandeur=self.request.user)
    elif role == 'chef département':
        qs = qs.filter(id_demandeur__id_departement__id_chef=self.request.user)
    statut = self.request.query_params.get('statut')
    if statut:
        qs = qs.filter(statut=statut)
    return qs
```

## SQL — table creation and seed data

### 1. Create the `departement` table

```sql
CREATE TABLE departement (
    id_departement  SERIAL PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    dot             VARCHAR(30) NOT NULL,
    id_chef         BIGINT REFERENCES "Employé"(id_emp) ON DELETE SET NULL
);

ALTER TABLE "Employé" ADD COLUMN id_departement INTEGER REFERENCES departement(id_departement) ON DELETE SET NULL;
```

*(Note: if the Django migration already created this table, skip this step — it's
included here for reference/documentation only.)*

### 2. Seed departments

```sql
INSERT INTO departement (nom, dot, id_chef) VALUES
('Direction Achats Alger', 'Alger-Centre', 6),   -- Rachid Toumi
('Marketing Alger', 'Alger-Centre', 7),           -- Zahia Slimani
('IT Alger', 'Alger-Centre', NULL),
('Direction Achats Oran', 'Oran', NULL),
('Marketing Oran', 'Oran', NULL),
('IT Sétif', 'Sétif', NULL);
```

### 3. Assign employees to departments

```sql
UPDATE "Employé" SET id_departement = 1 WHERE id_emp = 6;  -- Rachid Toumi (chef)
UPDATE "Employé" SET id_departement = 2 WHERE id_emp = 7;  -- Zahia Slimani (chef)

UPDATE "Employé" SET id_departement = 1 WHERE id_emp = 3;  -- Sofiane Kadi (demandeur)
UPDATE "Employé" SET id_departement = 1 WHERE id_emp = 4;  -- Nadia Boukhelif (demandeur)
UPDATE "Employé" SET id_departement = 2 WHERE id_emp = 5;  -- Mohamed Cherif (demandeur)
UPDATE "Employé" SET id_departement = 4 WHERE id_emp = 15; -- Leila Bouaziz (demandeur, no chef assigned — edge case)

UPDATE "Employé" SET id_departement = 1 WHERE id_emp = 8;  -- Ali Mokhtari (acheteur)
UPDATE "Employé" SET id_departement = 2 WHERE id_emp = 9;  -- Yamina Ziani (acheteur)
```

## ⚠️ Known issue and fix — duplicate departments without a chef

The seed script was run more than once (or seeded partially by hand before the
final version), which resulted in **duplicate "Direction Achats Alger" rows** —
one without a chef (`id_departement=1`) and one with a chef (`id_departement=4`,
`id_chef=6`, Rachid Toumi). Some employees ended up assigned to the chef-less
duplicate, so they never appeared in their department head's filtered list.

**Symptom:** Nadia Boukhelif (id_emp=4) created a DA, but it never showed up for
either chef département — because she was linked to `id_departement=1`, which has
`id_chef=null`.

### Fix applied

```sql
-- 1. Check who is linked to the chef-less duplicates before touching anything
SELECT id_emp, nom_emp, prenom_emp, id_departement FROM "Employé" WHERE id_departement IN (1, 2, 3);

-- 2. Reassign employees to the departments that actually have a chef
UPDATE "Employé" SET id_departement = 4 WHERE id_emp IN (3, 4, 8);  -- Sofiane Kadi, Nadia Boukhelif, Ali Mokhtari -> Direction Achats Alger (chef: Rachid Toumi)
UPDATE "Employé" SET id_departement = 5 WHERE id_emp IN (5, 9);     -- Mohamed Cherif, Yamina Ziani -> Marketing Alger (chef: Zahia Slimani)
-- Leila Bouaziz stays on id_departement=4 or 2 depending on the "no chef" test case you want to keep

-- 3. Delete the now-empty duplicate/chef-less departments
DELETE FROM departement WHERE id_departement IN (1, 2, 3, 6, 7);

-- 4. Verify
SELECT e.id_emp, e.nom_emp, e.prenom_emp, e.role, d.nom AS departement, d.dot, d.id_chef
FROM "Employé" e
LEFT JOIN departement d ON e.id_departement = d.id_departement
ORDER BY e.id_emp;
```

**Lesson learned:** always re-run the verification query after seeding, and check
`id_chef` specifically — a department existing is not enough, it must have a chef
assigned for the `chef département` filter to surface any requests.

## Resulting employee/department mapping

| id_emp | nom_emp   | prénom_emp | role              | departement             | dot          |
|--------|-----------|------------|-------------------|--------------------------|--------------|
| 1      | Benali    | Ahmed      | admin             | null                     | null         |
| 2      | Ouali     | Fatima     | admin             | null                     | null         |
| 3      | Kadi      | Sofiane    | demandeur         | Direction Achats Alger   | Alger-Centre |
| 4      | Boukhelif | Nadia      | demandeur         | Direction Achats Alger   | Alger-Centre |
| 5      | Cherif    | Mohamed    | demandeur         | Direction Achats Oran    | Oran         |
| 6      | Toumi     | Rachid     | chef département  | Direction Achats Alger   | Alger-Centre |
| 7      | Slimani   | Zahia      | chef département  | Direction Achats Oran    | Oran         |
| 8      | Mokhtari  | Ali        | acheteur          | Direction Achats Alger   | Alger-Centre |
| 9      | Ziani     | Yamina     | acheteur          | Direction Achats Oran    | Oran         |
| 10     | Hadjadj   | Lynda      | acheteur          | null                     | null         |
| 11     | Belaid    | Nour       | transitaire       | null                     | null         |
| 12     | Said      | Hocine     | transitaire       | null                     | null         |
| 13     | Guenoun   | Tahar      | directeur         | null                     | null         |
| 14     | Sebbah    | Mouloud    | acheteur          | null                     | null         |
| 15     | Bouaziz   | Leila      | demandeur         | Direction Achats Alger   | Alger-Centre |

## Test scenarios

- **Logged in as Rachid Toumi (id_emp=6)** → should only see purchase requests
  submitted by Sofiane Kadi (3), Nadia Boukhelif (4), and Leila Bouaziz (15) —
  all three belong to "Direction Achats Alger".
- **Logged in as Zahia Slimani (id_emp=7)** → should only see requests submitted
  by Mohamed Cherif (5) — the only demandeur in "Direction Achats Oran".
- Employees with `id_departement = null` (admin, transitaire, directeur, and some
  acheteurs) are intentionally left unassigned — department scoping is only
  relevant for the `demandeur` → `chef département` relationship at this stage.

## Verification query

```sql
SELECT e.id_emp, e.nom_emp, e.prénom_emp, e.role, d.nom AS departement, d.dot
FROM "Employé" e
LEFT JOIN departement d ON e.id_departement = d.id_departement
ORDER BY e.id_emp;
```
