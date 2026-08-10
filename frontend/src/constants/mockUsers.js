import { ROLES } from "./roles";

export const MOCK_USERS = {
  demandeur: {
    id: 1,
    full_name: "Sara Benali",
    email: "demandeur@test.com",
    role: ROLES.DEMANDEUR,
  },

  acheteur: {
    id: 2,
    full_name: "Ahmed Bensaid",
    email: "acheteur@test.com",
    role: ROLES.ACHETEUR,
  },

  transitaire: {
    id: 3,
    full_name: "Karim Touati",
    email: "transitaire@test.com",
    role: ROLES.TRANSITAIRE,
  },

  controleur: {
    id: 4,
    full_name: "Nadia Amrani",
    email: "controleur@test.com",
    role: ROLES.CONTROLEUR,
  },

  directeur: {
    id: 5,
    full_name: "Mourad Khelifi",
    email: "directeur@test.com",
    role: ROLES.DIRECTEUR,
  },

  admin: {
    id: 6,
    full_name: "Administrateur",
    email: "admin@test.com",
    role: ROLES.ADMIN,
  },
}