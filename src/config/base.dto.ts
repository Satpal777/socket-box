import * as z from "zod";

export abstract class BaseDTO {
    protected static schema = z.object({});

    static safeValidate<T>(data: unknown) {
        const result = this.schema.safeParse(data);

        if (result.error) {
            const errors = result.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`).join(', ');
            return { errors, value: null };
        }

        return { errors: null, value: result.data };
    }
}