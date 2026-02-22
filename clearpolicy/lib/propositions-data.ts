export interface PropositionData {
    num: string;
    year: number;
    title: string;
    category: string;
    status: string;
    summary: string;
    tldr?: string;
    pros?: string[];
    cons?: string[];
}

export interface FederalBillData {
    id: string;
    type: string;
    title: string;
    category: string;
    status: string;
    summary: string;
    href: string;
}

export const propositions: PropositionData[] = [
    // ── 2024 ──
    {
        num: "1", year: 2024, title: "Behavioral Health Services Program and Bond Measure", category: "Healthcare", status: "Passed",
        summary: "Renames the Mental Health Services Act, redirects some existing tax revenue, and authorizes bonds for housing and services for people with behavioral health needs.",
        tldr: "Renames the Mental Health Services Act, redirects some existing tax revenue, and authorizes bonds for housing and services for people with behavioral health needs.",
        pros: ["Expands funding for behavioral health services", "Supports housing and treatment infrastructure", "Continues dedicated revenue source"],
        cons: ["Redirects existing revenue away from current programs", "Adds long-term bond costs", "Implementation details may be complex"]
    },
    {
        num: "2", year: 2024, title: "Public School and Community College Facilities Bond", category: "Education", status: "Passed",
        summary: "Authorizes state bonds to fund construction and modernization of K–12 schools and community college facilities.",
        tldr: "Authorizes state bonds to fund construction and modernization of K–12 schools and community college facilities.",
        pros: ["Funds upgrades and repairs", "Supports capacity needs", "Improves learning environments"],
        cons: ["Adds state debt", "Allocation may favor some districts", "Ongoing maintenance costs remain"]
    },
    {
        num: "3", year: 2024, title: "Right to Marry Amendment", category: "Civil Rights", status: "Passed",
        summary: "Repeals outdated language and explicitly protects the right to marry regardless of the genders of the parties.",
        tldr: "Repeals outdated language and explicitly protects the right to marry regardless of the genders of the parties.",
        pros: ["Clarifies constitutional protections", "Aligns with federal law", "Protects marriage equality"],
        cons: ["Limited practical change", "Amendment process cost", "Opponents cite constitutional minimalism"]
    },
    {
        num: "4", year: 2024, title: "Parks, Environment, and Water Infrastructure Bond", category: "Environment", status: "Passed",
        summary: "Authorizes $10 billion in bonds for parks, environmental projects, water infrastructure, energy, and flood protection.",
        tldr: "Authorizes $10 billion in bonds for parks, environmental projects, water infrastructure, energy, and flood protection.",
        pros: ["Invests in climate resilience", "Funds water and park projects", "Supports local infrastructure upgrades"],
        cons: ["Adds long-term debt costs", "Project allocation debates", "Bond repayments reduce budget flexibility"]
    },
    {
        num: "5", year: 2024, title: "Lower Vote Threshold for Local Housing and Infrastructure Bonds", category: "Housing", status: "Rejected",
        summary: "Would have lowered the local vote threshold from two-thirds to 55% for certain affordable housing and infrastructure bond measures.",
        tldr: "Would have lowered the local vote threshold from two-thirds to 55% for certain affordable housing and infrastructure bond measures.",
        pros: ["Makes local bonds easier to pass", "Could accelerate housing projects", "Increases local flexibility"],
        cons: ["Lowers voter approval threshold", "Potentially increases local debt", "Project oversight concerns"]
    },
    {
        num: "6", year: 2024, title: "End Involuntary Servitude for Incarcerated Persons", category: "Criminal Justice", status: "Passed",
        summary: "Removes language allowing involuntary servitude as criminal punishment from the state constitution.",
        tldr: "Removes language allowing involuntary servitude as criminal punishment from the state constitution.",
        pros: ["Aligns constitution with modern standards", "Clarifies protections for incarcerated people", "Symbolic civil rights change"],
        cons: ["Limited immediate policy change", "Implementation may need legislation", "Potential legal uncertainty"]
    },
    {
        num: "32", year: 2024, title: "Raise Minimum Wage to $18", category: "Labor", status: "Rejected",
        summary: "Would have increased California's statewide minimum wage to $18 per hour, with phased implementation.",
        tldr: "Would have increased California's statewide minimum wage to $18 per hour, with phased implementation.",
        pros: ["Boosts wages for low-income workers", "Could reduce wage inequality", "Increases consumer spending power"],
        cons: ["May increase labor costs", "Could reduce hiring", "Potential price increases"]
    },
    {
        num: "33", year: 2024, title: "Expand Local Rent Control Authority", category: "Housing", status: "Rejected",
        summary: "Would have repealed parts of the Costa-Hawkins Act to let cities expand rent control on more residential properties.",
        tldr: "Would have repealed parts of the Costa-Hawkins Act to let cities expand rent control on more residential properties.",
        pros: ["Allows broader rent stabilization", "Increases local policy control", "Could slow rent growth"],
        cons: ["Potentially reduces housing supply", "Impacts property owners", "May shift costs elsewhere"]
    },
    {
        num: "34", year: 2024, title: "Prescription Drug Revenue Restrictions", category: "Healthcare", status: "Rejected",
        summary: "Would have restricted how certain health care providers spend revenue from prescription drugs.",
        tldr: "Would have restricted how certain health care providers spend revenue from prescription drugs.",
        pros: ["Increases transparency in drug revenue use", "Prioritizes patient care spending", "May curb profit-taking"],
        cons: ["Limits operational flexibility", "Could reduce services", "Regulatory complexity"]
    },
    {
        num: "35", year: 2024, title: "Permanent Funding for Medi-Cal Services", category: "Healthcare", status: "Passed",
        summary: "Permanently authorizes a managed care organization tax to fund Medi-Cal and related health care programs.",
        tldr: "Permanently authorizes a managed care organization tax to fund Medi-Cal and related health care programs.",
        pros: ["Stabilizes Medi-Cal funding", "Maintains existing revenue stream", "Supports health coverage"],
        cons: ["Locks in tax structure", "Complex financing mechanism", "May affect plan costs"]
    },
    {
        num: "36", year: 2024, title: "Felony Charges for Certain Drug and Theft Crimes", category: "Criminal Justice", status: "Rejected",
        summary: "Would have allowed more felony charges and longer sentences for some drug and theft offenses and expanded treatment requirements.",
        tldr: "Would have allowed more felony charges and longer sentences for some drug and theft offenses and expanded treatment requirements.",
        pros: ["Targets repeat offenses", "Expands treatment requirements", "Addresses retail theft concerns"],
        cons: ["May increase incarceration costs", "Could reverse reforms", "Disproportionate impacts"]
    },
    // ── 2020 ──
    {
        num: "13", year: 2020, title: "School and College Facilities Bond", category: "Education", status: "Rejected",
        summary: "Would have authorized $15 billion in state bonds for construction and modernization of public schools and higher education facilities.",
        tldr: "Would have authorized $15 billion in state bonds for construction and modernization of public schools and higher education facilities.",
        pros: ["Funds facility upgrades", "Supports school capacity needs", "Improves campus safety"],
        cons: ["Adds state debt", "Allocation concerns", "Ongoing maintenance costs"]
    },
    {
        num: "14", year: 2020, title: "Stem Cell Research Institute Bond", category: "Healthcare", status: "Passed",
        summary: "Authorizes $5.5 billion in bonds to continue funding the state's stem cell research and medical treatments agency.",
        tldr: "Authorizes $5.5 billion in bonds to continue funding the state's stem cell research and medical treatments agency.",
        pros: ["Supports biomedical research", "Funds medical innovation", "Maintains research infrastructure"],
        cons: ["Adds state debt", "Research outcomes uncertain", "Long-term funding commitments"]
    },
    {
        num: "15", year: 2020, title: "Tax on Commercial and Industrial Properties for Education and Local Government", category: "Taxes", status: "Rejected",
        summary: "Would have taxed most large commercial and industrial properties on market value, directing new revenue to schools and local governments.",
        tldr: "Would have taxed most large commercial and industrial properties on market value, directing new revenue to schools and local governments.",
        pros: ["Raises revenue for schools", "Targets large properties", "Reduces reliance on other taxes"],
        cons: ["Potential rent pass-through", "Complex reassessment rules", "Business opposition"]
    },
    {
        num: "16", year: 2020, title: "Repeal of Ban on Affirmative Action", category: "Education", status: "Rejected",
        summary: "Would have allowed state and local governments to consider race, sex, color, ethnicity, or national origin in public programs.",
        tldr: "Would have allowed state and local governments to consider race, sex, color, ethnicity, or national origin in public programs.",
        pros: ["Increases flexibility in admissions and hiring", "May improve diversity", "Aligns with federal policies"],
        cons: ["Contested fairness concerns", "Potential legal challenges", "Polarizing policy change"]
    },
    {
        num: "17", year: 2020, title: "Voting Rights for People on Parole", category: "Voting Rights", status: "Passed",
        summary: "Restores the right to vote to people with felony convictions who have completed prison but remain on state parole.",
        tldr: "Restores the right to vote to people with felony convictions who have completed prison but remain on state parole.",
        pros: ["Promotes civic reintegration", "Expands voting access", "Aligns with rehabilitation goals"],
        cons: ["Administrative changes required", "Some oppose expansion", "Implementation complexity"]
    },
    {
        num: "18", year: 2020, title: "Primary Voting for 17-Year-Olds", category: "Voting Rights", status: "Rejected",
        summary: "Would have allowed 17-year-olds to vote in primaries and special elections if they turn 18 by the next general election.",
        tldr: "Would have allowed 17-year-olds to vote in primaries and special elections if they turn 18 by the next general election.",
        pros: ["Expands youth participation", "Aligns primary eligibility", "Encourages civic engagement"],
        cons: ["Concerns about readiness", "Administrative updates", "Limited scope"]
    },
    {
        num: "19", year: 2020, title: "Property Tax Transfers and Inheritance Rules", category: "Taxes", status: "Passed",
        summary: "Changes rules for transferring property tax assessments for some homeowners and narrows tax breaks on inherited property.",
        tldr: "Changes rules for transferring property tax assessments for some homeowners and narrows tax breaks on inherited property.",
        pros: ["Enables senior mobility", "Targets inherited property benefits", "Increases revenue potential"],
        cons: ["Complex eligibility rules", "Potentially higher taxes for heirs", "Administrative burden"]
    },
    {
        num: "20", year: 2020, title: "Criminal Sentencing, Parole, and DNA Collection", category: "Criminal Justice", status: "Rejected",
        summary: "Would have increased penalties for certain theft crimes, limited parole, and expanded DNA collection from some offenses.",
        tldr: "Would have increased penalties for certain theft crimes, limited parole, and expanded DNA collection from some offenses.",
        pros: ["Tougher penalties for theft", "Expands DNA database", "Addresses repeat crime concerns"],
        cons: ["Higher incarceration costs", "Civil liberties concerns", "Reduces parole flexibility"]
    },
    {
        num: "21", year: 2020, title: "Local Rent Control Initiative", category: "Housing", status: "Rejected",
        summary: "Would have allowed cities to adopt rent control on more older rental properties while preserving some landlord exemptions.",
        tldr: "Would have allowed cities to adopt rent control on more older rental properties while preserving some landlord exemptions.",
        pros: ["Expands rent control options", "Local flexibility", "Potential tenant protections"],
        cons: ["Housing supply concerns", "Property owner impacts", "Potential investment slowdown"]
    },
    {
        num: "22", year: 2020, title: "App-Based Drivers as Independent Contractors", category: "Labor", status: "Passed",
        summary: "Classifies app-based transportation and delivery drivers as independent contractors, with some required benefits and protections.",
        tldr: "Classifies app-based transportation and delivery drivers as independent contractors, with some required benefits and protections.",
        pros: ["Maintains flexible work model", "Provides some benefits", "Clarifies classification"],
        cons: ["Limits full employee protections", "Worker security concerns", "Sets precedent for gig work"]
    },
    {
        num: "23", year: 2020, title: "Dialysis Clinic Requirements", category: "Healthcare", status: "Rejected",
        summary: "Would have required on-site physicians at dialysis clinics and state approval before clinics could close or reduce services.",
        tldr: "Would have required on-site physicians at dialysis clinics and state approval before clinics could close or reduce services.",
        pros: ["Increases clinic oversight", "Potential safety improvements", "Limits sudden closures"],
        cons: ["Higher operational costs", "May reduce clinic availability", "Regulatory burden"]
    },
    {
        num: "24", year: 2020, title: "California Privacy Rights Act", category: "Technology/Privacy", status: "Passed",
        summary: "Expands consumer data privacy rights, creates a new state privacy agency, and tightens rules on businesses' use of personal information.",
        tldr: "Expands consumer data privacy rights, creates a new state privacy agency, and tightens rules on businesses' use of personal information.",
        pros: ["Strengthens privacy rights", "Creates enforcement agency", "Limits data sharing"],
        cons: ["Compliance costs for businesses", "Complex enforcement", "Potential impact on innovation"]
    },
    {
        num: "25", year: 2020, title: "Replace Cash Bail with Risk Assessments Referendum", category: "Criminal Justice", status: "Rejected",
        summary: "Upholds a law's repeal, preventing replacement of cash bail with pretrial risk assessment for most criminal cases.",
        tldr: "Upholds a law's repeal, preventing replacement of cash bail with pretrial risk assessment for most criminal cases.",
        pros: ["Maintains current cash bail system", "Avoids new risk assessment model", "Clarity for courts"],
        cons: ["Does not address bail inequities", "Keeps financial barriers", "Missed reform opportunity"]
    },
    // ── 2022 ──
    {
        num: "26", year: 2022, title: "In-Person Tribal Sports Betting", category: "Economy/Business", status: "Rejected",
        summary: "Would have allowed in-person sports betting at tribal casinos and certain racetracks and changed related gaming rules.",
        tldr: "Would have allowed in-person sports betting at tribal casinos and certain racetracks and changed related gaming rules.",
        pros: ["Potential new revenue", "Expands gaming options", "Supports tribal casinos"],
        cons: ["Opposition from some tribes", "Regulatory complexity", "Gambling concerns"]
    },
    {
        num: "27", year: 2022, title: "Online Sports Betting Initiative", category: "Economy/Business", status: "Rejected",
        summary: "Would have legalized online sports betting statewide for approved operators subject to taxes and regulations.",
        tldr: "Would have legalized online sports betting statewide for approved operators subject to taxes and regulations.",
        pros: ["New tax revenue", "Convenient access", "Regulated market"],
        cons: ["Gambling addiction concerns", "Market competition issues", "Regulatory oversight needs"]
    },
    {
        num: "28", year: 2022, title: "Arts and Music School Funding", category: "Education", status: "Passed",
        summary: "Requires the state to provide additional funding for arts and music education in K–12 public schools.",
        tldr: "Requires the state to provide additional funding for arts and music education in K–12 public schools.",
        pros: ["Expands arts education", "Dedicated funding stream", "Supports student enrichment"],
        cons: ["Budget constraints", "Allocation disputes", "Implementation complexity"]
    },
    {
        num: "29", year: 2022, title: "Dialysis Clinic Staffing and Requirements", category: "Healthcare", status: "Rejected",
        summary: "Would have required a physician or other clinician on site at dialysis clinics and new reporting rules.",
        tldr: "Would have required a physician or other clinician on site at dialysis clinics and new reporting rules.",
        pros: ["Potential safety improvements", "Increases oversight", "Standardizes reporting"],
        cons: ["Higher clinic costs", "May reduce availability", "Regulatory burden"]
    },
    {
        num: "30", year: 2022, title: "Tax on High-Income Earners for Climate Programs", category: "Environment", status: "Rejected",
        summary: "Would have increased income taxes on very high earners to fund electric vehicle incentives and wildfire programs.",
        tldr: "Would have increased income taxes on very high earners to fund electric vehicle incentives and wildfire programs.",
        pros: ["Funds climate programs", "Targets high earners", "Supports wildfire mitigation"],
        cons: ["Tax volatility risk", "Opposition from taxpayers", "Revenue allocation disputes"]
    },
    {
        num: "31", year: 2022, title: "Ban on Flavored Tobacco Products Referendum", category: "Public Safety", status: "Passed",
        summary: "Upholds a state law banning the retail sale of most flavored tobacco products and flavor enhancers.",
        tldr: "Upholds a state law banning the retail sale of most flavored tobacco products and flavor enhancers.",
        pros: ["Reduces youth smoking risks", "Supports public health", "Clarifies retail rules"],
        cons: ["Impact on small retailers", "Enforcement challenges", "Black market concerns"]
    },
    // ── 2018 (with compare data) ──
    {
        num: "6", year: 2018, title: "Repeal Gas and Diesel Tax Increases", category: "Transportation", status: "Rejected",
        summary: "Would have repealed recent fuel and vehicle taxes and required voter approval for future fuel and vehicle fee increases.",
        tldr: "Would have repealed recent fuel and vehicle taxes and required voter approval for future fuel and vehicle fee increases.",
        pros: ["Reduces fuel tax burden", "Requires voter approval for increases", "Supports drivers"],
        cons: ["Cuts transportation funding", "Delays infrastructure projects", "Budget uncertainty"]
    },
    {
        num: "7", year: 2018, title: "Daylight Saving Time Amendment", category: "Government/Process", status: "Passed",
        summary: "Authorizes the Legislature to change daylight saving time law if federal law allows, potentially ending seasonal clock changes.",
        tldr: "Authorizes the Legislature to change daylight saving time law if federal law allows, potentially ending seasonal clock changes.",
        pros: ["Allows time change flexibility", "Potentially ends clock changes", "Responds to public preference"],
        cons: ["Requires federal approval", "Implementation uncertainty", "Limited immediate change"]
    },
    {
        num: "10", year: 2018, title: "Expand Local Rent Control (2018)", category: "Housing", status: "Rejected",
        summary: "Would have repealed limits on local residential rent control set by the Costa-Hawkins Rental Housing Act.",
        tldr: "Would have repealed limits on local residential rent control set by the Costa-Hawkins Rental Housing Act.",
        pros: ["Expands local rent control", "Local policy control", "Potential tenant protections"],
        cons: ["Concerns about housing supply", "Property owner impacts", "Investment uncertainty"]
    },
    // ── 2016 ──
    {
        num: "51", year: 2016, title: "School Bonds for K–12 and Community Colleges", category: "Education", status: "Passed",
        summary: "Authorizes $9 billion in bonds for construction and modernization of K–12 school and community college facilities.",
        tldr: "Authorizes $9 billion in bonds for construction and modernization of K–12 school and community college facilities.",
        pros: ["Funds facility upgrades", "Supports school capacity", "Improves learning environments"],
        cons: ["Adds state debt", "Allocation concerns", "Ongoing maintenance costs"]
    },
    {
        num: "52", year: 2016, title: "State Fees on Hospitals Amendment", category: "Healthcare", status: "Passed",
        summary: "Requires voter approval to change or end the hospital quality assurance fee that helps fund Medi-Cal.",
        tldr: "Requires voter approval to change or end the hospital quality assurance fee that helps fund Medi-Cal.",
        pros: ["Protects Medi-Cal funding stream", "Maintains hospital fee structure", "Requires voter oversight"],
        cons: ["Limits legislative flexibility", "Complex fiscal impacts", "Potential funding rigidity"]
    },
    {
        num: "53", year: 2016, title: "Voter Approval for Large State Projects", category: "Government/Process", status: "Rejected",
        summary: "Would have required statewide voter approval for certain state revenue bond projects costing more than $2 billion.",
        tldr: "Would have required statewide voter approval for certain state revenue bond projects costing more than $2 billion.",
        pros: ["Adds voter oversight", "Controls large debt projects", "Increases transparency"],
        cons: ["May delay infrastructure", "Reduced legislative flexibility", "One-size threshold issues"]
    },
    {
        num: "54", year: 2016, title: "Legislative Transparency Initiative", category: "Government/Process", status: "Passed",
        summary: "Requires bills to be posted online for 72 hours before a vote and allows recording and posting of legislative proceedings.",
        tldr: "Requires bills to be posted online for 72 hours before a vote and allows recording and posting of legislative proceedings.",
        pros: ["Improves transparency", "Increases public access", "Supports accountability"],
        cons: ["May slow legislative process", "Implementation costs", "Potential for delays"]
    },
    {
        num: "55", year: 2016, title: "Extension of Income Tax on High Earners", category: "Taxes", status: "Passed",
        summary: "Extends higher personal income tax rates on high-income earners to fund education and some health care programs.",
        tldr: "Extends higher personal income tax rates on high-income earners to fund education and some health care programs.",
        pros: ["Funds education programs", "Targets high incomes", "Maintains existing rates"],
        cons: ["Revenue volatility", "Taxpayer opposition", "Economic competitiveness concerns"]
    },
    {
        num: "56", year: 2016, title: "Tobacco and E-Cigarette Tax Increase", category: "Healthcare", status: "Passed",
        summary: "Increases the cigarette tax by $2 per pack and raises taxes on other tobacco products and e-cigarettes.",
        tldr: "Increases the cigarette tax by $2 per pack and raises taxes on other tobacco products and e-cigarettes.",
        pros: ["Reduces smoking rates", "Funds health programs", "Raises public health revenue"],
        cons: ["Regressive tax impact", "Smuggling risks", "Industry opposition"]
    },
    {
        num: "57", year: 2016, title: "Parole for Nonviolent Criminals and Juvenile Trial Rules", category: "Criminal Justice", status: "Passed",
        summary: "Expands parole consideration for some nonviolent offenders and changes how juveniles can be tried in adult court.",
        tldr: "Expands parole consideration for some nonviolent offenders and changes how juveniles can be tried in adult court.",
        pros: ["Supports rehabilitation", "Reduces incarceration rates", "Adjusts juvenile justice rules"],
        cons: ["Public safety concerns", "Parole process complexity", "Opposition from some victims groups"]
    },
    {
        num: "58", year: 2016, title: "English Proficiency and Multilingual Education", category: "Education", status: "Passed",
        summary: "Modifies rules on English-only instruction to allow more bilingual and multilingual programs in public schools.",
        tldr: "Modifies rules on English-only instruction to allow more bilingual and multilingual programs in public schools.",
        pros: ["Expands multilingual options", "Supports English learners", "Local flexibility"],
        cons: ["Implementation variability", "Resource needs", "Outcome concerns"]
    },
    {
        num: "59", year: 2016, title: "Advisory Question on Citizens United", category: "Government/Process", status: "Passed",
        summary: "Advises state officials to work toward overturning the Citizens United campaign finance decision.",
        tldr: "Advises state officials to work toward overturning the Citizens United campaign finance decision.",
        pros: ["Signals voter sentiment", "Supports campaign finance reform", "Low implementation cost"],
        cons: ["Nonbinding effect", "Symbolic measure", "Limited policy change"]
    },
    {
        num: "60", year: 2016, title: "Condoms in Adult Films", category: "Public Safety", status: "Rejected",
        summary: "Would have required performers in adult films to use condoms and imposed related health and reporting rules.",
        tldr: "Would have required performers in adult films to use condoms and imposed related health and reporting rules.",
        pros: ["Aims to improve worker safety", "Health reporting requirements", "Clear industry rules"],
        cons: ["Enforcement challenges", "Industry opposition", "Potential legal challenges"]
    },
    {
        num: "61", year: 2016, title: "State Prescription Drug Purchases Pricing Standards", category: "Healthcare", status: "Rejected",
        summary: "Would have limited what the state pays for prescription drugs to prices paid by the U.S. Department of Veterans Affairs.",
        tldr: "Would have limited what the state pays for prescription drugs to prices paid by the U.S. Department of Veterans Affairs.",
        pros: ["May reduce drug costs", "Uses benchmark pricing", "Potential savings"],
        cons: ["Implementation complexity", "Potential access impacts", "Legal challenges"]
    },
    {
        num: "62", year: 2016, title: "Repeal of the Death Penalty", category: "Criminal Justice", status: "Rejected",
        summary: "Would have repealed the death penalty and replaced it with life imprisonment without the possibility of parole.",
        tldr: "Would have repealed the death penalty and replaced it with life imprisonment without the possibility of parole.",
        pros: ["Eliminates death penalty", "Reduces appeals costs", "Avoids wrongful execution risk"],
        cons: ["Opposition from some voters", "Impact on deterrence debate", "Policy change controversy"]
    },
    {
        num: "63", year: 2016, title: "Background Checks for Ammunition Sales", category: "Public Safety", status: "Passed",
        summary: "Requires background checks for ammunition purchases and restricts large-capacity ammunition magazines.",
        tldr: "Requires background checks for ammunition purchases and restricts large-capacity ammunition magazines.",
        pros: ["Strengthens gun safety rules", "Limits high-capacity magazines", "Adds purchase screening"],
        cons: ["Enforcement costs", "Opposition from gun rights groups", "Potential legal challenges"]
    },
    {
        num: "64", year: 2016, title: "Marijuana Legalization", category: "Criminal Justice", status: "Passed",
        summary: "Legalizes recreational marijuana for adults, establishes taxation, and sets rules for cultivation and sale.",
        tldr: "Legalizes recreational marijuana for adults, establishes taxation, and sets rules for cultivation and sale.",
        pros: ["Creates regulated market", "Generates tax revenue", "Reduces criminal penalties"],
        cons: ["Public health concerns", "Impaired driving risks", "Regulatory complexity"]
    },
    {
        num: "65", year: 2016, title: "Carryout Bag Charges", category: "Environment", status: "Rejected",
        summary: "Would have directed money from certain carryout bag charges to a state environmental fund instead of retailers.",
        tldr: "Would have directed money from certain carryout bag charges to a state environmental fund instead of retailers.",
        pros: ["Funds environmental programs", "Reduces plastic use", "Standardizes fee handling"],
        cons: ["Cost to consumers", "Retailer opposition", "Administrative complexity"]
    },
    {
        num: "66", year: 2016, title: "Death Penalty Procedures", category: "Criminal Justice", status: "Passed",
        summary: "Changes procedures to speed up death penalty appeals and modifications to legal challenges.",
        tldr: "Changes procedures to speed up death penalty appeals and modifications to legal challenges.",
        pros: ["Speeds appeals process", "Clarifies procedures", "Responds to backlog concerns"],
        cons: ["Increases risk of errors", "Civil rights concerns", "Legal challenges likely"]
    },
    {
        num: "67", year: 2016, title: "Ban on Single-Use Plastic Bags", category: "Environment", status: "Passed",
        summary: "Upholds a statewide ban on single-use plastic carryout bags and allows certain reusable bag charges.",
        tldr: "Upholds a statewide ban on single-use plastic carryout bags and allows certain reusable bag charges.",
        pros: ["Reduces plastic waste", "Supports environmental goals", "Clear statewide standard"],
        cons: ["Costs for consumers", "Retail transition costs", "Equity concerns"]
    },
    // ── 2010 (browse-only) ──
    { num: "13", year: 2010, title: "Seismic Retrofitting Property Tax Exclusion", category: "Taxes", status: "Passed", summary: "Continues excluding seismic retrofitting improvements from property tax reassessment to encourage earthquake safety upgrades." },
    { num: "14", year: 2010, title: "Top Two Primaries Act", category: "Government/Process", status: "Passed", summary: "Creates a top-two primary system where all candidates appear on one primary ballot and the two highest vote-getters advance to the general election." },
    { num: "15", year: 2010, title: "California Fair Elections Act", category: "Government/Process", status: "Rejected", summary: "Would have created a public campaign financing system for certain statewide candidates funded by fees on lobbyists and contractors." },
    { num: "16", year: 2010, title: "Two-Thirds Vote for Local Public Electricity", category: "Economy/Business", status: "Rejected", summary: "Would have required two-thirds voter approval before local governments could create or expand public electricity providers." },
    { num: "17", year: 2010, title: "Auto Insurance Continuous Coverage Discounts", category: "Economy/Business", status: "Rejected", summary: "Would have allowed auto insurers to offer new discounts or surcharges based on a driver's history of prior insurance coverage." },
    { num: "18", year: 2010, title: "Water Bond (Removed from Ballot)", category: "Environment", status: "Rejected", summary: "Authorized a major water infrastructure bond but was removed from the ballot by the Legislature and did not go before voters." },
    { num: "19", year: 2010, title: "Marijuana Legalization Initiative (2010)", category: "Criminal Justice", status: "Rejected", summary: "Would have legalized certain marijuana activities for adults and allowed local regulation and taxation of commercial production and sales." },
    { num: "20", year: 2010, title: "Congressional Redistricting by Citizens Commission", category: "Government/Process", status: "Passed", summary: "Transfers authority for drawing U.S. House districts from the Legislature to the existing Citizens Redistricting Commission." },
    { num: "21", year: 2010, title: "Vehicle License Surcharge for State Parks", category: "Environment", status: "Rejected", summary: "Would have added an annual vehicle surcharge to fund state parks and wildlife conservation, providing free park entry to payers." },
    { num: "22", year: 2010, title: "Local Tax Funds Protection", category: "Taxes", status: "Passed", summary: "Prohibits the state from redirecting or borrowing certain local tax revenues dedicated to transportation and local services." },
    { num: "23", year: 2010, title: "Suspend Air Pollution Control Law", category: "Environment", status: "Rejected", summary: "Would have suspended the state's greenhouse gas reduction law until unemployment fell to a specified level." },
    { num: "24", year: 2010, title: "Repeal Recent Business Tax Changes", category: "Taxes", status: "Rejected", summary: "Would have repealed business tax law changes that allowed some multistate companies to reduce their California income taxes." },
    { num: "25", year: 2010, title: "Simple Majority Vote for Budget", category: "Government/Process", status: "Passed", summary: "Lowers the vote needed to pass the state budget from two-thirds to a simple majority while leaving tax vote rules unchanged." },
    { num: "26", year: 2010, title: "Supermajority Vote to Approve Certain Fees", category: "Taxes", status: "Passed", summary: "Reclassifies some state and local regulatory fees as taxes, requiring two-thirds legislative or voter approval." },
    { num: "27", year: 2010, title: "Eliminate Citizens Redistricting Commission", category: "Government/Process", status: "Rejected", summary: "Would have abolished the Citizens Redistricting Commission and returned redistricting authority to the Legislature." },
    // ── 2012 (browse-only) ──
    { num: "28", year: 2012, title: "Legislative Term Limits Reform", category: "Government/Process", status: "Passed", summary: "Reduces total years a person may serve in the Legislature but allows all years to be served in one house." },
    { num: "29", year: 2012, title: "Cigarette Tax for Cancer Research", category: "Healthcare", status: "Rejected", summary: "Would have increased cigarette taxes by $1 per pack to fund cancer research and tobacco control programs." },
    { num: "30", year: 2012, title: "Temporary Taxes to Fund Education", category: "Taxes", status: "Passed", summary: "Raises income taxes on high earners and the statewide sales tax temporarily to fund schools and help balance the budget." },
    { num: "31", year: 2012, title: "State Budget and Governance Reforms", category: "Government/Process", status: "Rejected", summary: "Would have changed state and local budget procedures, including two-year state budgets and new local funding flexibility." },
    { num: "32", year: 2012, title: "Payroll Deductions for Political Purposes", category: "Labor", status: "Rejected", summary: "Would have restricted unions and some employers from using payroll-deducted funds for political spending." },
    { num: "33", year: 2012, title: "Auto Insurance Rates Based on Coverage History", category: "Economy/Business", status: "Rejected", summary: "Would have allowed insurers to set auto rates partly on a driver's prior insurance coverage history." },
    { num: "34", year: 2012, title: "Repeal Death Penalty Initiative", category: "Criminal Justice", status: "Rejected", summary: "Would have replaced the death penalty with life imprisonment without parole and required changes to victim restitution funding." },
    { num: "35", year: 2012, title: "Human Trafficking Penalties", category: "Criminal Justice", status: "Passed", summary: "Increases criminal penalties and registration requirements for human trafficking offenses and expands victims' rights." },
    { num: "36", year: 2012, title: "Three Strikes Law Reform", category: "Criminal Justice", status: "Passed", summary: "Revises the three strikes sentencing law so that a life sentence is imposed only when the new felony conviction is serious or violent." },
    { num: "37", year: 2012, title: "Labeling of Genetically Engineered Foods", category: "Environment", status: "Rejected", summary: "Would have required labeling of most genetically engineered foods sold in California retail stores." },
    { num: "38", year: 2012, title: "Tax to Fund Education and Early Childhood Programs", category: "Taxes", status: "Rejected", summary: "Would have increased income taxes on most taxpayers to fund K–12 schools and early childhood programs." },
    { num: "39", year: 2012, title: "Tax Treatment of Multistate Businesses", category: "Taxes", status: "Passed", summary: "Changes corporate income tax rules for multistate businesses and dedicates some new revenue to clean energy projects." },
    { num: "40", year: 2012, title: "State Senate Redistricting Maps", category: "Government/Process", status: "Passed", summary: "Upholds the Citizens Redistricting Commission's State Senate maps by rejecting a referendum to overturn them." },
    // ── 2014 (browse-only) ──
    { num: "1", year: 2014, title: "Water Quality, Supply, and Infrastructure Bond", category: "Environment", status: "Passed", summary: "Authorizes a statewide bond to fund water supply reliability, water quality, and ecosystem restoration projects." },
    { num: "2", year: 2014, title: "State Budget Stabilization Fund Amendment", category: "Taxes", status: "Passed", summary: "Constitutionally strengthens rainy day fund rules, complementing related statutory changes to budget reserves." },
    { num: "41", year: 2014, title: "Veterans Housing and Homeless Prevention Bond", category: "Housing", status: "Passed", summary: "Authorizes bonds to fund affordable housing and related services for veterans, especially those experiencing homelessness." },
    { num: "42", year: 2014, title: "Public Records and Open Meetings Requirements", category: "Government/Process", status: "Passed", summary: "Requires local governments to comply with public records and open meeting laws as a constitutional duty." },
    { num: "43", year: 2014, title: "Safe Drinking Water Bond (Moved to 1)", category: "Environment", status: "Rejected", summary: "Originally a large water bond but was replaced by a smaller bond later designated as Proposition 1 in 2014." },
    { num: "44", year: 2014, title: "State Budget Stabilization Fund", category: "Taxes", status: "Passed", summary: "Revises the state's rainy day fund rules, requiring more deposits in good years and setting limits on withdrawals." },
    { num: "45", year: 2014, title: "Health Insurance Rate Approval", category: "Healthcare", status: "Rejected", summary: "Would have required the insurance commissioner's approval before health insurers could change many rates." },
    { num: "46", year: 2014, title: "Drug and Alcohol Testing of Doctors", category: "Healthcare", status: "Rejected", summary: "Would have required drug and alcohol testing of physicians and raised the cap on certain medical malpractice damages." },
    { num: "48", year: 2014, title: "Indian Gaming Compacts Referendum", category: "Economy/Business", status: "Rejected", summary: "Voters rejected ratifying specific tribal gaming compacts for a proposed off-reservation casino project." },
    // ── 2018 (browse-only extras) ──
    { num: "4", year: 2018, title: "Children's Hospitals Bond", category: "Healthcare", status: "Passed", summary: "Authorizes bonds to fund capital improvements at children's hospitals and certain other pediatric care facilities." },
    { num: "5", year: 2018, title: "Property Tax Rules for Senior Homeowners", category: "Taxes", status: "Rejected", summary: "Would have expanded property tax assessment transfers for certain homeowners who move to a new primary residence." },
    { num: "8", year: 2018, title: "Regulation of Dialysis Clinic Revenue", category: "Healthcare", status: "Rejected", summary: "Would have limited dialysis clinics' allowable revenue and required refunds or rate reductions if caps were exceeded." },
    { num: "11", year: 2018, title: "Ambulance Employees On-Call Breaks", category: "Labor", status: "Passed", summary: "Allows private ambulance employees to remain on call during breaks and sets some training and mental health standards." },
    { num: "12", year: 2018, title: "Farm Animal Confinement Standards", category: "Environment", status: "Passed", summary: "Sets minimum space requirements for farm animals and bans the sale of certain products from noncompliant facilities." },
    // ── 2004 (browse-only) ──
    { num: "51", year: 2004, title: "Traffic Congestion and Safe School Bus Act (Refinance)", category: "Transportation", status: "Rejected", summary: "Would have dedicated specified vehicle sales tax revenues to transportation projects, including congestion relief and school buses." },
    // ── 2008 (browse-only, initial batch) ──
    { num: "1", year: 2008, title: "High-Speed Rail Bond", category: "Transportation", status: "Passed", summary: "Authorizes bonds to fund planning and construction of a high-speed passenger rail system in California." },
    { num: "2", year: 2008, title: "Standards for Confining Farm Animals", category: "Environment", status: "Passed", summary: "Prohibits certain confinement practices for farm animals that prevent them from lying down, standing up, or turning around freely." },
    { num: "8", year: 2008, title: "Same-Sex Marriage Ban (2008)", category: "Government/Process", status: "Passed", summary: "Amends the state constitution to define marriage as only between one man and one woman, overruling court decisions." },
    { num: "11", year: 2008, title: "Citizens Redistricting Commission Creation", category: "Government/Process", status: "Passed", summary: "Creates a citizens commission to draw State Assembly and Senate district boundaries instead of the Legislature." },
    // ── 2000 (browse-only) ──
    { num: "12", year: 2000, title: "Safe Neighborhood Parks, Clean Water, Clean Air, and Coastal Protection Bond", category: "Environment", status: "Passed", summary: "Authorizes bonds to fund park improvements, natural habitat acquisition, clean water projects, and coastal protection programs." },
    { num: "13", year: 2000, title: "School Facilities Bond of 2000", category: "Education", status: "Passed", summary: "Authorizes bonds for construction and modernization of K–12 and higher education facilities across the state." },
    { num: "14", year: 2000, title: "Reading and Literacy Improvement and Public Library Construction Bond", category: "Education", status: "Passed", summary: "Issues bonds to build and renovate public libraries and support reading and literacy programs." },
    { num: "15", year: 2000, title: "Crime Laboratories Construction Bond Act", category: "Public Safety", status: "Rejected", summary: "Would have authorized bonds to construct and upgrade state and local criminalistics laboratories." },
    { num: "16", year: 2000, title: "Veterans Homes Bond Act of 2000", category: "Public Safety", status: "Passed", summary: "Authorizes bonds to fund construction and expansion of veterans homes providing long-term care services." },
    { num: "17", year: 2000, title: "Lotteries. Charitable Raffles", category: "Government/Process", status: "Passed", summary: "Allows qualified nonprofit organizations to conduct charitable raffles as fundraisers under specified conditions." },
    { num: "18", year: 2000, title: "Murder: Special Circumstances", category: "Criminal Justice", status: "Passed", summary: "Expands the list of special circumstances under which convicted murderers may receive the death penalty or life without parole." },
    { num: "19", year: 2000, title: "Murder. BART and CSU Peace Officers", category: "Criminal Justice", status: "Passed", summary: "Adds killing of Bay Area Rapid Transit and California State University peace officers to special circumstance murder provisions." },
    { num: "20", year: 2000, title: "California State Lottery. Allocation for Instructional Materials", category: "Education", status: "Passed", summary: "Adjusts lottery revenue distribution to provide additional funding for K–12 instructional materials." },
    { num: "21", year: 2000, title: "Juvenile Crime Initiative", category: "Criminal Justice", status: "Passed", summary: "Increases penalties for certain juvenile crimes and expands circumstances for trying juveniles as adults." },
    { num: "22", year: 2000, title: "Limit on Marriage (2000)", category: "Government/Process", status: "Passed", summary: "Defines marriage in state law as only between a man and a woman for purposes of California statutes." },
    { num: "23", year: 2000, title: "None of the Above on Ballots", category: "Government/Process", status: "Rejected", summary: "Would have added a nonbinding \u201cNone of the Above\u201d option to certain statewide election ballots." },
    { num: "34", year: 2000, title: "Campaign Finance Limits. Contributions and Spending", category: "Government/Process", status: "Passed", summary: "Sets limits on campaign contributions to state candidates and imposes disclosure and enforcement rules." },
    { num: "35", year: 2000, title: "Public Works Projects and Private Contractors", category: "Economy/Business", status: "Passed", summary: "Allows state and local governments to contract with private engineers and architects for public works projects." },
    { num: "36", year: 2000, title: "Drugs. Probation and Treatment Program", category: "Criminal Justice", status: "Passed", summary: "Requires probation and drug treatment, rather than incarceration, for many first and second-time nonviolent drug possession offenses." },
    { num: "37", year: 2000, title: "Fees. Vote Requirements. Taxes", category: "Taxes", status: "Rejected", summary: "Would have required voter approval for certain state and local fee increases treated similarly to taxes." },
    { num: "38", year: 2000, title: "School Vouchers Initiative", category: "Education", status: "Rejected", summary: "Would have created a state-funded voucher program for students to attend private and religious schools." },
    { num: "39", year: 2000, title: "School Facilities. 55% Local Vote", category: "Education", status: "Passed", summary: "Lowers the local vote threshold for most school bonds from two-thirds to 55% and adds accountability measures." },
    // ── 2002 (browse-only) ──
    { num: "40", year: 2002, title: "California Clean Water, Clean Air, Safe Neighborhood Parks, and Coastal Protection Act", category: "Environment", status: "Passed", summary: "Authorizes bonds for state and local park projects, clean water programs, and coastal and natural area protection." },
    { num: "41", year: 2002, title: "Voting Modernization Bond Act of 2002", category: "Voting Rights", status: "Passed", summary: "Issues bonds to help counties replace outdated voting systems with more modern, secure equipment." },
    { num: "42", year: 2002, title: "Transportation Funding from Gas Sales Tax", category: "Transportation", status: "Passed", summary: "Requires revenues from the state sales tax on gasoline to be used for transportation purposes, with limited exceptions." },
    { num: "43", year: 2002, title: "Right to Have Vote Counted", category: "Voting Rights", status: "Passed", summary: "Adds to the constitution that a lawfully cast vote in an election shall be counted." },
    { num: "44", year: 2002, title: "Chiropractors. Insurance Fraud", category: "Healthcare", status: "Passed", summary: "Requires revocation of a chiropractor's license for specified repeated insurance fraud or related offenses." },
    { num: "45", year: 2002, title: "Legislative Term Limits. Local Voter Petitions", category: "Government/Process", status: "Rejected", summary: "Would have allowed district voters to extend term limits for their state legislators through local petitions." },
    { num: "46", year: 2002, title: "Housing and Emergency Shelter Trust Fund Act", category: "Housing", status: "Passed", summary: "Authorizes bonds to finance affordable rental housing, homeownership assistance, and emergency shelters." },
    { num: "47", year: 2002, title: "Kindergarten\u2013University Public Education Facilities Bond Act", category: "Education", status: "Passed", summary: "Issues bonds for construction and renovation of K\u201312 schools and higher education facilities." },
    { num: "48", year: 2002, title: "Court Consolidation. Municipal Courts", category: "Government/Process", status: "Passed", summary: "Removes obsolete constitutional references to municipal courts that had been unified into superior courts." },
    { num: "49", year: 2002, title: "After School Education and Safety Program", category: "Education", status: "Passed", summary: "Increases state grants for before and after school programs and makes all public schools eligible for funding." },
    { num: "50", year: 2002, title: "Water Security, Clean Drinking Water, Coastal and Beach Protection Act", category: "Environment", status: "Passed", summary: "Authorizes bonds for water projects including safe drinking water, wetlands restoration, and coastal protection." },
    { num: "51", year: 2002, title: "Transportation Funds. Traffic Congestion Relief", category: "Transportation", status: "Rejected", summary: "Would have permanently redirected a portion of vehicle sales tax revenue to specified transportation projects." },
    { num: "52", year: 2002, title: "Election Day Voter Registration", category: "Voting Rights", status: "Rejected", summary: "Would have allowed eligible citizens to register and vote on Election Day at designated locations." },
    // ── 2004 (browse-only, extended) ──
    { num: "1A", year: 2004, title: "Protection of Local Government Revenues", category: "Government/Process", status: "Passed", summary: "Restricts the state's ability to reduce or shift local property tax and sales tax revenues." },
    { num: "59", year: 2004, title: "Public Records and Open Meetings", category: "Government/Process", status: "Passed", summary: "Establishes a constitutional right of public access to government records and meetings, with limited exceptions." },
    { num: "60", year: 2004, title: "Election Rights of Political Parties", category: "Voting Rights", status: "Passed", summary: "Guarantees political parties the right to have their candidates appear on the general election ballot after primaries." },
    { num: "60A", year: 2004, title: "Surplus State Property", category: "Economy/Business", status: "Passed", summary: "Requires proceeds from the sale of most surplus state property to be used to repay specified state bonds." },
    { num: "61", year: 2004, title: "Children's Hospital Projects Bond Act", category: "Healthcare", status: "Passed", summary: "Authorizes bonds to fund capital projects at children's hospitals and certain pediatric care facilities." },
    { num: "62", year: 2004, title: "Elections. Primaries", category: "Government/Process", status: "Rejected", summary: "Would have created a top-two primary system where all candidates run on one primary ballot." },
    { num: "63", year: 2004, title: "Mental Health Services Act", category: "Healthcare", status: "Passed", summary: "Imposes an additional tax on high incomes to fund expanded county mental health services and programs." },
    { num: "64", year: 2004, title: "Limits on Private Enforcement of Unfair Business Competition Laws", category: "Economy/Business", status: "Passed", summary: "Restricts who may file lawsuits under unfair competition laws and requires actual injury or loss." },
    { num: "66", year: 2004, title: "Limitations on Three Strikes Law", category: "Criminal Justice", status: "Rejected", summary: "Would have narrowed the types of felonies that could count as a third strike for life sentences." },
    { num: "67", year: 2004, title: "Emergency and Medical Services Funding. Telephone Surcharge", category: "Healthcare", status: "Rejected", summary: "Would have imposed a surcharge on telephone lines to fund emergency medical and 911 services." },
    { num: "68", year: 2004, title: "Tribal Gaming Compacts. Non-Tribal Gaming Expansion", category: "Economy/Business", status: "Rejected", summary: "Would have required tribes to accept amended gaming compacts or permitted expanded non-tribal gaming." },
    { num: "69", year: 2004, title: "DNA Samples. Collection and Database Expansion", category: "Public Safety", status: "Passed", summary: "Expands DNA collection to include all felons and some arrestees, building a larger state DNA database." },
    { num: "70", year: 2004, title: "Tribal Gaming Compacts. No Expiration", category: "Economy/Business", status: "Rejected", summary: "Would have granted certain tribes permanent gaming rights in exchange for specified revenue sharing." },
    { num: "71", year: 2004, title: "Stem Cell Research and Cures Act", category: "Healthcare", status: "Passed", summary: "Authorizes bonds to fund stem cell research and creates a state institute to oversee grants and standards." },
    { num: "72", year: 2004, title: "Health Care Coverage Requirements. Referendum", category: "Healthcare", status: "Rejected", summary: "Voters rejected a law that would have required some large and mid-size employers to provide health coverage or pay a fee." },
    // ── 2006 (browse-only) ──
    { num: "1B", year: 2006, title: "Highway Safety, Traffic Reduction, Air Quality, and Port Security Bond Act", category: "Transportation", status: "Passed", summary: "Authorizes bonds for state and local transportation improvements, goods movement, and related air quality projects." },
    { num: "1C", year: 2006, title: "Housing and Emergency Shelter Trust Fund Act of 2006", category: "Housing", status: "Passed", summary: "Issues bonds to fund affordable housing, infill incentives, and emergency shelters for low-income residents." },
    // ── 2005 (browse-only) ──
    { num: "73", year: 2005, title: "Parental Notification for Teen Abortion", category: "Government/Process", status: "Rejected", summary: "Would have required parental notification and waiting period before a minor could terminate pregnancy." },
    { num: "74", year: 2005, title: "Teacher Tenure and Evaluation Requirements", category: "Education", status: "Rejected", summary: "Would have extended teacher probationary period from two to five years and changed dismissal procedures." },
    { num: "75", year: 2005, title: "Paycheck Protection: Union Political Spending", category: "Labor", status: "Rejected", summary: "Would have required written employee consent before unions use dues for political contributions." },
    { num: "76", year: 2005, title: "State Spending Limits and School Funding Changes", category: "Taxes", status: "Rejected", summary: "Would have capped state spending and allowed suspension of Prop 98 school funding requirements." },
    { num: "77", year: 2005, title: "Redistricting by Retired Judges Commission", category: "Government/Process", status: "Rejected", summary: "Would have transferred redistricting power from Legislature to a panel of three retired judges." },
    { num: "78", year: 2005, title: "Prescription Drug Discount Program (Industry-Sponsored)", category: "Healthcare", status: "Rejected", summary: "Would have established a voluntary pharmaceutical industry-sponsored discount program for low-income Californians." },
    { num: "79", year: 2005, title: "Prescription Drug Discount Program (Consumer-Sponsored)", category: "Healthcare", status: "Rejected", summary: "Would have created a state-negotiated prescription drug discount program for uninsured and low-income residents." },
    { num: "80", year: 2005, title: "Electricity Utility Deregulation Reversal", category: "Economy/Business", status: "Rejected", summary: "Would have reversed electricity deregulation and restored utility rate regulation." },
    // ── 2006 (browse-only, continued) ──
    { num: "81", year: 2006, title: "Kindergarten-University Public Education Facilities Bond", category: "Education", status: "Passed", summary: "Authorizes bonds for construction and renovation of K\u201312 schools and higher education facilities." },
    { num: "82", year: 2006, title: "Universal Preschool Program and Tax on High Earners", category: "Education", status: "Rejected", summary: "Would have established free universal preschool funded by a 1.7% tax on incomes over $400,000." },
    { num: "83", year: 2006, title: "Jessica's Law: Sex Offender Requirements", category: "Criminal Justice", status: "Passed", summary: "Increases penalties and monitoring requirements for registered sex offenders with residency restrictions and notification rules." },
    { num: "84", year: 2006, title: "Clean Water, Clean Air, and Park Bonds", category: "Environment", status: "Passed", summary: "Authorizes bonds for clean water infrastructure, flood control, park improvements, and environmental restoration." },
    { num: "85", year: 2006, title: "Parental Notification for Teen Abortion (Second Attempt)", category: "Government/Process", status: "Rejected", summary: "Would have required parental notification and waiting period before a minor could obtain an abortion." },
    { num: "86", year: 2006, title: "Cigarette Tax Increase for Healthcare", category: "Taxes", status: "Rejected", summary: "Would have increased cigarette tax by $2.60 per pack to fund healthcare programs and research." },
    { num: "87", year: 2006, title: "Renewable Energy Funding Tax on Oil", category: "Environment", status: "Rejected", summary: "Would have imposed a tax on oil to fund alternative energy research and energy efficiency programs." },
    { num: "88", year: 2006, title: "Property Parcel Tax for Education Funding", category: "Taxes", status: "Rejected", summary: "Would have imposed a parcel tax to fund public schools with revenues directed to classroom instruction." },
    { num: "89", year: 2006, title: "Campaign Finance Restrictions and Corporate Tax", category: "Government/Process", status: "Rejected", summary: "Would have limited campaign contributions and spending, including a corporate tax to fund enforcement." },
    { num: "90", year: 2006, title: "Eminent Domain and Property Rights Protections", category: "Government/Process", status: "Rejected", summary: "Would have prohibited use of eminent domain for certain developments and restricted environmental law enforcement." },
    { num: "1E", year: 2006, title: "Disaster Preparedness and Flood Prevention Bond", category: "Environment", status: "Passed", summary: "Authorizes bonds for disaster preparedness, flood control, wildfire prevention, and emergency management infrastructure." },
    // ── 2008 (browse-only, continued) ──
    { num: "3", year: 2008, title: "Children's Hospital Bond", category: "Healthcare", status: "Passed", summary: "Authorizes $980 million in bonds for capital improvements at children's hospitals and pediatric facilities." },
    { num: "4", year: 2008, title: "Parental Notification for Teen Abortion", category: "Government/Process", status: "Rejected", summary: "Would have required parental notification before a minor could obtain an abortion." },
    { num: "5", year: 2008, title: "Nonviolent Drug Offender Sentencing and Rehabilitation", category: "Criminal Justice", status: "Rejected", summary: "Would have changed drug crime sentencing and increased funding for drug treatment and rehabilitation programs." },
    { num: "6", year: 2008, title: "Gang Violence Prevention and Law Enforcement Funding", category: "Public Safety", status: "Rejected", summary: "Would have funded gang prevention, increased law enforcement resources, and changed parole agent caseloads." },
    { num: "7", year: 2008, title: "Renewable Portfolio Standards for Electricity Providers", category: "Environment", status: "Rejected", summary: "Would have expanded California's renewable energy requirements and extended compliance deadlines." },
    { num: "10", year: 2008, title: "Alternative Fuel Vehicles and Infrastructure Bonds", category: "Environment", status: "Passed", summary: "Authorizes $5 billion in bonds for alternative fuel vehicle rebates, hydrogen fueling, and clean energy infrastructure." },
    { num: "12", year: 2008, title: "Veterans Housing and Homelessness Prevention Bond", category: "Housing", status: "Passed", summary: "Authorizes bonds to fund affordable housing and related services for California veterans." },
    { num: "91", year: 2008, title: "Gas Tax Revenues Dedication for Transportation", category: "Transportation", status: "Rejected", summary: "Would have prohibited state use of gas tax revenues for non-transportation purposes." },
    { num: "92", year: 2008, title: "Community College Funding and Independence", category: "Education", status: "Rejected", summary: "Would have reduced community college student fees and created independent college governance structures." },
    { num: "94", year: 2008, title: "Tribal Gaming Expansion Referendum", category: "Economy/Business", status: "Passed", summary: "Approves amendments to tribal gaming compacts allowing expansion of on-reservation gaming operations." },
    { num: "96", year: 2008, title: "Renewable Portfolio Standards and Time Extension", category: "Environment", status: "Rejected", summary: "Would have extended deadlines for California's renewable portfolio standard energy requirements." },
    { num: "97", year: 2008, title: "Emissions Performance Standards for Electricity", category: "Environment", status: "Passed", summary: "Requires electricity providers to limit emissions through clean energy procurement and efficiency standards." },
    { num: "98", year: 2008, title: "Eminent Domain Restrictions and Rent Control Prohibition", category: "Government/Process", status: "Rejected", summary: "Would have prohibited rent control and restricted government power to take private property for development." },
    // ── 2009 (browse-only) ──
    { num: "1A", year: 2009, title: "Budget Stabilization Fund and Tax Extensions", category: "Taxes", status: "Rejected", summary: "Would have extended temporary tax increases and established spending caps to address state budget deficit." },
    { num: "1B", year: 2009, title: "Supplemental Education Funding and Prop 98 Modification", category: "Education", status: "Rejected", summary: "Would have provided supplemental K\u201314 education funding if Proposition 1A passed during the budget crisis." },
    { num: "1C", year: 2009, title: "Lottery Revenue Borrowing for State Budget", category: "Economy/Business", status: "Rejected", summary: "Would have allowed state to borrow against future lottery proceeds to address immediate budget shortfalls." },
    { num: "1D", year: 2009, title: "Children and Families First Fund Redirection", category: "Healthcare", status: "Rejected", summary: "Would have redirected Prop 10 early childhood funding to general fund during the budget crisis." },
    { num: "1E", year: 2009, title: "Mental Health Services Act Fund Redirection", category: "Healthcare", status: "Rejected", summary: "Would have temporarily redirected Prop 63 mental health funding to general fund during budget deficit." },
    { num: "1F", year: 2009, title: "No Salary Increases for State Officials During Deficits", category: "Government/Process", status: "Passed", summary: "Prohibits pay raises for state legislators and executive officials in years with state budget deficits." },
    // ── 2025 / 2026 (browse-only) ──
    { num: "50", year: 2025, title: "Congressional Redistricting Response to Texas Actions", category: "Government/Process", status: "Passed", summary: "Creates temporary congressional redistricting authority in response to 2025 Texas redistricting, effective through 2030." },
    { num: "3", year: 2026, title: "Initiative Vote Threshold Amendment", category: "Government/Process", status: "Active", summary: "Proposed constitutional amendment to increase supermajority vote requirements for certain voter initiatives." },
    { num: "4", year: 2026, title: "Successor Elections Amendment for State Officers", category: "Government/Process", status: "Active", summary: "Proposed amendment to eliminate successor elections for state constitutional officers." },
    // ── 2003 (browse-only) ──
    { num: "53", year: 2003, title: "Funds Dedicated for State and Local Infrastructure", category: "Government/Process", status: "Rejected", summary: "Would have required 3% of General Fund revenues annually to be dedicated to state and local infrastructure projects." },
    { num: "54", year: 2003, title: "Prohibition of Government Classification by Race, Ethnicity, Color, or National Origin", category: "Government/Process", status: "Rejected", summary: "Would have prohibited state and local governments from classifying people by race, ethnicity, color, or national origin in education, contracting, and employment." },
    // ── 2008 (browse-only, additional) ──
    { num: "93", year: 2008, title: "Legislative Term Limits Modification", category: "Government/Process", status: "Rejected", summary: "Would have limited state legislators to a maximum of 12 years in office regardless of which chamber they served in." },
    { num: "95", year: 2008, title: "Morongo Band of Mission Indians Gaming Amendment", category: "Economy/Business", status: "Passed", summary: "Approved amendments to the gaming compact with the Morongo Band allowing expansion of tribal gaming operations and slot machines." },
    { num: "99", year: 2008, title: "Eminent Domain Limitation on Owner-Occupied Residences", category: "Government/Process", status: "Passed", summary: "Prohibits state and local governments from using eminent domain to take owner-occupied residences for private development with specified exceptions." },
];

