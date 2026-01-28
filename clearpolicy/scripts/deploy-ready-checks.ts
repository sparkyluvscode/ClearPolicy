type CheckResult = { ok: true } | { ok: false; error: string };

const REQUIRED_ENV = [
  "CONGRESS_API_KEY",
  "OPENSTATES_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_CIVIC_API_KEY",
  "DATABASE_URL",
];

const timeoutFetch = async (url: string, timeoutMs = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const resolveBaseUrl = () => {
  const raw =
    process.env.CHECK_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  if (raw.startsWith("http")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
};

const checkEnv = (): CheckResult => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    return { ok: false, error: `Missing env vars: ${missing.join(", ")}` };
  }
  return { ok: true };
};

const checkJson = async (
  url: string,
  validate: (data: any) => boolean,
  timeoutMs = 10000
): Promise<CheckResult> => {
  try {
    const res = await timeoutFetch(url, timeoutMs);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} for ${url}` };
    }
    const data = await res.json();
    if (!validate(data)) {
      return { ok: false, error: `Unexpected response for ${url}` };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: `Failed request to ${url}: ${error?.message || "unknown error"}` };
  }
};

const run = async () => {
  const baseUrl = resolveBaseUrl();
  const failures: string[] = [];

  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);
  if (isLocal) {
    const envResult = checkEnv();
    if (!envResult.ok) failures.push(envResult.error);
  }

  const searchUrl = `${baseUrl}/api/search?q=${encodeURIComponent("prop 50")}`;
  const searchResult = await checkJson(searchUrl, (data) => {
    const caResults = Array.isArray(data?.ca?.results) ? data.ca.results : [];
    return caResults.length > 0;
  }, 20000);
  if (!searchResult.ok) failures.push(searchResult.error);

  const propUrl = `${baseUrl}/api/prop/50`;
  const propResult = await checkJson(propUrl, (data) => {
    return Boolean(data?.levels && data?.levels["8"]?.tldr);
  }, 20000);
  if (!propResult.ok) failures.push(propResult.error);

  const federalUrl = `${baseUrl}/api/measure?source=congress&id=118:hr:4369`;
  const federalResult = await checkJson(federalUrl, (data) => {
    return Boolean(data?.raw || data?.aiSummary?.levels);
  });
  if (!federalResult.ok) failures.push(federalResult.error);

  if (failures.length) {
    console.error("Deploy-ready checks failed:");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("Deploy-ready checks passed.");
};

run().catch((error) => {
  console.error("Deploy-ready checks failed:", error);
  process.exit(1);
});
