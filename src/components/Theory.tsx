export function Theory() {
  return (
    <div className="panel p-4 text-xs space-y-4 leading-relaxed overflow-y-auto max-h-[calc(100vh-8rem)]">
      <section>
        <h2 className="font-bold text-sm mb-1 text-indigo-600 dark:text-indigo-400">
          1. SQL Sublanguages: DQL, DML &amp; DDL
        </h2>
        <p className="mb-2 opacity-90">
          Structured Query Language (SQL) is the international standard (ISO/IEC 9075) for relational database systems. It is divided into distinct functional sublanguages:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded panel bg-sky-500/10 border-sky-500/20">
            <h3 className="font-bold text-sky-600 dark:text-sky-400 mb-1">
              DQL (Data Query Language)
            </h3>
            <p className="text-[11px] opacity-80 mb-1">
              Retrieves and summarizes relation data without modifying storage state.
            </p>
            <p className="font-mono text-[10px] bg-black/5 dark:bg-white/5 p-1 rounded">
              SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY
            </p>
          </div>

          <div className="p-2.5 rounded panel bg-amber-500/10 border-amber-500/20">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-1">
              DML (Data Manipulation)
            </h3>
            <p className="text-[11px] opacity-80 mb-1">
              Modifies table tuples (inserts, updates, deletes) within transaction boundaries.
            </p>
            <p className="font-mono text-[10px] bg-black/5 dark:bg-white/5 p-1 rounded">
              INSERT INTO, UPDATE, DELETE FROM
            </p>
          </div>

          <div className="p-2.5 rounded panel bg-purple-500/10 border-purple-500/20">
            <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-1">
              DDL (Data Definition)
            </h3>
            <p className="text-[11px] opacity-80 mb-1">
              Defines, alters, or destroys database relations, schemas, and catalogs.
            </p>
            <p className="font-mono text-[10px] bg-black/5 dark:bg-white/5 p-1 rounded">
              CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1 text-indigo-600 dark:text-indigo-400">
          2. Relational Algebra Foundations
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-80 text-[11px]">
          <li>
            <strong>Projection π(R):</strong> Selects a subset of attributes (columns) from relation R.
          </li>
          <li>
            <strong>Selection σ_θ(R):</strong> Filters tuples (rows) satisfying propositional condition θ.
          </li>
          <li>
            <strong>Join R ⋈_θ S:</strong> Combines tuples from R and S satisfying predicate θ (Cartesian product followed by selection).
          </li>
          <li>
            <strong>Aggregation &amp; Grouping γ_L(R):</strong> Partitions relation R by grouping attributes and applies summary aggregate functions (COUNT, SUM, AVG, MIN, MAX).
          </li>
          <li>
            <strong>Deduplication δ(R):</strong> Removes duplicate tuples (DISTINCT semantics).
          </li>
          <li>
            <strong>Sorting τ_L(R):</strong> Orders output tuples by sorting key specification L.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1 text-indigo-600 dark:text-indigo-400">
          3. Relational Integrity Constraints
        </h2>
        <div className="space-y-1.5 opacity-80 text-[11px]">
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
        <h2 className="font-bold text-sm mb-1 text-indigo-600 dark:text-indigo-400">
          4. ACID Transaction Properties
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 rounded bg-black/5 dark:bg-white/5">
            <strong>Atomicity (A)</strong>
            <p className="opacity-70 text-[10px] mt-0.5">All-or-nothing execution; failed mutations are rolled back completely.</p>
          </div>
          <div className="p-2 rounded bg-black/5 dark:bg-white/5">
            <strong>Consistency (C)</strong>
            <p className="opacity-70 text-[10px] mt-0.5">Database transitions only between valid states conforming to all schema constraints.</p>
          </div>
          <div className="p-2 rounded bg-black/5 dark:bg-white/5">
            <strong>Isolation (I)</strong>
            <p className="opacity-70 text-[10px] mt-0.5">Concurrent transactions execute without interfering with one another.</p>
          </div>
          <div className="p-2 rounded bg-black/5 dark:bg-white/5">
            <strong>Durability (D)</strong>
            <p className="opacity-70 text-[10px] mt-0.5">Once committed, transaction updates persist permanently in storage.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-sm mb-1 text-indigo-600 dark:text-indigo-400">
          5. Execution Engine Algorithms &amp; Complexity
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-80 text-[11px]">
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
        <h2 className="font-bold text-sm mb-1 text-indigo-600 dark:text-indigo-400">
          6. References &amp; Standards
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-80 text-[10px]">
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
