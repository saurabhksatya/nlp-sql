export function Theory() {
  return (
    <div
      className="panel p-4 text-xs space-y-4 leading-relaxed overflow-y-auto max-h-[calc(100vh-8rem)]"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    >
      <section>
        <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>
          1. SQL Sublanguages: DQL, DML &amp; DDL
        </h2>
        <p className="mb-2 opacity-90" style={{ color: "var(--foreground)" }}>
          Structured Query Language (SQL) is the international standard (ISO/IEC 9075) for relational database systems. It is divided into distinct functional sublanguages:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div
            className="p-3 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>
              DQL (Data Query Language)
            </h3>
            <p className="text-[11px] opacity-80 mb-2" style={{ color: "var(--foreground)" }}>
              Retrieves and summarizes relation data without modifying storage state.
            </p>
            <p
              className="font-mono text-[10px] p-1 rounded border"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY
            </p>
          </div>

          <div
            className="p-3 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>
              DML (Data Manipulation)
            </h3>
            <p className="text-[11px] opacity-80 mb-2" style={{ color: "var(--foreground)" }}>
              Modifies table tuples (inserts, updates, deletes) within transaction boundaries.
            </p>
            <p
              className="font-mono text-[10px] p-1 rounded border"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              INSERT INTO, UPDATE, DELETE FROM
            </p>
          </div>

          <div
            className="p-3 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>
              DDL (Data Definition)
            </h3>
            <p className="text-[11px] opacity-80 mb-2" style={{ color: "var(--foreground)" }}>
              Defines, alters, or destroys database relations, schemas, and catalogs.
            </p>
            <p
              className="font-mono text-[10px] p-1 rounded border"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>
          2. Relational Algebra Foundations
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-85 text-[11px]" style={{ color: "var(--foreground)" }}>
          <li>
            <strong>Projection (SELECT):</strong> Selects a subset of attributes (columns) from relation R.
          </li>
          <li>
            <strong>Selection (WHERE):</strong> Filters tuples (rows) satisfying a predicate condition.
          </li>
          <li>
            <strong>Join (JOIN):</strong> Combines tuples from relations R and S satisfying a matching condition (Cartesian product followed by selection).
          </li>
          <li>
            <strong>Aggregation &amp; Grouping (GROUP BY):</strong> Partitions relation R by grouping attributes and applies summary aggregate functions (COUNT, SUM, AVG, MIN, MAX).
          </li>
          <li>
            <strong>Deduplication (DISTINCT):</strong> Removes duplicate tuples (DISTINCT semantics).
          </li>
          <li>
            <strong>Sorting (ORDER BY):</strong> Orders output tuples by sorting key specification.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>
          3. Relational Integrity Constraints
        </h2>
        <div className="space-y-1.5 opacity-85 text-[11px]" style={{ color: "var(--foreground)" }}>
          <p>
            • <strong>Domain Integrity:</strong> Every attribute value must belong to the declared data type (e.g. INTEGER, TEXT, REAL).
          </p>
          <p>
            • <strong>Entity Integrity (Primary Key):</strong> No primary key column value may be NULL or duplicated within the relation. Uniquely identifies each tuple.
          </p>
          <p>
            • <strong>Referential Integrity (Foreign Key):</strong> A foreign key value in a referencing relation must either match a valid primary key in the referenced relation or be NULL.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>
          4. ACID Transaction Properties
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <div
            className="p-2.5 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <strong>Atomicity (A)</strong>
            <p className="opacity-70 text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
              All-or-nothing execution; failed mutations are rolled back completely.
            </p>
          </div>
          <div
            className="p-2.5 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <strong>Consistency (C)</strong>
            <p className="opacity-70 text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
              Database transitions only between valid states conforming to all schema constraints.
            </p>
          </div>
          <div
            className="p-2.5 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <strong>Isolation (I)</strong>
            <p className="opacity-70 text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
              Concurrent transactions execute without interfering with one another.
            </p>
          </div>
          <div
            className="p-2.5 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <strong>Durability (D)</strong>
            <p className="opacity-70 text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
              Once committed, transaction updates persist permanently in storage.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>
          5. Execution Engine Algorithms &amp; Complexity
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-85 text-[11px]" style={{ color: "var(--foreground)" }}>
          <li>
            <strong>Full Table Scan (FROM):</strong> $O(N)$ sequential scan through in-memory page buffers.
          </li>
          <li>
            <strong>Nested-Loop Join (JOIN):</strong> $O(N \times M)$ nested iteration over outer and inner relations.
          </li>
          <li>
            <strong>Filter (WHERE) &amp; Projection (SELECT):</strong> $O(N)$ single-pass linear evaluation.
          </li>
          <li>
            <strong>Hash Aggregation (GROUP BY):</strong> Expected $O(N)$ hashing into group buckets.
          </li>
          <li>
            <strong>External Merge Sort (ORDER BY):</strong> $O(N \log N)$ comparison sorting.
          </li>
          <li>
            <strong>DML Insertion / Deletion / Mutation:</strong> $O(N)$ scan &amp; validation with $O(1)$ buffer append/deletion.
          </li>
          <li>
            <strong>DDL Catalog Registration:</strong> $O(K)$ where $K$ is the number of attribute definitions.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>
          6. References &amp; Standards
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-70 text-[10px]" style={{ color: "var(--muted)" }}>
          <li>
            Silberschatz, Korth &amp; Sudarshan — <em>Database System Concepts</em>, 7th ed., McGraw-Hill.
          </li>
          <li>
            Ramakrishnan &amp; Gehrke — <em>Database Management Systems</em>, 3rd ed., McGraw-Hill.
          </li>
          <li>
            Garcia-Molina, Ullman &amp; Widom — <em>Database Systems: The Complete Book</em>, 2nd ed.
          </li>
          <li>ISO/IEC 9075:2016 SQL Database Language Standard Specification.</li>
        </ul>
      </section>
    </div>
  );
}
