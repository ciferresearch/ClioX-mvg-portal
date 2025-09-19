Research – Public Relations JSON Instructions

Location: content/resources/research/public-relations.json

Shape: JSON array of objects matching ResearchPaper with fields: id (string), title (string), authors (string array), year (number), link (string), group (string: public-relations), topic (string: public-relations), abstract (optional string), doi (optional string, unused).

Example item:
{ "id": "linkedin:urn:li:activity:123", "title": "Clio-X joins XYZ initiative", "authors": ["Clio-X"], "year": 2025, "link": "https://www.linkedin.com/posts/clio-x-org_123/", "group": "public-relations", "topic": "public-relations", "abstract": "Announcement of our partnership with XYZ." }

Script guidelines: set group and topic to public-relations; de-duplicate by link; keep newest first; English-only title/abstract; keep 20-50 items.

Validation: id non-empty; title non-empty; authors non-empty; year is 4-digit; link https; group/topic equal to public-relations.

Workflow: run Python to fetch posts; map to this schema; overwrite the JSON file; commit and verify in Resources → Research → Public Relations.
