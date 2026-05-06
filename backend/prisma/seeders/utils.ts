
import { faker } from '@faker-js/faker';

export const randomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
export const randomDecimal = (min: number, max: number, precision: number = 2): number => 
  parseFloat((Math.random() * (max - min) + min).toFixed(precision));

export const randomAprilDate = () => {
  return faker.date.between({ from: '2026-04-01', to: '2026-04-30' });
};

export const generateSequence = (prefix: string, length: number = 5): string => {
  const num = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
  return `${prefix}-${new Date().getFullYear().toString().slice(-2)}${num}`;
};
