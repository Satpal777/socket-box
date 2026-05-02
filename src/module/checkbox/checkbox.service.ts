import { redisClient } from "../../redis/redis.js";
import type { Checkbox } from "../../db/schema.js";

const KEY_PREFIX = "checkbox_";
export const TOTAL_CHECKBOXES = 1_000_000;
const CHECKED_SET_KEY = "checked_checkboxes";
interface RedisFields {
  checked?: string;
  updated_by?: string;
  updated_at?: string;
  updatedBy?: string;
  updatedAt?: string;
}

function toKey(id: string | number): string {
  return `${KEY_PREFIX}${id}`;
}

function parseFields(id: string, fields: RedisFields): Checkbox {
  const rawAt = fields.updated_at ?? fields.updatedAt ?? null;
  return {
    id,
    checked: parseInt(fields.checked ?? "0", 10),
    updatedBy: fields.updated_by ?? fields.updatedBy ?? null,
    updatedAt: rawAt ? new Date(rawAt) : null,
  };
}

export class CheckboxService {

  /**
   * Returns only checked checkboxes.
   * Uses a Redis Set to avoid scanning all 1M keys.
   * Reads: 1 SMEMBERS + N pipelined HGETALLs (N = number of checked boxes)
   */
  async getAll(): Promise<Checkbox[]> {
    const checkedIds = await redisClient.smembers(CHECKED_SET_KEY);
    if (checkedIds.length === 0) return [];

    const pipeline = redisClient.pipeline();
    for (const id of checkedIds) {
      pipeline.hgetall(toKey(id));
    }

    const results = await pipeline.exec();
    const checkboxes: Checkbox[] = [];

    for (let i = 0; i < results!.length; i++) {
      const [err, fields] = results![i] as [Error | null, RedisFields | null];
      if (!err && fields && Object.keys(fields).length > 0) {
        checkboxes.push(parseFields(checkedIds[i]!, fields));
      }
    }

    return checkboxes.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }

  async getById(id: string): Promise<Checkbox | null> {
    const fields = await redisClient.hgetall(toKey(id));
    if (!fields || Object.keys(fields).length === 0) return null;
    return parseFields(id, fields as RedisFields);
  }

  /**
   * Direct HSET + Set membership update — all in one pipeline (1 round trip).
   * Checked=true  → SADD checked_checkboxes id
   * Checked=false → SREM checked_checkboxes id
   */
  async update(id: string, checked: boolean, userId: string): Promise<Checkbox> {
    const updatedAt = new Date();

    const pipeline = redisClient.pipeline();

    pipeline.hset(toKey(id), {
      checked: checked ? 1 : 0,
      updated_by: userId,
      updated_at: updatedAt.toISOString(),
    });

    if (checked) {
      pipeline.sadd(CHECKED_SET_KEY, id);
    } else {
      pipeline.srem(CHECKED_SET_KEY, id);
    }

    await pipeline.exec();

    return {
      id,
      checked: checked ? 1 : 0,
      updatedBy: userId,
      updatedAt,
    };
  }

}

export const checkboxService = new CheckboxService();