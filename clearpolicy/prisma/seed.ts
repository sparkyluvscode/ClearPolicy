import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  async function upsertMeasure(m: any) {
    // First try to find existing measure
    let measure = await prisma.measure.findUnique({
      where: { slug: m.slug },
    });
    
    // If not found, create it
    if (!measure) {
      measure = await prisma.measure.create({
        data: {
          kind: m.kind,
          jurisdiction: m.jurisdiction,
          session: m.session ?? null,
          number: m.number,
          title: m.title,
          status: m.status,
          slug: m.slug,
        },
      });
    }

    for (const s of m.sources) {
      await prisma.sourceDoc.upsert({
        where: { id: s.id },
        update: {},
        create: { id: s.id, measureId: measure.id, name: s.name, url: s.url, docType: s.docType },
      });
    }

    for (const sum of m.summaries) {
      await prisma.summary.create({
        data: {
          measureId: measure.id,
          level: sum.level,
          tldr: sum.tldr,
          whatItDoes: sum.whatItDoes,
          whoAffected: sum.whoAffected,
          pros: sum.pros,
          cons: sum.cons,
          sourceRatio: sum.sourceRatio,
          citations: JSON.stringify(sum.citations),
        },
      });
    }
  }

  await upsertMeasure({
    kind: "prop",
    jurisdiction: "CA",
    session: "2020",
    number: "Prop 17",
    title: "Restores voting rights after completion of prison term (people on state parole)",
    status: "Passed (Nov 3, 2020)",
    slug: "ca-prop-17-2020",
    sources: [
      {
        id: "src-prop17-lao",
        name: "LAO Proposition 17 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
        docType: "analysis",
      },
      {
        id: "src-prop17-vig",
        name: "Official Voter Information Guide — Prop 17 (Title & Analysis)",
        url: "https://vig.cdn.sos.ca.gov/2020/general/pdf/prop17-title-summ-analysis.pdf",
        docType: "summary",
      },
    ],
    summaries: [
      {
        level: "12",
        tldr: "Amends the California Constitution to re-enfranchise individuals on state parole immediately upon release from prison.",
        whatItDoes: "Restores voting rights to Californians on state parole by updating voter eligibility language in the state constitution.",
        whoAffected: "People on state parole; county election officials; re-entry/community groups.",
        pros: "Supports civic reintegration; aligns California with many states that restore rights after prison.",
        cons: "Opponents argue voting should follow full sentence completion, including parole; minor administrative costs.",
        sourceRatio: 1.0,
        citations: [
          {
            quote: "People on state parole … would be able to vote.",
            sourceName: "LAO",
            url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
            location: "Yes/No statement",
          },
          {
            quote: "Restores right to vote after completion of prison term.",
            sourceName: "Official Voter Guide",
            url: "https://vig.cdn.sos.ca.gov/2020/general/pdf/prop17-title-summ-analysis.pdf",
            location: "Title & summary",
          },
        ],
      },
      {
        level: "8",
        tldr: "Restores voting rights to people on state parole.",
        whatItDoes: "Changes the constitution so parolees may register and vote.",
        whoAffected: "Parolees; election offices; re-entry orgs.",
        pros: "Helps re-entry and participation in community.",
        cons: "Some prefer voting after parole ends.",
        sourceRatio: 0.8,
        citations: [
          {
            quote: "People on state parole … would be able to vote.",
            sourceName: "LAO",
            url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
          },
        ],
      },
      {
        level: "5",
        tldr: "Lets people on parole vote again.",
        whatItDoes: "Updates the rule so parolees can vote.",
        whoAffected: "People on parole; election workers.",
        pros: "Helps people rejoin the community.",
        cons: "Some say wait until parole ends.",
        sourceRatio: 0.6,
        citations: [
          {
            quote: "… on state parole … able to vote.",
            sourceName: "LAO",
            url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
          },
        ],
      },
    ],
  });

  await upsertMeasure({
    kind: "prop",
    jurisdiction: "CA",
    session: "2014",
    number: "Prop 47",
    title: "Criminal Sentences. Misdemeanor Penalties. Initiative Statute.",
    status: "Passed (Nov 4, 2014)",
    slug: "ca-prop-47-2014",
    sources: [
      {
        id: "src-prop47-lao",
        name: "LAO Proposition 47 Analysis",
        url: "https://www.lao.ca.gov/ballot/2014/prop-47-110414.aspx",
        docType: "analysis",
      },
      {
        id: "src-prop47-ppic-2024",
        name: "PPIC: Shoplifting & Commercial Burglary (2024)",
        url: "https://www.ppic.org/blog/commercial-burglaries-fell-in-2023-but-shoplifting-continued-to-rise/",
        docType: "report",
      },
      {
        id: "src-prop47-lao-2025-retail",
        name: "LAO: Retail Theft in California (2025)",
        url: "https://lao.ca.gov/Publications/Report/5055",
        docType: "report",
      },
    ],
    summaries: [
      {
        level: "12",
        tldr: "Reclassifies certain nonviolent drug and theft offenses as misdemeanors when the value is $950 or less; includes resentencing provisions.",
        whatItDoes: "Reduces penalties for specified offenses and sets a $950 threshold for some theft crimes; creates the Safe Neighborhoods and Schools Fund for state savings.",
        whoAffected: "People charged with covered offenses; courts and prosecutors; law enforcement and retailers.",
        pros: "Focuses resources on serious and violent crime; reduces incarceration costs; funds prevention and treatment programs.",
        cons: "Concerns about repeated sub-$950 theft; research shows mixed patterns across shoplifting vs. commercial burglary.",
        sourceRatio: 1.0,
        citations: [
          {
            quote: "Reduces penalties for certain nonserious, nonviolent property and drug crimes.",
            sourceName: "LAO",
            url: "https://www.lao.ca.gov/ballot/2014/prop-47-110414.aspx",
          },
          {
            quote: "… shoplifting is limited to theft … not exceeding $950 …",
            sourceName: "PPIC",
            url: "https://www.ppic.org/blog/commercial-burglaries-fell-in-2023-but-shoplifting-continued-to-rise/",
          },
          {
            quote: "Proposition 47 … limited punishment for most retail theft ≤ $950 to a misdemeanor.",
            sourceName: "LAO (2025)",
            url: "https://lao.ca.gov/Publications/Report/5055",
          },
        ],
      },
      {
        level: "8",
        tldr: "Makes some low-level drug and theft crimes misdemeanors and sets a $950 theft limit.",
        whatItDoes: "Shifts several crimes from felony to misdemeanor and allows some people to be resentenced.",
        whoAffected: "Defendants in covered crimes; courts; police; stores.",
        pros: "Saves prison space for serious crimes; funds local programs.",
        cons: "Worry about repeat theft under $950; mixed data on retail theft.",
        sourceRatio: 0.8,
        citations: [
          {
            quote: "… reduces penalties for certain … crimes.",
            sourceName: "LAO",
            url: "https://www.lao.ca.gov/ballot/2014/prop-47-110414.aspx",
          },
        ],
      },
      {
        level: "5",
        tldr: "Makes some non‑violent crimes smaller punishments and uses $950 as a limit.",
        whatItDoes: "Turns some crimes into misdemeanors and lets some people get shorter sentences.",
        whoAffected: "People charged, courts, and stores.",
        pros: "Focus on serious crimes; save money.",
        cons: "People may steal under $950 more than once.",
        sourceRatio: 0.6,
        citations: [
          {
            quote: "… nonserious and nonviolent … crimes.",
            sourceName: "LAO",
            url: "https://www.lao.ca.gov/ballot/2014/prop-47-110414.aspx",
          },
        ],
      },
    ],
  });
}

main()
  .then(() => {
    console.log("Seed complete");
    return prisma.measure.count();
  })
  .then((count) => {
    console.log(`Total measures in database: ${count}`);
  })
  .catch((e) => { 
    console.error("Seed error:", e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });


