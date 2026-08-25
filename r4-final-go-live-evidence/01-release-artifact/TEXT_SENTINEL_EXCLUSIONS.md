# TEXT_SENTINEL_EXCLUSIONS

Columns explicitly excluded from any UUID conversion. They MUST remain their declared
type and retain their sentinel value. Column-naming heuristics (id / *Id / *_id) MUST
NOT be used as evidence for type conversion.

| table.column | TYPE | SEMANTIC | EXPECTED_VALUE | schema source |
|---|---|---|---|---|
| round_robin_state.id | TEXT | singleton state-row key | 'singleton' | `marketing.prisma:216-222` (`model RoundRobinState { id String @id @default("singleton") … @@map("round_robin_state") }`) |

## Why this matters

The blanket heuristic in the previous `20260822085000_r4_fix_text_id_columns_to_uuid`
migration scanned every public TEXT column whose name matched `id | *Id | *_id` and
attempted `ALTER COLUMN … TYPE UUID USING id::uuid`. That cast raises
`invalid input syntax for type uuid: "singleton"` on protected production-light data
because `round_robin_state` holds exactly one row whose `id` is the sentinel
`'singleton'` by design.

## Verification evidence on protected production-light DB

```
$ docker exec production-light-db-1 psql -U erp_user -d erp_database \
    -c "SELECT * FROM round_robin_state;"
    id     | currentIndex |        updatedAt
-----------+--------------+-------------------------
 singleton |            2 | 2026-08-21 12:41:36.041
(1 row)
```

Schema confirms:

```prisma
model RoundRobinState {
  id           String   @id @default("singleton")
  currentIndex Int      @default(0)
  updatedAt    DateTime @updatedAt

  @@map("round_robin_state")
}
```

`@db.Uuid` is intentionally absent. The default is a literal string sentinel.
