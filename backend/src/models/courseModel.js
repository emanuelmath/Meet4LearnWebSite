export class Course{
    constructor({ id, name, subject, start_date, finish_date, price, teacher_id, status}) {
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.start_date = start_date;
        this.finish_date = finish_date;
        this.price = price;
        this.teacher_id  = teacher_id;
        this.status = status;
    }
}