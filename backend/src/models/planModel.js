export class Plan {
  constructor({ id, name, price, max_students, max_active, commission_rate }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.max_students = max_students;
    this.max_active = max_active;
    this.commission_rate = commission_rate;
  }
}