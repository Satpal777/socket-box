import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { checkboxes, Checkbox } from "../../db/schema.js";

export class CheckboxService {

  async getAll(): Promise<Checkbox[]> {
    return db.select().from(checkboxes).orderBy(checkboxes.id);
  }


  async getById(id: string): Promise<Checkbox | null> {
    const rows = await db
      .select()
      .from(checkboxes)
      .where(eq(checkboxes.id, id))
      .limit(1);
    return rows[0] ?? null;
  }


  async update(
    id: string,
    checked: boolean,
    userId: string
  ): Promise<Checkbox> {

    const rows = await db.update(checkboxes).set({ 
      checked: checked ? 1 : 0, 
      updatedBy: userId,
      updatedAt: new Date()
    })
        .where(eq(checkboxes.id, id))
        .returning();

    return rows[0]!;
    
  }

}

export const checkboxService = new CheckboxService();