export function Theory() {
  return (
    <div className="panel p-4 text-sm space-y-4 leading-relaxed overflow-y-auto">
      <section>
        <h2 className="font-bold text-base mb-1">What is NL→SQL?</h2>
        <p>
          Natural Language to SQL (NL2SQL / Text-to-SQL) maps a free-form user
          question to a Structured Query Language statement that a relational
          DBMS can execute. It sits at the intersection of NLP (semantic
          parsing) and databases (query processing).
        </p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Key definitions</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            <strong>Semantic parsing:</strong> converting natural language into
            a formal meaning representation (here, SQL).
          </li>
          <li>
            <strong>Schema linking:</strong> aligning phrases in the question to
            tables/columns (&quot;city&quot; → customers.city).
          </li>
          <li>
            <strong>Relational algebra:</strong> the theoretical foundation of
            SQL — operators π (project), σ (filter), ⋈ (join), γ (grouping).
          </li>
          <li>
            <strong>Logical plan:</strong> the ordered pipeline of operators the
            optimizer rearranges before execution.
          </li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Real-world use cases</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            Business intelligence chatbots letting non-analysts query
            warehouses.
          </li>
          <li>
            Voice assistants over structured data (banking, retail dashboards).
          </li>
          <li>Internal admin consoles and data exploration tools.</li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Limitations</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            Ambiguity: &quot;top products&quot; could mean by revenue, units, or
            rating.
          </li>
          <li>
            Schema mismatch: users say &quot;buyers&quot;, schema says
            &quot;customers&quot;.
          </li>
          <li>
            Complex SQL (subqueries, window functions, multi-hop joins) is hard
            to generate reliably.
          </li>
          <li>
            Security: generated SQL must be validated to prevent injection or
            data exfiltration.
          </li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">
          Algorithms used here &amp; complexity
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            NL translation: rule-based pattern matching — O(L) in question
            length; deterministic and explainable.
          </li>
          <li>
            Joins: nested-loop join O(n·m) (educational); production engines
            prefer hash join O(n+m).
          </li>
          <li>Filtering/projection: linear scans O(n).</li>
          <li>Grouping: hash aggregation, expected O(n).</li>
          <li>Sorting: comparison sort O(n log n).</li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Learning outcomes</h2>
        <ol className="list-decimal list-inside space-y-1 opacity-80">
          <li>
            Understand how a question becomes SQL via schema linking and intent
            detection.
          </li>
          <li>
            Implement/read a mini query engine whose stages mirror a real DBMS
            logical plan.
          </li>
          <li>
            Interpret the animated pipeline: watch row counts shrink through σ,
            γ, π, τ operators.
          </li>
        </ol>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">References</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80 text-xs">
          <li>
            Silberschatz, Korth &amp; Sudarshan —{" "}
            <em>Database System Concepts</em>, 7th ed.
          </li>
          <li>
            Ramakrishnan &amp; Gehrke — <em>Database Management Systems</em>.
          </li>
          <li>
            Yu et al., &quot;Spider: A Large-Scale Human-Labeled Dataset for
            Complex Text-to-SQL Tasks&quot;, EMNLP 2018.
          </li>
          <li>ISO/IEC 9075 SQL standard documentation.</li>
        </ul>
      </section>
    </div>
  );
}
