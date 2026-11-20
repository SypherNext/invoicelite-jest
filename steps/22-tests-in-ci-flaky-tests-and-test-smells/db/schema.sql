-- InvoiceLite's one table. Lines and totals are JSON; every amount is in cents.
create table if not exists invoices (
  number            text primary key,
  customer          text not null,
  country           char(2) not null,
  status            text not null check (status in ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE')),
  issue_date        date,
  due_date          date,
  payment_reference text,
  currency          char(3) not null,
  lines             jsonb not null,
  totals            jsonb not null
);

create index if not exists invoices_status on invoices (status);
