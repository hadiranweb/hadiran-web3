# چرخهٔ دانش

```text
Capture → SemanticRecord → Claim → Review → Promotion → MemoryItem → Edge → Projection
```

| مرحله | جدول | اقدام |
| --- | --- | --- |
| Capture | `semantic_records` | ذخیره در `/workspace`؛ status=`captured` |
| Claim | `knowledge_claims` | ساخته می‌شود هنگام ارتقا |
| Review | `knowledge_reviews` | owner همان reviewer |
| Promotion | `knowledge_promotions` | اقدام صریح «ارتقا» |
| Memory | `memory_items` | lifecycle=`approved` |
| Edge | `graph_edges` | `supports` / `promoted_as` / `published_as` |
| Projection | `knowledge` | `/knowledge/[slug]`؛ FK به `memory_item_id` |

چت، sitemap، `/api/knowledge` و فهرست دانشنامه فقط `memory_items` با `approved` + `public`.
