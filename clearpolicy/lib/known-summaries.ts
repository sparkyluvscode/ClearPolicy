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
        sourceName: "Ballotpedia - Proposition 17 (2020)",
        url: "https://ballotpedia.org/California_Proposition_17_(2020)",
        location: "tldr",
      },
      {
        quote: "The measure amends the California Constitution to allow people on state parole to vote.",
        sourceName: "LAO - Proposition 17 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
        location: "what",
      },
      {
        quote: "Approximately 50,000 people on parole would become eligible to vote under this measure.",
        sourceName: "LAO - Proposition 17 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=17&year=2020",
        location: "who",
      },
      {
        quote: "Supporters argue voting helps people reintegrate into society and reduces recidivism.",
        sourceName: "Ballotpedia - Proposition 17 (2020)",
        url: "https://ballotpedia.org/California_Proposition_17_(2020)",
        location: "pros",
      },
      {
        quote: "Opponents argue people should complete their full sentence, including parole, before regaining voting rights.",
        sourceName: "Ballotpedia - Proposition 17 (2020)",
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
    key: "ca-prop-6-2024",
    match: /\b(prop|proposition)\s*6\b/i,
    year: "2024",
    citations: [
      {
        quote: "Proposition 6 sought to amend the California Constitution to ban involuntary servitude in state prisons and local jails.",
        sourceName: "Ballotpedia - Proposition 6 (2024)",
        url: "https://ballotpedia.org/California_Proposition_6,_End_Involuntary_Servitude_for_Incarcerated_Persons_Amendment_(2024)",
        location: "tldr",
      },
      {
        quote: "Would have eliminated forced labor assignments and replaced them with a voluntary work program where incarcerated people could earn sentence credits; prohibited the state from disciplining those who refuse work.",
        sourceName: "LAO - Proposition 6 (2024)",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "what",
      },
      {
        quote: "Incarcerated people in state prisons and local jails, CDCR, county sheriffs, and the Reparations Task Force that recommended the measure.",
        sourceName: "Ballotpedia - Proposition 6 (2024)",
        url: "https://ballotpedia.org/California_Proposition_6,_End_Involuntary_Servitude_for_Incarcerated_Persons_Amendment_(2024)",
        location: "who",
      },
      {
        quote: "Supporters argued forced prison labor is a form of modern slavery and that the measure would address a racist legacy; labor unions and advocacy groups supported it.",
        sourceName: "Ballotpedia - Proposition 6 (2024)",
        url: "https://ballotpedia.org/California_Proposition_6,_End_Involuntary_Servitude_for_Incarcerated_Persons_Amendment_(2024)",
        location: "pros",
      },
      {
        quote: "Opponents raised cost concerns (e.g. paying minimum wage could cost $1.5B annually); voters rejected the measure in November 2024.",
        sourceName: "Ballotpedia - Proposition 6 (2024)",
        url: "https://ballotpedia.org/California_Proposition_6,_End_Involuntary_Servitude_for_Incarcerated_Persons_Amendment_(2024)",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Prop 6 (2024) was about ending forced work in prison. It would have let people in jail or prison say no to work without being punished.",
        whatItDoes: "It would have changed the state constitution so the state could not force people in prison or jail to work.\n\nWork would be voluntary, and people could earn credits for early release. Voters said no, so the law did not change.",
        whoAffected: "People in state prisons and local jails, prison and jail staff, and the state.",
        pros: [
          "Supporters said no one should be forced to work for almost no pay.",
          "It would have removed language that allows forced labor as punishment.",
          "Some said it was a step toward fixing past wrongs."
        ],
        cons: [
          "Opponents said paying minimum wage could cost the state a lot of money.",
          "Voters rejected it in 2024, so forced labor in prison continues."
        ]
      },
      "8": {
        tldr: "Proposition 6 (2024) sought to end involuntary servitude in California prisons and jails by banning forced labor and allowing voluntary work with sentence credits; voters rejected it in November 2024.",
        whatItDoes: "Would have amended the state constitution to prohibit involuntary servitude as criminal punishment.\n\nWould have replaced forced work with a voluntary program where incarcerated people could earn sentence credits. The state could not discipline those who refused work. Voters rejected the measure, so current practices continue.",
        whoAffected: "Incarcerated people in state prisons and local jails (e.g. ~40,000 of ~90,000 state inmates work for under 74¢/hr), CDCR, county sheriffs, and the Reparations Task Force that recommended it.",
        pros: [
          "Supporters argued forced prison labor is a form of modern slavery and perpetuates racial inequity.",
          "Labor unions and advocacy groups supported the measure.",
          "Would have aligned with efforts to eliminate involuntary servitude from the constitution."
        ],
        cons: [
          "Opponents cited cost (e.g. paying minimum wage could cost $1.5B annually).",
          "Voters rejected Proposition 6; forced labor in California prisons continues."
        ]
      },
      "12": {
        tldr: "Proposition 6 (2024) would have amended the California Constitution to ban involuntary servitude in state prisons and local jails, replacing forced labor with a voluntary work program and prohibiting discipline for refusal to work; California voters rejected the measure in November 2024.",
        whatItDoes: "Would have removed constitutional language allowing involuntary servitude as criminal punishment. Would have required voluntary work programs with sentence credits and prohibited the state from disciplining incarcerated people who refuse work assignments. Recommended by the state Reparations Task Force. The measure did not pass; forced labor in California correctional facilities continues.",
        whoAffected: "Incarcerated people in state and local facilities, California Department of Corrections and Rehabilitation, county sheriffs, labor and reparations advocates, and voters.",
        pros: [
          "Framed as addressing a legacy of slavery and racial inequity; supporters argued forced labor is modern slavery.",
          "Backed by Democratic leaders, labor unions, and civil rights groups.",
          "Would have brought California in line with similar reforms in other states."
        ],
        cons: [
          "Cost estimates (e.g. $1.5B annually for minimum wage) were cited by opponents.",
          "Measure failed at the ballot; involuntary servitude remains permitted as punishment in California."
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
        sourceName: "Ballotpedia - Proposition 47 (2014)",
        url: "https://ballotpedia.org/California_Proposition_47_(2014)",
        location: "tldr",
      },
      {
        quote: "The measure reduces penalties for shoplifting, grand theft, receiving stolen property, forgery, fraud, and writing bad checks when the amount is $950 or less.",
        sourceName: "LAO - Proposition 47 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=47&year=2014",
        location: "what",
      },
      {
        quote: "Savings from reduced incarceration are deposited into the Safe Neighborhoods and Schools Fund.",
        sourceName: "LAO - Proposition 47 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Proposition?number=47&year=2014",
        location: "who",
      },
      {
        quote: "Supporters argue it reduces over-incarceration and redirects funds to prevention and treatment programs.",
        sourceName: "Ballotpedia - Proposition 47 (2014)",
        url: "https://ballotpedia.org/California_Proposition_47_(2014)",
        location: "pros",
      },
      {
        quote: "Opponents argue it has led to increased retail theft and reduced consequences for repeat offenders.",
        sourceName: "Ballotpedia - Proposition 47 (2014)",
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
        sourceName: "Ballotpedia - Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "tldr",
      },
      {
        quote: "The new maps apply to congressional elections in 2026, 2028, and 2030; after the 2030 census, authority returns to the independent commission.",
        sourceName: "LAO - Proposition 50 (2025)",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "what",
      },
      {
        quote: "California voters, congressional candidates, and the Legislature; affects U.S. House representation through 2030.",
        sourceName: "Ballotpedia - Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "who",
      },
      {
        quote: "Supporters argue it preserves fair representation by responding to Texas redistricting and keeping California competitive in Congress.",
        sourceName: "Ballotpedia - Proposition 50 (2025)",
        url: "https://ballotpedia.org/California_Proposition_50,_Use_of_Legislative_Congressional_Redistricting_Map_Amendment_(2025)",
        location: "pros",
      },
      {
        quote: "Opponents argue it politicizes redistricting and undermines the independent Citizens Redistricting Commission.",
        sourceName: "Ballotpedia - Proposition 50 (2025)",
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
        sourceName: "LAO - Proposition 50 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "tldr",
      },
      {
        quote: "Funds may be used for water supply, storage, treatment, and related infrastructure in drought-prone regions.",
        sourceName: "LAO - Proposition 50 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "what",
      },
      {
        quote: "Local water agencies and districts are primary beneficiaries of project funding.",
        sourceName: "LAO - Proposition 50 Analysis",
        url: "https://lao.ca.gov/BallotAnalysis/Propositions",
        location: "who",
      },
      {
        quote: "Supporters argue the measure speeds critical infrastructure investment during drought conditions.",
        sourceName: "Ballotpedia - Proposition 50",
        url: "https://ballotpedia.org/California_Proposition_50",
        location: "pros",
      },
      {
        quote: "Opponents argue the measure increases long-term debt without separate voter approval for each bond.",
        sourceName: "Ballotpedia - Proposition 50",
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
        sourceName: "LegInfo - AB 5 (2019)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5",
        location: "tldr",
      },
      {
        quote: "A worker is an employee unless the hiring entity proves all three parts of the ABC test.",
        sourceName: "LegInfo - AB 5 (2019)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5",
        location: "what",
      },
      {
        quote: "The bill applies broadly across industries with specified exemptions for certain occupations.",
        sourceName: "LegInfo - AB 5 (2019)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5",
        location: "who",
      },
      {
        quote: "Supporters argue it protects workers from misclassification and ensures labor standards.",
        sourceName: "Ballotpedia - AB 5 (2019)",
        url: "https://ballotpedia.org/California_Assembly_Bill_5_(2019)",
        location: "pros",
      },
      {
        quote: "Opponents argue it reduces flexibility for contractors and increases costs for businesses.",
        sourceName: "Ballotpedia - AB 5 (2019)",
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
        sourceName: "LegInfo - SB 1383 (2016)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383",
        location: "tldr",
      },
      {
        quote: "Establishes targets for organic waste diversion and edible food recovery.",
        sourceName: "LegInfo - SB 1383 (2016)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383",
        location: "what",
      },
      {
        quote: "Local jurisdictions and covered businesses must implement organics recycling programs.",
        sourceName: "LegInfo - SB 1383 (2016)",
        url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383",
        location: "who",
      },
      {
        quote: "Supporters cite methane reduction and expanded composting as key benefits.",
        sourceName: "CalRecycle - SB 1383",
        url: "https://calrecycle.ca.gov/organics/slcp/",
        location: "pros",
      },
      {
        quote: "Opponents raise concerns about implementation costs and compliance burdens.",
        sourceName: "CalRecycle - SB 1383",
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
        sourceName: "Congress.gov - S.1789",
        url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789",
        location: "tldr",
      },
      {
        quote: "Eliminates the mandatory minimum sentence for simple possession of crack cocaine.",
        sourceName: "Congress.gov - S.1789",
        url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789",
        location: "what",
      },
      {
        quote: "Applies to federal criminal cases involving crack and powder cocaine.",
        sourceName: "Congress.gov - S.1789",
        url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789",
        location: "who",
      },
      {
        quote: "Supporters argued the law reduces a sentencing disparity between crack and powder cocaine.",
        sourceName: "GovTrack - S.1789",
        url: "https://www.govtrack.us/congress/bills/111/s1789",
        location: "pros",
      },
      {
        quote: "Opponents argued mandatory minimums should remain strict to deter drug offenses.",
        sourceName: "GovTrack - S.1789",
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
  },
  {
    key: "va-data-centers",
    match: /data\s+center.*virginia|virginia.*data\s+center/i,
    citations: [
      {
        quote: "Virginia hosts over 300 data centers — more than any other U.S. state — concentrated primarily in Northern Virginia's 'Data Center Alley' in Loudoun and Prince William Counties.",
        sourceName: "Virginia Economic Development Partnership",
        url: "https://www.vedp.org/data-centers",
        location: "tldr",
      },
      {
        quote: "Data centers contributed approximately $14.3 billion to Virginia's GDP in 2023 and support an estimated 47,000 direct and indirect jobs.",
        sourceName: "Northern Virginia Technology Council (NVTC)",
        url: "https://www.nvtc.org/",
        location: "what",
      },
      {
        quote: "Loudoun County alone hosts roughly 70% of the world's internet traffic through its data center infrastructure.",
        sourceName: "Loudoun County Department of Economic Development",
        url: "https://biz.loudoun.gov/key-industries/data-centers/",
        location: "who",
      },
      {
        quote: "Virginia data centers consumed approximately 3,600 megawatts of power in 2024, raising concerns about grid capacity and clean energy commitments.",
        sourceName: "Dominion Energy - Integrated Resource Plan",
        url: "https://www.dominionenergy.com/",
        location: "pros",
      },
      {
        quote: "Community groups in Prince William County have organized against proposed data center developments citing noise pollution, reduced property values, and incompatibility with residential zoning.",
        sourceName: "Prince William County Planning Commission",
        url: "https://www.pwcva.gov/department/planning",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Virginia has more data centers than any other state. They bring lots of jobs and tax money, but they use a huge amount of electricity and some neighbors don't want them nearby.",
        whatItDoes: "Data centers are big buildings full of computer servers that store websites, apps, and cloud data. Virginia has over 300 of them, mostly in Northern Virginia near Washington, D.C.\n\nThey create jobs and bring in billions of dollars in taxes, but they also use a lot of electricity and can be noisy for people who live nearby.",
        whoAffected: "Virginia residents, especially in Loudoun and Prince William Counties. Also power companies like Dominion Energy, tech companies like Amazon and Microsoft, local governments collecting tax revenue, and homeowners near proposed data center sites.",
        pros: [
          "Data centers have contributed roughly $14.3 billion to Virginia's economy and support about 47,000 jobs.",
          "They generate hundreds of millions in local tax revenue, helping fund schools, roads, and services.",
          "Virginia's data center industry has made the state a global technology hub, attracting further investment."
        ],
        cons: [
          "Data centers use massive amounts of electricity — about 3,600 megawatts — straining the power grid.",
          "Neighbors complain about noise from industrial cooling systems that run 24/7.",
          "New data center construction can reduce property values for nearby homes and change the character of communities."
        ]
      },
      "8": {
        tldr: "Virginia is the world's largest data center market, hosting over 300 facilities that contributed $14.3 billion to the state's GDP in 2023. While they drive economic growth and tax revenue, they raise serious concerns about energy consumption, grid capacity, land use, and community impact, particularly in Loudoun and Prince William Counties.",
        whatItDoes: "Virginia's data centers — concentrated in Northern Virginia's 'Data Center Alley' — process an estimated 70% of global internet traffic. The industry has grown rapidly due to proximity to federal agencies, major internet exchange points, and favorable tax policies including a sales tax exemption on data center equipment.\n\nAccording to Dominion Energy's Integrated Resource Plan, data centers consumed approximately 3,600 megawatts of power in 2024, and demand is projected to grow 15-20% annually. This growth is driving new debates about zoning, energy infrastructure, environmental commitments, and the balance between economic development and community quality of life.",
        whoAffected: "Northern Virginia residents, particularly in Loudoun County (which hosts the densest cluster) and Prince William County (where expansion is accelerating). Also affected: Dominion Energy and Virginia's electrical grid, tech companies (Amazon Web Services, Microsoft Azure, Google Cloud), local school systems funded by data center tax revenue, homeowners near proposed sites, and agricultural landowners approached for conversion.",
        pros: [
          "According to the NVTC, data centers contributed approximately $14.3 billion to Virginia's GDP in 2023 and support about 47,000 direct and indirect jobs.",
          "Loudoun County collected over $600 million in data center tax revenue in FY2023, which funds roughly 30% of the county's public school budget without raising residential property taxes.",
          "Virginia's data center cluster has attracted a broader technology ecosystem, including cybersecurity firms, cloud service providers, and federal contractors.",
          "Data center companies have committed over $1 billion in clean energy purchases, making them among the largest corporate renewable energy buyers in the country."
        ],
        cons: [
          "Dominion Energy projects that data center electricity demand could require $2-4 billion in new grid infrastructure, with costs potentially passed to ratepayers.",
          "Community groups in Prince William County have organized against proposed developments, citing industrial noise (60-80 decibels from cooling systems), reduced property values, and incompatibility with residential zoning.",
          "Environmental advocates argue that despite renewable energy commitments, data centers' net energy demand is accelerating fossil fuel consumption and threatening Virginia's Clean Economy Act targets.",
          "Critics argue that data centers create relatively few permanent jobs per acre compared to other commercial development, with facilities employing only 30-50 workers per 100,000+ square feet."
        ]
      },
      "12": {
        tldr: "Virginia is the world's preeminent data center market, with over 300 facilities generating approximately $14.3 billion in GDP (2023) and hosting an estimated 70% of global internet traffic. The industry's rapid expansion — particularly in Loudoun and Prince William Counties — has created a complex policy debate balancing substantial economic benefits against grid capacity constraints, land use conflicts, environmental commitments, and community quality-of-life concerns.",
        whatItDoes: "Virginia's data center concentration stems from structural advantages: proximity to MAE-East (one of the original internet exchange points), fiber optic density, access to federal government and defense agencies, and a competitive tax environment including sales tax exemptions on qualifying equipment (Virginia Code § 58.1-609.3).\n\nAccording to Dominion Energy's 2024 Integrated Resource Plan, data center load in their service territory reached approximately 3,600 MW, with projected growth of 15-20% annually through 2030. This trajectory would make data centers the single largest driver of electricity demand growth in Virginia. The planning implications extend to transmission infrastructure, generation capacity, renewable energy procurement, and rate structures for residential customers.\n\nLand use conflicts have intensified as development expands beyond traditional industrial corridors. Prince William County's Board of Supervisors approved a data center overlay district in 2023 but faced significant community opposition, while Loudoun County has implemented setback and screening requirements in its revised zoning ordinance.",
        whoAffected: "Primary stakeholders include Northern Virginia residents (especially in Loudoun and Prince William Counties), Dominion Energy and the State Corporation Commission (grid planning and rate cases), hyperscale cloud providers (AWS, Microsoft, Google, Meta), the Virginia Economic Development Partnership, county governments dependent on data center tax revenue, environmental organizations monitoring Clean Economy Act compliance, agricultural landowners in expansion corridors, and federal agencies relying on Northern Virginia's data infrastructure.",
        pros: [
          "According to the NVTC, the data center industry contributed approximately $14.3 billion to Virginia's GDP in 2023, supporting 47,000 direct and indirect jobs with average salaries significantly above the state median.",
          "Loudoun County's FY2023 budget shows data center tax revenue exceeding $600 million, funding approximately 30% of the public school budget and enabling the county to maintain one of the lowest residential property tax rates in Northern Virginia.",
          "Virginia's data center cluster anchors a broader digital infrastructure ecosystem, attracting complementary investment in cybersecurity, cloud services, and federal IT contracting.",
          "Major operators have committed to over $1 billion in renewable energy purchases; Amazon's Virginia solar farms and Microsoft's nuclear energy agreements represent some of the largest corporate clean energy commitments globally.",
          "According to the Virginia Economic Development Partnership, data centers have a fiscal multiplier effect of approximately 2.3x, meaning each dollar of direct data center investment generates $2.30 in broader economic activity."
        ],
        cons: [
          "Dominion Energy estimates that meeting projected data center demand growth could require $2-4 billion in transmission and generation infrastructure, with costs potentially allocated to all ratepayers through general rate cases before the State Corporation Commission.",
          "The Sierra Club and other environmental groups argue that despite renewable energy commitments, the net effect of data center growth is an acceleration of fossil fuel consumption that threatens Virginia's Clean Economy Act target of 100% carbon-free electricity by 2045.",
          "Community impact assessments in Prince William County document industrial noise levels of 60-80 dB from cooling infrastructure, exceeding residential ordinance limits and prompting organized opposition from homeowner associations.",
          "Per-acre employment density analysis shows data centers generate approximately 0.5-1.0 jobs per acre, compared to 10-20 jobs per acre for typical commercial office development — raising questions about opportunity cost of land allocation.",
          "Agricultural preservation advocates note that data center expansion is consuming prime farmland in the Rural Crescent and other protected areas, with conversion that is effectively irreversible."
        ]
      }
    }
  },
  {
    key: "federal-judge-term-limits",
    match: /lifetime\s+appointment.*(?:judge|justice)|(?:judge|justice).*lifetime|(?:term\s+limit|18.year).*(?:judge|justice|court|judicial)|(?:judge|justice|court|judicial).*(?:term\s+limit|18.year)/i,
    citations: [
      {
        quote: "Article III of the U.S. Constitution provides that federal judges 'shall hold their Offices during good Behaviour,' which has been interpreted to mean lifetime tenure.",
        sourceName: "U.S. Constitution, Article III",
        url: "https://constitution.congress.gov/browse/article-3/",
        location: "tldr",
      },
      {
        quote: "The leading proposal would give Supreme Court justices 18-year staggered terms, with each president appointing two justices per four-year term.",
        sourceName: "Fix the Court - Term Limits",
        url: "https://fixthecourt.com/fix/term-limits/",
        location: "what",
      },
      {
        quote: "There are currently 870 authorized Article III judgeships, including 9 Supreme Court justices, 179 appeals court judges, and 673 district court judges.",
        sourceName: "United States Courts - Judicial Vacancies",
        url: "https://www.uscourts.gov/judges-judgeships/judicial-vacancies",
        location: "who",
      },
      {
        quote: "A 2023 Marquette Law School poll found that 72% of Americans favor replacing lifetime Supreme Court appointments with a system of fixed terms.",
        sourceName: "Marquette Law School Poll",
        url: "https://law.marquette.edu/poll/",
        location: "pros",
      },
      {
        quote: "Opponents argue that lifetime tenure insulates judges from political pressure, fulfilling the Founders' intent to create an independent judiciary.",
        sourceName: "Heritage Foundation - Judicial Independence",
        url: "https://www.heritage.org/the-constitution",
        location: "cons",
      },
    ],
    levels: {
      "5": {
        tldr: "Right now, federal judges serve for life. Some people want to change this so Supreme Court justices serve for 18 years instead. This would mean new justices are picked more regularly.",
        whatItDoes: "The Constitution says federal judges serve 'during good behaviour,' which means for life unless they resign or are impeached. The most popular reform idea would give Supreme Court justices 18-year terms, with a new justice appointed every two years.\n\nChanging this would require either a constitutional amendment (which needs approval from two-thirds of Congress and three-fourths of states) or creative legislation that some legal scholars think might work without an amendment.",
        whoAffected: "All 870 federal judges, the Supreme Court, the President (who appoints judges), the Senate (which confirms them), and every American whose rights depend on court decisions.",
        pros: [
          "Most Americans (about 72% in polls) support fixed terms for justices.",
          "Regular appointments would make each one less of a political fight.",
          "Justices would be appointed at more typical ages instead of being picked young to maximize time on the bench."
        ],
        cons: [
          "The Constitution specifically gives judges lifetime tenure to keep them independent from politics.",
          "Changing this might require a constitutional amendment, which is extremely hard to pass.",
          "Judges with term limits might make decisions to set up their next career instead of following the law."
        ]
      },
      "8": {
        tldr: "Federal judges currently serve lifetime appointments under Article III of the Constitution. The leading reform proposal would replace lifetime Supreme Court tenure with staggered 18-year terms, with each president appointing two justices per term. Supporters argue this would reduce the political stakes of each appointment and improve democratic accountability; opponents argue it would undermine judicial independence.",
        whatItDoes: "Article III of the U.S. Constitution provides that federal judges 'shall hold their Offices during good Behaviour,' interpreted as lifetime tenure subject only to impeachment. There are currently 870 authorized Article III judgeships.\n\nThe leading reform proposal, championed by Fix the Court and supported by scholars across the ideological spectrum, would give Supreme Court justices 18-year staggered terms. Each president would appoint two justices per four-year term, and retiring justices could serve as senior judges on lower courts. Implementation could potentially occur through statute (rotating justices to senior status) or would require a constitutional amendment.",
        whoAffected: "The 9 current Supreme Court justices, 179 appeals court judges, 673 district court judges, the President and Senate (appointment and confirmation powers), and the broader public whose constitutional rights are shaped by judicial interpretation.",
        pros: [
          "According to a 2023 Marquette Law School poll, 72% of Americans favor replacing lifetime Supreme Court appointments with fixed terms.",
          "Regular, predictable vacancies would reduce the extraordinary political stakes of each appointment, potentially lowering confirmation conflict.",
          "Term limits would prevent justices from serving into their 80s and 90s, addressing concerns about cognitive decline in aging members.",
          "The system would ensure that the Court's composition reflects more recent electoral outcomes, improving democratic legitimacy."
        ],
        cons: [
          "Lifetime tenure was specifically designed by the Founders to insulate judges from political pressure, as explained in Federalist No. 78 by Alexander Hamilton.",
          "A constitutional amendment requires two-thirds approval in both chambers of Congress and ratification by three-fourths of state legislatures — an extremely high bar.",
          "Critics argue that justices approaching the end of their terms might angle for post-judicial careers, compromising their independence.",
          "The current system has provided stability for over 230 years; changing it could open the door to further politicization of the judiciary."
        ]
      },
      "12": {
        tldr: "Article III of the U.S. Constitution grants federal judges tenure 'during good Behaviour,' effectively creating lifetime appointments removable only by impeachment. The dominant reform proposal — supported by organizations like Fix the Court and endorsed by scholars across the ideological spectrum — would implement staggered 18-year terms for Supreme Court justices, with regular biennial appointments. The debate involves fundamental tensions between judicial independence, democratic accountability, constitutional amendment difficulty, and the increasing political salience of Supreme Court nominations.",
        whatItDoes: "The current system: Article III establishes 870 authorized federal judgeships with lifetime tenure. Supreme Court justices have served an average of approximately 17 years historically, but recent appointees have been younger (average appointment age dropping from 55 to 49 over the past four decades), extending expected tenures to 25-30+ years.\n\nThe 18-year proposal: Each president would appoint two justices per four-year term on a fixed schedule. After 18 years, justices would assume 'senior status' and could continue hearing cases on circuit courts. Implementation pathways include: (1) a constitutional amendment modifying Article III, (2) statutory rotation under the argument that 'good Behaviour' does not preclude reassignment to senior status, or (3) a constitutional convention. Legal scholars are divided on whether Option 2 would survive judicial review.\n\nComparative context: Among major democracies, the U.S. is an outlier. Germany's Federal Constitutional Court uses 12-year non-renewable terms; the UK Supreme Court has mandatory retirement at 70; Canada mandates retirement at 75. Most constitutional courts worldwide use fixed terms.",
        whoAffected: "Current Article III judges (870 authorized positions), the Supreme Court (9 justices), the President and Senate (nomination and confirmation powers), the Judicial Conference of the United States, litigants in federal courts, and the broader constitutional order. Indirectly affects every American whose rights, regulatory framework, and democratic processes are shaped by federal judicial interpretation.",
        pros: [
          "According to a 2023 Marquette Law School poll, 72% of Americans support fixed terms for Supreme Court justices, including majorities of both Democrats and Republicans, suggesting broad bipartisan legitimacy for reform.",
          "Regular, predictable vacancies would reduce the winner-take-all dynamics of each appointment, potentially lowering confirmation toxicity — the average confirmation process has grown from 2 weeks (pre-1980) to over 2 months with significant partisan conflict.",
          "Term limits would address the strategic retirement problem, where justices time their departures to ensure ideologically compatible successors, converting a legal institution into a political chess piece.",
          "The current system incentivizes appointing younger nominees to maximize tenure, potentially prioritizing youth over experience — the average appointment age has dropped from 55 to 49 over four decades.",
          "Comparative constitutional analysis shows the U.S. is an outlier; virtually every modern constitutional court uses term limits or mandatory retirement ages, suggesting that judicial independence and fixed terms are compatible."
        ],
        cons: [
          "Alexander Hamilton's Federalist No. 78 explicitly argued that lifetime tenure is essential to judicial independence: 'nothing will contribute so much as [permanent tenure] to that independent spirit in the judges which must be essential to the faithful performance of so arduous a duty.'",
          "A constitutional amendment requires two-thirds supermajorities in both chambers of Congress and ratification by 38 state legislatures — a threshold met only 17 times since the Bill of Rights, making this reform extraordinarily difficult.",
          "The statutory workaround (rotating justices to 'senior status' without amending Article III) faces significant constitutional risk; if challenged, the Supreme Court itself would likely rule on its own tenure — an obvious conflict of interest with no clear resolution mechanism.",
          "Critics argue that term-limited justices may engage in strategic behavior near the end of their terms, whether currying favor for post-judicial appointments or making legacy-driven decisions, undermining the very independence the reform seeks to improve.",
          "The 230-year stability of the current system, despite periodic controversy, represents a known quantity; reforms could produce unintended consequences including further politicization, gaming of appointment timing, or constitutional crises if implementation is contested."
        ]
      }
    }
  },
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
