import express, { type Express } from 'express';
import type { InvoiceService } from '../invoice-service';
import { toInvoiceView } from '../invoice-view';
import { errorHandler } from './error-handler';
import { parseNewInvoice, parsePayment } from './parse-new-invoice';

// The HTTP API. It only translates: JSON in, a service call, JSON out.
// Express 5 passes a rejected promise from a route to the error handler.
export function createApp(service: InvoiceService): Express {
  const app = express();
  app.use(express.json());

  app.post('/invoices', async (req, res) => {
    const invoice = await service.create(parseNewInvoice(req.body));
    res.status(201).location(`/invoices/${invoice.number}`).json(toInvoiceView(invoice));
  });

  app.get('/invoices/:number', async (req, res) => {
    res.json(toInvoiceView(await service.get(req.params.number)));
  });

  app.post('/invoices/:number/issue', async (req, res) => {
    res.json(toInvoiceView(await service.issue(req.params.number)));
  });

  app.post('/invoices/:number/pay', async (req, res) => {
    res.json(toInvoiceView(await service.pay(req.params.number)));
  });

  app.post('/invoices/:number/payments', async (req, res) => {
    res.json(toInvoiceView(await service.recordPayment(req.params.number, parsePayment(req.body))));
  });

  app.use(errorHandler);
  return app;
}
