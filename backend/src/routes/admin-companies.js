import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { memoryStore } from "../store/memory-store.js";

function publicCompany(company) {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    is_active: company.is_active,
    created_at: company.created_at
  };
}

export const adminCompaniesRouter = Router();

adminCompaniesRouter.use(authenticate, requireAdmin);

adminCompaniesRouter.get("/", (_req, res) => {
  res.json(memoryStore.listCompanies().map(publicCompany));
});

adminCompaniesRouter.post("/", validateBody(["name", "slug"]), (req, res) => {
  const slugInUse = memoryStore.listCompanies().some((company) => company.slug === req.body.slug);

  if (slugInUse) {
    return res.status(409).json({ error: "Slug ja cadastrado" });
  }

  const company = memoryStore.createCompany(req.body);
  return res.status(201).json(publicCompany(company));
});

adminCompaniesRouter.patch("/:id", (req, res) => {
  const company = memoryStore.updateCompany(req.params.id, req.body);

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  return res.json(publicCompany(company));
});

adminCompaniesRouter.delete("/:id", (req, res) => {
  const company = memoryStore.deactivateCompany(req.params.id);

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  return res.json({ success: true, company: publicCompany(company) });
});
