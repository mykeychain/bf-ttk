// Weapon data types matching weapons.json structure

export interface DamageProfile {
  [distance: string]: number; // distance in meters -> damage value
}

export interface Weapon {
  category: string;
  control: number;
  precision: number;
  rpm: number;
  damage: DamageProfile;
}

export interface WeaponDatabase {
  [weaponName: string]: Weapon;
}

export interface WeaponWithName extends Weapon {
  name: string;
}
