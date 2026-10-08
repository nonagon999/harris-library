# MARC / Koha Migration Guide — Harris Memorial College Library

## Overview

The Harris Library OPAC stores bibliographic data in standard **MARC21** format alongside the simplified book catalog. Records can be imported from Koha and exported for migration to other library systems.

## Importing Koha Records

1. Export MARC records from Koha (Administration → Tools → Export bibliographic records).
2. Choose **ISO 2709 (.mrc)** or **MARCXML**.
3. Open the Harris Library **Librarian Portal**.
4. Go to **MARC / Koha Migration**.
5. Upload the MARC file (max 10 MB).
6. Review the preview: valid records, duplicates, and errors.
7. Click **Import Valid Records**.
8. Check **Import History** for the report.
9. Verify imported books in **Books** and the public **OPAC**.

## Supported Import Formats

| Format | Extension | Standard |
|--------|-----------|----------|
| ISO 2709 | `.mrc`, `.marc` | MARC21 binary |
| MARCXML | `.xml` | MARC21 XML |

## Supported Export Formats

| Format | API parameter |
|--------|---------------|
| MARC21 (ISO 2709) | `?format=marc21` |
| MARCXML | `?format=marcxml` |

Export single book: `/api/marc/export?bookId={id}&format=marc21`  
Export entire catalog: `/api/marc/export?format=marc21`

## Harris Field → MARC21 Mapping

| Harris Field | MARC Tag | Subfield |
|--------------|----------|----------|
| Control Number | 001 | (control) |
| ISBN | 020 | $a |
| Author | 100 | $a |
| Title | 245 | $a |
| Subtitle | 245 | $b |
| Edition | 250 | $a |
| Place of Publication | 264 | $a |
| Publisher | 264 | $b |
| Copyright | 264 | $c |
| Pages | 300 | $a |
| Illustration | 300 | $b |
| Series Name | 490 | $a |
| Series Number | 490 | $v |
| Note | 500 | $a |
| Subject | 650 | $a |
| Editor | 700 | $a |
| DDC | 082 | $a |
| Call Number | 090 | $a |
| Accession Number | 952 | $a (Koha item/local) |

## Legacy Data Backfill

Existing books without MARC records can be backfilled via:

```bash
POST /api/marc/backfill
```

(Librarian login required — run from portal or API client.)

## Important Notes

- Original MARC data from Koha imports is **preserved in full** — unmapped tags remain in the MARC record.
- Duplicate detection uses ISBN, accession number, MARC 001, call number, and title+author.
- Existing records are **never automatically overwritten** during import.
