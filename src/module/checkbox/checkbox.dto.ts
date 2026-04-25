import z from "zod";
import { BaseDTO } from "../../config/base.dto.js";

export class CheckboxDTO extends BaseDTO {
    static schema = z.object({
        id: z.string().min(1),
        checked: z.boolean(),
        userId: z.string().min(1),
    })
}