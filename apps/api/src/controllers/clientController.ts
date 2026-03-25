import { NextFunction, Request, Response } from "express";
import * as service from "../services/clientService.js";
import { clientSchema } from "../validators/clientValidator.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid client id");
  }
  return id;
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = clientSchema.parse(req.body);
    const client = await service.createClient(payload);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
}

export async function getClients(_req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await service.getClients();
    res.json({ success: true, data: clients });
  } catch (error) {
    next(error);
  }
}

export async function getClientById(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await service.getClientById(parseId(req.params.id));
    if (!client) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = clientSchema.partial().parse(req.body);
    const client = await service.updateClient(parseId(req.params.id), payload);
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteClient(parseId(req.params.id));
    res.json({ success: true, message: "Client deleted" });
  } catch (error) {
    next(error);
  }
}
