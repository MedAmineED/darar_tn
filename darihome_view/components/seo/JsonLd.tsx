/**
 * Renders a JSON-LD structured-data block. The payload is our own data,
 * JSON-serialized, with `<` escaped so it can never break out of the script.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
