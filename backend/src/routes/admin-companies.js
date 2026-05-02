import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

function publicCompany(company) {
  if (!company) return null;
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

adminCompaniesRouter.get("/", async (_req, res) => {
  const companies = await appStore.listCompanies();
  res.json(companies.map(publicCompany));
});

adminCompaniesRouter.post("/", validateBody(["name", "slug"]), async (req, res) => {
  const existing = await appStore.findCompanyBySlug(req.body.slug);

  if (existing) {
    return res.status(409).json({ error: "Slug ja cadastrado" });
  }

  try {
    const company = await appStore.createCompany(req.body);
    return res.status(201).json(publicCompany(company));
  } catch (error) {
    console.error("[admin-companies] create error", error);
    return res.status(500).json({ error: "Erro ao criar empresa" });
  }
});

adminCompaniesRouter.patch("/:id", async (req, res) => {
  try {
    const company = await appStore.updateCompany(req.params.id, req.body);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    return res.json(publicCompany(company));
  } catch (error) {
    return res.status(404).json({ error: "Company not found or update failed" });
  }
});

adminCompaniesRouter.delete("/:id", async (req, res) => {
  try {
    const company = await appStore.deactivateCompany(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    return res.json({ success: true, company: publicCompany(company) });
  } catch (error) {
    return res.status(404).json({ error: "Company not found" });
  }
});
