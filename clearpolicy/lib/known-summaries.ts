import type { GeneratedSummary, LevelContent, SummaryRequest } from "./ai";
import type { EvidenceCitation } from "./summary-types";

type KnownEntry = {
  key: string;
  match: RegExp;
  year?: string;
  citations: EvidenceCitation[];
  levels: {
    "5": LevelContent;
    "8": LevelContent;
    "12": LevelContent;
  };
};

const KNOWN: KnownEntry[] = [
  {
    key: "ca-prop-17-2020",
    match: /\b(prop|proposition)\s*17\b/i,
    year: "2020",
    citations: [
      {
        quote: "Proposition 17 restores the right to vote to people who have completed their prison term for a felony conviction.",
        sourceName: "Ballotpedia — Proposition 17 (2020)",
        url: "https://ballotpedia.org/California_Proposition_17_(2020)",
        location: "tldr",
      },
      {
        quote: "The measure amends the California Constitution to allow people on state parole to vote.",
        sourceName: "LAO — Proposition 17 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
        location: "what",
      },
      {
        quote: "Approximately 50,000 people on parole would become eligible to vote under this measure.",
        sourceName: "LAO — Proposition 17 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
        location: "who",
      },
      {
        quote: "Supporters argue voting helps people reintegrate into society and reduces recidivism.",
        sourceName: "Ballotpedia — Proposition 17 (2020)",
        url: "https://ballotpedia.org/California_Proposition_17_(2020)",
        location: "pros",
      },
      {
        quote: "Opponents argue people should complete their full sentence, including parole, before regaining voting rights.",
        sourceName: "Ballotpedia — Proposition 17 (2020)",
        url: "https://ballotpedia.org/California_Proposition_17_(2020)",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Prop 17 lets people vote again after they leave prison, even if they are still on parole.",
        whatItDoes: "It changes the California Constitution so people on parole can vote.\n\nBefore, you had to finish parole too. Now you can vote as soon as you leave prison.",
        whoAffected: "People on parole, election offices, and communities.",
        pros: [
          "Helps people feel part of society again.",
          "Voting can help people stay out of trouble.",
          "More people get a say in elections."
        ],
        cons: [
          "Some think you should finish all your sentence first.",
          "Parole is still part of punishment.",
          "Might cost money to update voter rolls."
        ]
      },
      "8": {
        tldr: "Proposition 17 (2020) restores voting rights to people on state parole after completing their prison term.",
        whatItDoes: "Amends the California Constitution to allow people on parole to register and vote.\n\nPreviously, people had to complete both prison and parole before voting. This measure removes the parole restriction.",
        whoAffected: "Approximately 50,000 people on state parole, county election officials, and parole officers.",
        pros: [
          "Supports civic reintegration for formerly incarcerated people.",
          "Research suggests voting may reduce recidivism.",
          "Aligns California with 19 other states that allow parolees to vote."
        ],
        cons: [
          "Opponents argue full sentence completion should be required.",
          "May create administrative burden for tracking voter eligibility.",
          "Some view parole as an ongoing consequence of the crime."
        ]
      },
      "12": {
        tldr: "Proposition 17 (2020) amends the California Constitution to restore voting rights to persons who have completed their prison term, removing the requirement to also complete parole.",
        whatItDoes: "Modifies Article II, Section 4 of the California Constitution to disenfranchise only those currently imprisoned for a felony, rather than those imprisoned or on parole.\n\nImplementation requires coordination between CDCR and county election officials to update voter eligibility records upon prison release.",
        whoAffected: "State parolees (approximately 50,000), California Department of Corrections and Rehabilitation, county registrars of voters, and parole supervision agencies.",
        pros: [
          "Promotes civic reintegration as part of the rehabilitation process.",
          "Evidence suggests civic participation correlates with reduced recidivism.",
          "Addresses racial disparities in disenfranchisement rates."
        ],
        cons: [
          "Parole represents ongoing custody and supervision under the original sentence.",
          "Administrative costs for voter roll maintenance and eligibility verification.",
          "Philosophical disagreement about when rights should be restored."
        ]
      }
    }
  },
  {
    key: "ca-prop-47-2014",
    match: /\b(prop|proposition)\s*47\b/i,
    year: "2014",
    citations: [
      {
        quote: "Proposition 47 reclassifies certain nonviolent theft and drug possession offenses from felonies to misdemeanors.",
        sourceName: "Ballotpedia — Proposition 47 (2014)",
        url: "https://ballotpedia.org/California_Proposition_47_(2014)",
        location: "tldr",
      },
      {
        quote: "The measure reduces penalties for shoplifting, grand theft, receiving stolen property, forgery, fraud, and writing bad checks when the amount is $950 or less.",
        sourceName: "LAO — Proposition 47 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=47&year=2014",
        location: "what",
      },
      {
        quote: "Savings from reduced incarceration are deposited into the Safe Neighborhoods and Schools Fund.",
        sourceName: "LAO — Proposition 47 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=47&year=2014",
        location: "who",
      },
      {
        quote: "Supporters argue it reduces over-incarceration and redirects funds to prevention and treatment programs.",
        sourceName: "Ballotpedia — Proposition 47 (2014)",
        url: "https://ballotpedia.org/California_Proposition_47_(2014)",
        location: "pros",
      },
      {
        quote: "Opponents argue it has led to increased retail theft and reduced consequences for repeat offenders.",
        sourceName: "Ballotpedia — Proposition 47 (2014)",
        url: "https://ballotpedia.org/California_Proposition_47_(2014)",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Prop 47 makes some crimes smaller so people don't go to prison for them.",
        whatItDoes: "It changes some felonies to misdemeanors for things like shoplifting under $950.\n\nMoney saved goes to schools, mental health, and drug treatment.",
        whoAffected: "People charged with small thefts, stores, courts, and schools.",
        pros: [
          "Fewer people go to prison for small crimes.",
          "Saves money for schools and treatment.",
          "Gives people a second chance."
        ],
        cons: [
          "Some say theft went up.",
          "Stores worry about shoplifting.",
          "Repeat offenders may not learn."
        ]
      },
      "8": {
        tldr: "Proposition 47 (2014) reclassifies certain theft and drug offenses from felonies to misdemeanors.",
        whatItDoes: "Reduces penalties for shoplifting, petty theft, receiving stolen property, forgery, and drug possession when amounts are $950 or less.\n\nCreates the Safe Neighborhoods and Schools Fund using savings from reduced incarceration.",
        whoAffected: "People charged with low-level theft and drug crimes, retailers, courts, and beneficiaries of the Safe Neighborhoods Fund.",
        pros: [
          "Reduces prison overcrowding and costs.",
          "Funds mental health, drug treatment, and school programs.",
          "Proportions punishment to the severity of the offense."
        ],
        cons: [
          "Critics link it to increased retail theft.",
          "Reduced consequences for repeat offenders.",
          "Difficulty prosecuting organized theft rings."
        ]
      },
      "12": {
        tldr: "Proposition 47 (2014), the Safe Neighborhoods and Schools Act, reclassifies specified nonviolent property and drug offenses from felonies to misdemeanors.",
        whatItDoes: "Amends Penal Code sections to make shoplifting, grand theft, receiving stolen property, forgery, fraud, and writing bad checks misdemeanors when the value is $950 or less. Also reduces simple drug possession to a misdemeanor.\n\nEstablishes the Safe Neighborhoods and Schools Fund, allocating savings to K-12 truancy and dropout prevention (25%), mental health and substance abuse treatment (10%), and victim services (65%).",
        whoAffected: "Defendants charged with qualifying offenses, district attorneys, public defenders, the Department of Corrections, retailers, and fund beneficiaries.",
        pros: [
          "Reduces incarceration costs and prison population.",
          "Invests savings in prevention, treatment, and victim services.",
          "Aligns penalties with offense severity and reduces collateral consequences."
        ],
        cons: [
          "Perceived increase in retail theft and organized shoplifting.",
          "Reduced prosecutorial leverage for repeat offenders.",
          "Threshold amount ($950) may incentivize theft just below the limit."
        ]
      }
    }
  },
  {
    key: "ca-prop-50-2025",
    match: /\b(prop|proposition)\s*50\b/i,
    year: "2025",
    citations: [
      {
        quote: "Allows California to temporarily use congressional district maps drawn by the Legislature instead of the Citizens Redistricting Commission, in response to Texas mid-decade redistricting.",
        sourceName: "Ballotpedia — Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "tldr",
      },
      {
        quote: "The new maps apply to congressional elections in 2026, 2028, and 2030; after the 2030 census, authority returns to the independent commission.",
        sourceName: "LAO — Proposition 50 (2025)",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "what",
      },
      {
        quote: "California voters, congressional candidates, and the Legislature; affects U.S. House representation through 2030.",
        sourceName: "Ballotpedia — Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "who",
      },
      {
        quote: "Supporters argue it preserves fair representation by responding to Texas redistricting and keeping California competitive in Congress.",
        sourceName: "Ballotpedia — Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "pros",
      },
      {
        quote: "Opponents argue it politicizes redistricting and undermines the independent Citizens Redistricting Commission.",
        sourceName: "Ballotpedia — Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Prop 50 (2025) lets California use new U.S. House maps drawn by state lawmakers for a few elections, instead of the usual commission. It was a response to Texas changing its maps.",
        whatItDoes: "For the 2026, 2028, and 2030 elections, California can use congressional maps drawn by the Legislature.\n\nAfter 2030, the independent Citizens Redistricting Commission takes over again.",
        whoAffected: "California voters, people who run for Congress, and the state Legislature.",
        pros: [
          "California can respond when other states change their maps.",
          "Maps can be updated for the next few elections.",
          "After 2030, the commission is back in charge."
        ],
        cons: [
          "Some say lawmakers should not draw their own maps.",
          "It breaks from the usual commission process.",
          "It can look political instead of neutral."
        ]
      },
      "8": {
        tldr: "Proposition 50 (2025) allows California to temporarily use legislatively drawn congressional district maps for 2026, 2028, and 2030, in response to Texas mid-decade redistricting; authority returns to the Citizens Redistricting Commission after the 2030 census.",
        whatItDoes: "Creates a temporary exception so the Legislature, not the independent commission, draws U.S. House districts for the next three election cycles.\n\nPurpose is to respond to Texas’s 2025 redistricting. After 2030, redistricting reverts to the commission.",
        whoAffected: "California voters, congressional candidates, the Legislature, and the Citizens Redistricting Commission.",
        pros: [
          "Lets California respond to other states’ mid-decade map changes.",
          "Maps apply only through 2030; then commission resumes control.",
          "Intended to keep California’s congressional representation in balance."
        ],
        cons: [
          "Politicizes redistricting by giving map-drawing to the Legislature.",
          "Undermines the independent commission model voters approved.",
          "Critics call it a partisan response to Texas redistricting."
        ]
      },
      "12": {
        tldr: "Proposition 50 (2025) amends the California Constitution to permit temporary use of legislatively drawn congressional redistricting maps for the 2026, 2028, and 2030 elections, in response to Texas’s mid-decade redistricting; after the 2030 census, authority reverts to the Citizens Redistricting Commission.",
        whatItDoes: "Establishes a time-limited exception to the commission-drawn congressional map process. The Legislature may adopt congressional district boundaries for the next three federal election cycles, with the stated purpose of responding to Texas’s 2025 redistricting. Post-2030 census, congressional redistricting returns to the independent commission.",
        whoAffected: "California voters, U.S. House candidates, the state Legislature, the Citizens Redistricting Commission, and national party strategies for House control.",
        pros: [
          "Provides a statutory response to other states’ mid-decade congressional redistricting.",
          "Sunset returns control to the commission after 2030.",
          "Framed as preserving California’s relative representation in Congress."
        ],
        cons: [
          "Concentrates map-drawing power in the Legislature, contrary to the commission model.",
          "Viewed by critics as a partisan counter to Texas redistricting.",
          "Raises concerns about tit-for-tat politicization of redistricting."
        ]
      }
    }
  },
  {
    key: "ca-prop-50-2016",
    match: /\b(prop|proposition)\s*50\b/i,
    year: "2016",
    citations: [
      {
        quote: "Authorizes the state to finance water infrastructure projects through revenue bonds totaling $3.1 billion.",
        sourceName: "LAO — Proposition 50 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "tldr",
      },
      {
        quote: "Funds may be used for water supply, storage, treatment, and related infrastructure in drought-prone regions.",
        sourceName: "LAO — Proposition 50 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "what",
      },
      {
        quote: "Local water agencies and districts are primary beneficiaries of project funding.",
        sourceName: "LAO — Proposition 50 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "who",
      },
      {
        quote: "Supporters argue the measure speeds critical infrastructure investment during drought conditions.",
        sourceName: "Ballotpedia — Proposition 50",
        url: "https://ballotpedia.org/California_Proposition_50",
        location: "pros",
      },
      {
        quote: "Opponents argue the measure increases long-term debt without separate voter approval for each bond.",
        sourceName: "Ballotpedia — Proposition 50",
        url: "https://ballotpedia.org/California_Proposition_50",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Prop 50 lets California borrow money for water projects. It is like a big loan for clean water.",
        whatItDoes: "The state can borrow money to fix pipes, build water storage, and improve drinking‑water systems.\n\nThe money goes to places with drought problems and local water districts.",
        whoAffected: "Water districts, farmers, cities, and families who pay taxes.",
        pros: [
          "Water fixes can start sooner.",
          "Drought places get help.",
          "Old pipes and tanks can be repaired."
        ],
        cons: [
          "The state must pay the money back.",
          "Some people want a vote each time.",
          "Paying it back can take a long time."
        ]
      },
      "8": {
        tldr: "Prop 50 authorizes about $3.1B in borrowing to fund California water infrastructure without a separate bond election.",
        whatItDoes: "Sets up financing for water systems, reservoirs, treatment, and delivery projects.\n\nFunding prioritizes drought‑prone regions and local districts, with repayment spread over many years.",
        whoAffected: "Water agencies, agriculture, cities, and statewide taxpayers.",
        pros: [
          "Moves funding faster for urgent projects.",
          "Focuses on drought‑prone regions and aging systems.",
          "Improves water reliability for farms and cities."
        ],
        cons: [
          "No separate statewide bond vote.",
          "Creates long‑term repayment costs.",
          "Disagreements over which projects get funded."
        ]
      },
      "12": {
        tldr: "Proposition 50 authorizes state issuance of roughly $3.1B in revenue bonds for water infrastructure, using emergency financing mechanisms rather than a separate voter‑approved bond.",
        whatItDoes: "Permits the state to finance capital projects for water storage, conveyance, treatment, and delivery through revenue bonds repaid over decades.\n\nAllocations prioritize drought‑impacted regions and district‑level upgrades, with eligibility rules and oversight for project selection and repayment schedules.",
        whoAffected: "State and local water districts, agricultural users, municipal systems, and taxpayers financing repayment.",
        pros: [
          "Accelerates capital investment during drought conditions.",
          "Improves long‑term water reliability and system resilience.",
          "Avoids delays associated with a separate bond election."
        ],
        cons: [
          "Reduces direct voter control over specific bond issuance.",
          "Creates multi‑decade debt obligations on repayment streams.",
          "Raises equity questions over regional allocation of funds."
        ]
      }
    }
  },
  {
    key: "ca-ab-5-2019",
    match: /\bab\s*5\b|assembly\s+bill\s+5\b/i,
    year: "2019",
    citations: [
      {
        quote: "Establishes the ABC test to determine whether workers are employees or independent contractors.",
        sourceName: "LegInfo — AB 5 (2019)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5",
        location: "tldr",
      },
      {
        quote: "A worker is an employee unless the hiring entity proves all three parts of the ABC test.",
        sourceName: "LegInfo — AB 5 (2019)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5",
        location: "what",
      },
      {
        quote: "The bill applies broadly across industries with specified exemptions for certain occupations.",
        sourceName: "LegInfo — AB 5 (2019)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5",
        location: "who",
      },
      {
        quote: "Supporters argue it protects workers from misclassification and ensures labor standards.",
        sourceName: "Ballotpedia — AB 5 (2019)",
        url: "https://ballotpedia.org/California_Assembly_Bill_5_(2019)",
        location: "pros",
      },
      {
        quote: "Opponents argue it reduces flexibility for contractors and increases costs for businesses.",
        sourceName: "Ballotpedia — AB 5 (2019)",
        url: "https://ballotpedia.org/California_Assembly_Bill_5_(2019)",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "AB 5 says many gig workers are employees, not contractors.",
        whatItDoes: "It uses a simple ABC test to decide who is an employee.\n\nEmployees can get things like minimum wage and sick time.",
        whoAffected: "App drivers, freelancers, companies, and workers in California.",
        pros: [
          "Workers get more protections.",
          "Companies must follow the rules.",
          "Pay and hours can be safer."
        ],
        cons: [
          "Some workers want to stay independent.",
          "Some gigs may change or shrink.",
          "The rules can be confusing."
        ]
      },
      "8": {
        tldr: "AB 5 (2019) applies the ABC test so many gig workers are classified as employees instead of contractors.",
        whatItDoes: "Extends employee classification rules across most industries using the ABC test.\n\nEmployers must provide wage protections and benefits if workers meet the test, while certain professions are exempt.",
        whoAffected: "Gig‑economy workers, employers, and industries that rely on contractors.",
        pros: [
          "Expands wage and benefit protections.",
          "Reduces worker misclassification.",
          "Gives agencies clearer rules to enforce."
        ],
        cons: [
          "Reduces flexibility for some independent workers.",
          "Increases compliance costs for businesses.",
          "Exemptions make the rules uneven."
        ]
      },
      "12": {
        tldr: "AB 5 (2019) codifies the California Supreme Court’s ABC test, narrowing independent‑contractor classifications across most industries.",
        whatItDoes: "Creates a presumption of employee status unless a hiring entity proves all three ABC factors.\n\nImposes labor‑law obligations (wages, benefits, payroll taxes) on employers when the ABC test is met, while listing specific exemptions for defined occupations.",
        whoAffected: "Gig platforms, contractors, employers, labor regulators, and affected industry sectors.",
        pros: [
          "Strengthens labor standards and worker protections.",
          "Aligns classification with payroll tax and benefit systems.",
          "Creates a uniform legal test for enforcement."
        ],
        cons: [
          "Constrains independent‑contractor models in many sectors.",
          "Increases employer compliance and labor costs.",
          "Exemption structure may distort market competition."
        ]
      }
    }
  },
  {
    key: "ca-sb-1383-2016",
    match: /\bsb\s*1383\b|short\-lived\s+climate\s+pollutants|organic\s+waste/i,
    year: "2016",
    citations: [
      {
        quote: "Requires statewide reductions in short‑lived climate pollutants by diverting organic waste from landfills.",
        sourceName: "LegInfo — SB 1383 (2016)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383",
        location: "tldr",
      },
      {
        quote: "Establishes targets for organic waste diversion and edible food recovery.",
        sourceName: "LegInfo — SB 1383 (2016)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383",
        location: "what",
      },
      {
        quote: "Local jurisdictions and covered businesses must implement organics recycling programs.",
        sourceName: "LegInfo — SB 1383 (2016)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383",
        location: "who",
      },
      {
        quote: "Supporters cite methane reduction and expanded composting as key benefits.",
        sourceName: "CalRecycle — SB 1383",
        url: "https://calrecycle.ca.gov/organics/slcp/",
        location: "pros",
      },
      {
        quote: "Opponents raise concerns about implementation costs and compliance burdens.",
        sourceName: "CalRecycle — SB 1383",
        url: "https://calrecycle.ca.gov/organics/slcp/",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "SB 1383 says food scraps and yard waste should not go in the trash.",
        whatItDoes: "It sets rules to cut methane gas by recycling organic waste.\n\nCities and businesses must separate food waste for composting.",
        whoAffected: "Cities, trash companies, stores, and households.",
        pros: [
          "Cuts methane pollution.",
          "Turns food waste into compost.",
          "Helps protect the climate."
        ],
        cons: [
          "Adds new sorting rules.",
          "Costs money to update systems.",
          "Small businesses may struggle."
        ]
      },
      "8": {
        tldr: "SB 1383 (2016) requires California to reduce organic waste in landfills to cut methane emissions.",
        whatItDoes: "Creates statewide targets for reducing food scraps, yard waste, and other organics sent to landfills.\n\nRequires jurisdictions and businesses to provide organics recycling and increase edible‑food recovery.",
        whoAffected: "Local governments, waste haulers, retailers, restaurants, and households.",
        pros: [
          "Reduces methane and climate pollution.",
          "Expands composting and recycling systems.",
          "Grows edible‑food recovery programs."
        ],
        cons: [
          "Raises collection and compliance costs.",
          "Requires new infrastructure and enforcement.",
          "Implementation can be uneven across regions."
        ]
      },
      "12": {
        tldr: "SB 1383 (2016) mandates statewide reductions in landfill organics to curb methane, including organics recycling and edible‑food recovery requirements.",
        whatItDoes: "Sets statutory targets for reducing short‑lived climate pollutants by diverting organic waste from landfills.\n\nImposes program and enforcement duties on jurisdictions and regulated entities to collect organics and recover edible food.",
        whoAffected: "Municipalities, waste and recycling operators, food‑generating businesses, and consumers.",
        pros: [
          "Directly targets methane reduction in statute.",
          "Expands composting and food‑recovery infrastructure.",
          "Aligns local programs with statewide climate policy."
        ],
        cons: [
          "Creates ongoing compliance and reporting burdens.",
          "Requires new infrastructure investments.",
          "Costs may be passed to ratepayers or consumers."
        ]
      }
    }
  },
  {
    key: "fair-sentencing-act-2010",
    match: /fair\s+sentencing\s+act/i,
    year: "2010",
    citations: [
      {
        quote: "Increases the quantity thresholds for crack cocaine offenses that trigger mandatory minimums.",
        sourceName: "Congress.gov — S.1789",
        url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789",
        location: "tldr",
      },
      {
        quote: "Eliminates the mandatory minimum sentence for simple possession of crack cocaine.",
        sourceName: "Congress.gov — S.1789",
        url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789",
        location: "what",
      },
      {
        quote: "Applies to federal criminal cases involving crack and powder cocaine.",
        sourceName: "Congress.gov — S.1789",
        url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789",
        location: "who",
      },
      {
        quote: "Supporters argued the law reduces a sentencing disparity between crack and powder cocaine.",
        sourceName: "GovTrack — S.1789",
        url: "https://www.govtrack.us/congress/bills/111/s1789",
        location: "pros",
      },
      {
        quote: "Opponents argued mandatory minimums should remain strict to deter drug offenses.",
        sourceName: "GovTrack — S.1789",
        url: "https://www.govtrack.us/congress/bills/111/s1789",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "The Fair Sentencing Act makes punishments for crack and powder drugs more equal.",
        whatItDoes: "It raises the amount of crack needed for big prison sentences.\n\nIt removes a rule that gave prison time for small amounts.",
        whoAffected: "People charged with drug crimes, courts, and prisons.",
        pros: [
          "Makes sentences fairer.",
          "Reduces very long prison terms.",
          "Helps fix old unfair rules."
        ],
        cons: [
          "Some worry about public safety.",
          "Does not erase all drug‑law differences.",
          "Re‑sentencing can be hard."
        ]
      },
      "8": {
        tldr: "The Fair Sentencing Act of 2010 reduces the sentencing gap between crack and powder cocaine offenses.",
        whatItDoes: "Raises the amount of crack cocaine needed to trigger mandatory minimum sentences and eliminates a mandatory minimum for simple possession.\n\nAims to reduce penalties that were far harsher for crack than powder.",
        whoAffected: "People charged with federal drug crimes, courts, and correctional systems.",
        pros: [
          "Shrinks a long‑criticized sentencing gap.",
          "Reduces mandatory minimum exposure for low‑level offenses.",
          "Improves perceived fairness in federal sentencing."
        ],
        cons: [
          "Does not fully eliminate all disparities.",
          "Implementation varies across cases and time.",
          "Some argue penalties should stay stricter."
        ]
      },
      "12": {
        tldr: "The Fair Sentencing Act of 2010 increases crack‑cocaine thresholds for federal mandatory minimums and removes the mandatory minimum for simple possession.",
        whatItDoes: "Adjusts federal drug‑sentencing thresholds to narrow the crack‑to‑powder ratio and revises statutory penalties.\n\nReduces sentencing exposure for lower‑level crack offenses while retaining federal mandatory minimum structures.",
        whoAffected: "Federal defendants, prosecutors, judges, and the Bureau of Prisons.",
        pros: [
          "Narrows a widely criticized racial disparity in federal sentencing.",
          "Reduces mandatory minimum penalties for low‑level offenses.",
          "Aligns federal penalties more closely with proportionality goals."
        ],
        cons: [
          "Does not fully eliminate sentencing disparities.",
          "May be criticized as too lenient by opponents.",
          "Retroactive relief requires additional legal steps."
        ]
      }
    }
  }
];

export function matchKnownSummary(req: SummaryRequest): GeneratedSummary | null {
  const haystack = `${req.title} ${req.identifier || ""} ${req.content || ""}`.toLowerCase();
  for (const entry of KNOWN) {
    // If a specific year was requested, don't return a known entry for a different year.
    // This prevents incorrectly labeling an older proposition summary as the requested year.
    if (req.year && entry.year && String(req.year) !== String(entry.year)) continue;
    if (entry.match.test(haystack)) {
      return { levels: entry.levels, year: entry.year, citations: entry.citations };
    }
  }
  return null;
}