export const federalBills: FederalBillData[] = [
    { id: "118:hr:4369", type: "Federal", title: "Consolidated Appropriations Act, 2024", category: "Government/Process", status: "Enacted", summary: "Annual federal spending legislation funding government operations and agencies.", href: "/measure/live?source=congress&id=118:hr:4369" },
    { id: "117:hr:5376", type: "Federal", title: "Inflation Reduction Act of 2022", category: "Taxes", status: "Enacted", summary: "Climate, healthcare, and tax provisions including Medicare drug negotiation and $369B in clean energy incentives.", href: "/measure/live?source=congress&id=117:hr:5376" },
    { id: "117:hr:1319", type: "Federal", title: "American Rescue Plan Act of 2021", category: "Healthcare", status: "Enacted", summary: "COVID-19 relief: $1,400 stimulus checks, extended unemployment, child tax credit expansion, and state/local aid.", href: "/measure/live?source=congress&id=117:hr:1319" },
    { id: "117:hr:3684", type: "Federal", title: "Infrastructure Investment and Jobs Act", category: "Transportation", status: "Enacted", summary: "$1.2 trillion for roads, bridges, rail, broadband, water systems, and electric vehicle charging.", href: "/measure/live?source=congress&id=117:hr:3684" },
    { id: "117:hr:4346", type: "Federal", title: "CHIPS and Science Act of 2022", category: "Technology/Privacy", status: "Enacted", summary: "$280B to boost domestic semiconductor manufacturing, scientific research, and tech competitiveness.", href: "/measure/live?source=congress&id=117:hr:4346" },
    { id: "117:hr:2471", type: "Federal", title: "Consolidated Appropriations Act, 2022", category: "Government/Process", status: "Enacted", summary: "FY2022 omnibus spending bill including $13.6B in Ukraine aid and Violence Against Women Act reauthorization.", href: "/measure/live?source=congress&id=117:hr:2471" },
    { id: "117:s:2938", type: "Federal", title: "Bipartisan Safer Communities Act", category: "Public Safety", status: "Enacted", summary: "First major federal gun safety law in decades: enhanced background checks for under-21 buyers, red flag law incentives.", href: "/measure/live?source=congress&id=117:s:2938" },
    { id: "117:hr:8404", type: "Federal", title: "Respect for Marriage Act", category: "Civil Rights", status: "Enacted", summary: "Codifies federal recognition of same-sex and interracial marriages; requires interstate recognition.", href: "/measure/live?source=congress&id=117:hr:8404" },
    { id: "117:s:3373", type: "Federal", title: "PACT Act of 2022", category: "Healthcare", status: "Enacted", summary: "Expands VA healthcare for veterans exposed to burn pits and toxic substances during military service.", href: "/measure/live?source=congress&id=117:s:3373" },
    { id: "117:hr:5746", type: "Federal", title: "Electoral Count Reform Act", category: "Voting Rights", status: "Enacted", summary: "Reforms the Electoral Count Act to clarify the VP's ceremonial role and raise objection thresholds.", href: "/measure/live?source=congress&id=117:hr:5746" },
    { id: "111:hr:3590", type: "Federal", title: "Affordable Care Act (ACA)", category: "Healthcare", status: "Enacted", summary: "Comprehensive healthcare reform: insurance exchanges, Medicaid expansion, pre-existing condition protections.", href: "/measure/live?source=congress&id=111:hr:3590" },
    { id: "111:s:1789", type: "Federal", title: "Fair Sentencing Act of 2010", category: "Criminal Justice", status: "Enacted", summary: "Reduced the 100:1 sentencing disparity between crack and powder cocaine to 18:1.", href: "/measure/live?source=congress&id=111:s:1789" },
    { id: "116:hr:748", type: "Federal", title: "CARES Act", category: "Economy/Business", status: "Enacted", summary: "$2.2 trillion COVID-19 stimulus: PPP loans, $1,200 direct payments, enhanced unemployment insurance.", href: "/measure/live?source=congress&id=116:hr:748" },
    { id: "115:hr:1", type: "Federal", title: "Tax Cuts and Jobs Act of 2017", category: "Taxes", status: "Enacted", summary: "Major tax overhaul: reduced corporate rate to 21%, individual rate changes, SALT deduction cap at $10K.", href: "/measure/live?source=congress&id=115:hr:1" },
    { id: "111:hr:4173", type: "Federal", title: "Dodd-Frank Wall Street Reform Act", category: "Economy/Business", status: "Enacted", summary: "Post-2008 financial regulation: created CFPB, Volcker Rule, derivatives oversight, stress testing.", href: "/measure/live?source=congress&id=111:hr:4173" },
    { id: "107:hr:3162", type: "Federal", title: "USA PATRIOT Act", category: "Public Safety", status: "Enacted", summary: "Post-9/11 surveillance and anti-terrorism law: expanded wiretapping, financial tracking, and agency cooperation.", href: "/measure/live?source=congress&id=107:hr:3162" },
];

export const CATEGORIES = ["All", "Civil Rights", "Criminal Justice", "Economy/Business", "Education", "Environment", "Government/Process", "Healthcare", "Housing", "Labor", "Public Safety", "Taxes", "Technology/Privacy", "Transportation", "Voting Rights"];

export const STATUSES = ["All", "Active", "Passed", "Rejected"];
