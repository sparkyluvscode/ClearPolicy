export default function CitedLine({ quote, sourceName, url, location }: { quote: string; sourceName: string; url: string; location?: string }) {
  return (
    <blockquote className="border-l-4 border-accent/60 pl-3 text-sm text-gray-200 dark:text-gray-800">
      <p className="italic">“{quote}”</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-1 inline-block text-xs text-accent hover:underline focus-ring rounded"
      >
        {sourceName}
        {location ? ` — ${location}` : ""}
      </a>
    </blockquote>
  );
}


