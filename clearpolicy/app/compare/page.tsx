"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

// Same proposition data - in real app would come from API/shared data
const propositions = [
    {
        num: "1", year: 2024, title: "Behavioral Health Services Program and Bond Measure", category: "Healthcare", status: "Passed",
        tldr: "Renames the Mental Health Services Act, redirects some existing tax revenue, and authorizes bonds for housing and services for people with behavioral health needs.",
        pros: ["Expands funding for behavioral health services", "Supports housing and treatment infrastructure", "Continues dedicated revenue source"],
        cons: ["Redirects existing revenue away from current programs", "Adds long-term bond costs", "Implementation details may be complex"]
    },
    {
        num: "2", year: 2024, title: "Public School and Community College Facilities Bond", category: "Education", status: "Passed",
        tldr: "Authorizes state bonds to fund construction and modernization of K–12 schools and community college facilities.",
        pros: ["Funds upgrades and repairs", "Supports capacity needs", "Improves learning environments"],
        cons: ["Adds state debt", "Allocation may favor some districts", "Ongoing maintenance costs remain"]
    },
    {
        num: "3", year: 2024, title: "Right to Marry Amendment", category: "Civil Rights", status: "Passed",
        tldr: "Repeals outdated language and explicitly protects the right to marry regardless of the genders of the parties.",
        pros: ["Clarifies constitutional protections", "Aligns with federal law", "Protects marriage equality"],
        cons: ["Limited practical change", "Amendment process cost", "Opponents cite constitutional minimalism"]
    },
    {
        num: "4", year: 2024, title: "Parks, Environment, and Water Infrastructure Bond", category: "Environment", status: "Passed",
        tldr: "Authorizes $10 billion in bonds for parks, environmental projects, water infrastructure, energy, and flood protection.",
        pros: ["Invests in climate resilience", "Funds water and park projects", "Supports local infrastructure upgrades"],
        cons: ["Adds long-term debt costs", "Project allocation debates", "Bond repayments reduce budget flexibility"]
    },
    {
        num: "5", year: 2024, title: "Lower Vote Threshold for Local Housing and Infrastructure Bonds", category: "Housing", status: "Rejected",
        tldr: "Would have lowered the local vote threshold from two-thirds to 55% for certain affordable housing and infrastructure bond measures.",
        pros: ["Makes local bonds easier to pass", "Could accelerate housing projects", "Increases local flexibility"],
        cons: ["Lowers voter approval threshold", "Potentially increases local debt", "Project oversight concerns"]
    },
    {
        num: "6", year: 2024, title: "End Involuntary Servitude for Incarcerated Persons", category: "Criminal Justice", status: "Passed",
        tldr: "Removes language allowing involuntary servitude as criminal punishment from the state constitution.",
        pros: ["Aligns constitution with modern standards", "Clarifies protections for incarcerated people", "Symbolic civil rights change"],
        cons: ["Limited immediate policy change", "Implementation may need legislation", "Potential legal uncertainty"]
    },
    {
        num: "32", year: 2024, title: "Raise Minimum Wage to $18", category: "Labor", status: "Rejected",
        tldr: "Would have increased California’s statewide minimum wage to $18 per hour, with phased implementation.",
        pros: ["Boosts wages for low-income workers", "Could reduce wage inequality", "Increases consumer spending power"],
        cons: ["May increase labor costs", "Could reduce hiring", "Potential price increases"]
    },
    {
        num: "33", year: 2024, title: "Expand Local Rent Control Authority", category: "Housing", status: "Rejected",
        tldr: "Would have repealed parts of the Costa-Hawkins Act to let cities expand rent control on more residential properties.",
        pros: ["Allows broader rent stabilization", "Increases local policy control", "Could slow rent growth"],
        cons: ["Potentially reduces housing supply", "Impacts property owners", "May shift costs elsewhere"]
    },
    {
        num: "34", year: 2024, title: "Prescription Drug Revenue Restrictions", category: "Healthcare", status: "Rejected",
        tldr: "Would have restricted how certain health care providers spend revenue from prescription drugs.",
        pros: ["Increases transparency in drug revenue use", "Prioritizes patient care spending", "May curb profit-taking"],
        cons: ["Limits operational flexibility", "Could reduce services", "Regulatory complexity"]
    },
    {
        num: "35", year: 2024, title: "Permanent Funding for Medi-Cal Services", category: "Healthcare", status: "Passed",
        tldr: "Permanently authorizes a managed care organization tax to fund Medi-Cal and related health care programs.",
        pros: ["Stabilizes Medi-Cal funding", "Maintains existing revenue stream", "Supports health coverage"],
        cons: ["Locks in tax structure", "Complex financing mechanism", "May affect plan costs"]
    },
    {
        num: "36", year: 2024, title: "Felony Charges for Certain Drug and Theft Crimes", category: "Criminal Justice", status: "Rejected",
        tldr: "Would have allowed more felony charges and longer sentences for some drug and theft offenses and expanded treatment requirements.",
        pros: ["Targets repeat offenses", "Expands treatment requirements", "Addresses retail theft concerns"],
        cons: ["May increase incarceration costs", "Could reverse reforms", "Disproportionate impacts"]
    },
    {
        num: "13", year: 2020, title: "School and College Facilities Bond", category: "Education", status: "Rejected",
        tldr: "Would have authorized $15 billion in state bonds for construction and modernization of public schools and higher education facilities.",
        pros: ["Funds facility upgrades", "Supports school capacity needs", "Improves campus safety"],
        cons: ["Adds state debt", "Allocation concerns", "Ongoing maintenance costs"]
    },
    {
        num: "14", year: 2020, title: "Stem Cell Research Institute Bond", category: "Healthcare", status: "Passed",
        tldr: "Authorizes $5.5 billion in bonds to continue funding the state’s stem cell research and medical treatments agency.",
        pros: ["Supports biomedical research", "Funds medical innovation", "Maintains research infrastructure"],
        cons: ["Adds state debt", "Research outcomes uncertain", "Long-term funding commitments"]
    },
    {
        num: "15", year: 2020, title: "Tax on Commercial and Industrial Properties for Education and Local Government", category: "Taxes", status: "Rejected",
        tldr: "Would have taxed most large commercial and industrial properties on market value, directing new revenue to schools and local governments.",
        pros: ["Raises revenue for schools", "Targets large properties", "Reduces reliance on other taxes"],
        cons: ["Potential rent pass-through", "Complex reassessment rules", "Business opposition"]
    },
    {
        num: "16", year: 2020, title: "Repeal of Ban on Affirmative Action", category: "Education", status: "Rejected",
        tldr: "Would have allowed state and local governments to consider race, sex, color, ethnicity, or national origin in public programs.",
        pros: ["Increases flexibility in admissions and hiring", "May improve diversity", "Aligns with federal policies"],
        cons: ["Contested fairness concerns", "Potential legal challenges", "Polarizing policy change"]
    },
    {
        num: "17", year: 2020, title: "Voting Rights for People on Parole", category: "Voting Rights", status: "Passed",
        tldr: "Restores the right to vote to people with felony convictions who have completed prison but remain on state parole.",
        pros: ["Promotes civic reintegration", "Expands voting access", "Aligns with rehabilitation goals"],
        cons: ["Administrative changes required", "Some oppose expansion", "Implementation complexity"]
    },
    {
        num: "18", year: 2020, title: "Primary Voting for 17-Year-Olds", category: "Voting Rights", status: "Rejected",
        tldr: "Would have allowed 17-year-olds to vote in primaries and special elections if they turn 18 by the next general election.",
        pros: ["Expands youth participation", "Aligns primary eligibility", "Encourages civic engagement"],
        cons: ["Concerns about readiness", "Administrative updates", "Limited scope"]
    },
    {
        num: "19", year: 2020, title: "Property Tax Transfers and Inheritance Rules", category: "Taxes", status: "Passed",
        tldr: "Changes rules for transferring property tax assessments for some homeowners and narrows tax breaks on inherited property.",
        pros: ["Enables senior mobility", "Targets inherited property benefits", "Increases revenue potential"],
        cons: ["Complex eligibility rules", "Potentially higher taxes for heirs", "Administrative burden"]
    },
    {
        num: "20", year: 2020, title: "Criminal Sentencing, Parole, and DNA Collection", category: "Criminal Justice", status: "Rejected",
        tldr: "Would have increased penalties for certain theft crimes, limited parole, and expanded DNA collection from some offenses.",
        pros: ["Tougher penalties for theft", "Expands DNA database", "Addresses repeat crime concerns"],
        cons: ["Higher incarceration costs", "Civil liberties concerns", "Reduces parole flexibility"]
    },
    {
        num: "21", year: 2020, title: "Local Rent Control Initiative", category: "Housing", status: "Rejected",
        tldr: "Would have allowed cities to adopt rent control on more older rental properties while preserving some landlord exemptions.",
        pros: ["Expands rent control options", "Local flexibility", "Potential tenant protections"],
        cons: ["Housing supply concerns", "Property owner impacts", "Potential investment slowdown"]
    },
    {
        num: "22", year: 2020, title: "App-Based Drivers as Independent Contractors", category: "Labor", status: "Passed",
        tldr: "Classifies app-based transportation and delivery drivers as independent contractors, with some required benefits and protections.",
        pros: ["Maintains flexible work model", "Provides some benefits", "Clarifies classification"],
        cons: ["Limits full employee protections", "Worker security concerns", "Sets precedent for gig work"]
    },
    {
        num: "23", year: 2020, title: "Dialysis Clinic Requirements", category: "Healthcare", status: "Rejected",
        tldr: "Would have required on-site physicians at dialysis clinics and state approval before clinics could close or reduce services.",
        pros: ["Increases clinic oversight", "Potential safety improvements", "Limits sudden closures"],
        cons: ["Higher operational costs", "May reduce clinic availability", "Regulatory burden"]
    },
    {
        num: "24", year: 2020, title: "California Privacy Rights Act", category: "Technology/Privacy", status: "Passed",
        tldr: "Expands consumer data privacy rights, creates a new state privacy agency, and tightens rules on businesses’ use of personal information.",
        pros: ["Strengthens privacy rights", "Creates enforcement agency", "Limits data sharing"],
        cons: ["Compliance costs for businesses", "Complex enforcement", "Potential impact on innovation"]
    },
    {
        num: "25", year: 2020, title: "Replace Cash Bail with Risk Assessments Referendum", category: "Criminal Justice", status: "Rejected",
        tldr: "Upholds a law’s repeal, preventing replacement of cash bail with pretrial risk assessment for most criminal cases.",
        pros: ["Maintains current cash bail system", "Avoids new risk assessment model", "Clarity for courts"],
        cons: ["Does not address bail inequities", "Keeps financial barriers", "Missed reform opportunity"]
    },
    {
        num: "26", year: 2022, title: "In-Person Tribal Sports Betting", category: "Economy/Business", status: "Rejected",
        tldr: "Would have allowed in-person sports betting at tribal casinos and certain racetracks and changed related gaming rules.",
        pros: ["Potential new revenue", "Expands gaming options", "Supports tribal casinos"],
        cons: ["Opposition from some tribes", "Regulatory complexity", "Gambling concerns"]
    },
    {
        num: "27", year: 2022, title: "Online Sports Betting Initiative", category: "Economy/Business", status: "Rejected",
        tldr: "Would have legalized online sports betting statewide for approved operators subject to taxes and regulations.",
        pros: ["New tax revenue", "Convenient access", "Regulated market"],
        cons: ["Gambling addiction concerns", "Market competition issues", "Regulatory oversight needs"]
    },
    {
        num: "28", year: 2022, title: "Arts and Music School Funding", category: "Education", status: "Passed",
        tldr: "Requires the state to provide additional funding for arts and music education in K–12 public schools.",
        pros: ["Expands arts education", "Dedicated funding stream", "Supports student enrichment"],
        cons: ["Budget constraints", "Allocation disputes", "Implementation complexity"]
    },
    {
        num: "29", year: 2022, title: "Dialysis Clinic Staffing and Requirements", category: "Healthcare", status: "Rejected",
        tldr: "Would have required a physician or other clinician on site at dialysis clinics and new reporting rules.",
        pros: ["Potential safety improvements", "Increases oversight", "Standardizes reporting"],
        cons: ["Higher clinic costs", "May reduce availability", "Regulatory burden"]
    },
    {
        num: "30", year: 2022, title: "Tax on High-Income Earners for Climate Programs", category: "Environment", status: "Rejected",
        tldr: "Would have increased income taxes on very high earners to fund electric vehicle incentives and wildfire programs.",
        pros: ["Funds climate programs", "Targets high earners", "Supports wildfire mitigation"],
        cons: ["Tax volatility risk", "Opposition from taxpayers", "Revenue allocation disputes"]
    },
    {
        num: "31", year: 2022, title: "Ban on Flavored Tobacco Products Referendum", category: "Public Safety", status: "Passed",
        tldr: "Upholds a state law banning the retail sale of most flavored tobacco products and flavor enhancers.",
        pros: ["Reduces youth smoking risks", "Supports public health", "Clarifies retail rules"],
        cons: ["Impact on small retailers", "Enforcement challenges", "Black market concerns"]
    },
    {
        num: "6", year: 2018, title: "Repeal Gas and Diesel Tax Increases", category: "Transportation", status: "Rejected",
        tldr: "Would have repealed recent fuel and vehicle taxes and required voter approval for future fuel and vehicle fee increases.",
        pros: ["Reduces fuel tax burden", "Requires voter approval for increases", "Supports drivers"],
        cons: ["Cuts transportation funding", "Delays infrastructure projects", "Budget uncertainty"]
    },
    {
        num: "7", year: 2018, title: "Daylight Saving Time Amendment", category: "Government/Process", status: "Passed",
        tldr: "Authorizes the Legislature to change daylight saving time law if federal law allows, potentially ending seasonal clock changes.",
        pros: ["Allows time change flexibility", "Potentially ends clock changes", "Responds to public preference"],
        cons: ["Requires federal approval", "Implementation uncertainty", "Limited immediate change"]
    },
    {
        num: "10", year: 2018, title: "Expand Local Rent Control (2018)", category: "Housing", status: "Rejected",
        tldr: "Would have repealed limits on local residential rent control set by the Costa-Hawkins Rental Housing Act.",
        pros: ["Expands local rent control", "Local policy control", "Potential tenant protections"],
        cons: ["Concerns about housing supply", "Property owner impacts", "Investment uncertainty"]
    },
    {
        num: "51", year: 2016, title: "School Bonds for K–12 and Community Colleges", category: "Education", status: "Passed",
        tldr: "Authorizes $9 billion in bonds for construction and modernization of K–12 school and community college facilities.",
        pros: ["Funds facility upgrades", "Supports school capacity", "Improves learning environments"],
        cons: ["Adds state debt", "Allocation concerns", "Ongoing maintenance costs"]
    },
    {
        num: "52", year: 2016, title: "State Fees on Hospitals Amendment", category: "Healthcare", status: "Passed",
        tldr: "Requires voter approval to change or end the hospital quality assurance fee that helps fund Medi-Cal.",
        pros: ["Protects Medi-Cal funding stream", "Maintains hospital fee structure", "Requires voter oversight"],
        cons: ["Limits legislative flexibility", "Complex fiscal impacts", "Potential funding rigidity"]
    },
    {
        num: "53", year: 2016, title: "Voter Approval for Large State Projects", category: "Government/Process", status: "Rejected",
        tldr: "Would have required statewide voter approval for certain state revenue bond projects costing more than $2 billion.",
        pros: ["Adds voter oversight", "Controls large debt projects", "Increases transparency"],
        cons: ["May delay infrastructure", "Reduced legislative flexibility", "One-size threshold issues"]
    },
    {
        num: "54", year: 2016, title: "Legislative Transparency Initiative", category: "Government/Process", status: "Passed",
        tldr: "Requires bills to be posted online for 72 hours before a vote and allows recording and posting of legislative proceedings.",
        pros: ["Improves transparency", "Increases public access", "Supports accountability"],
        cons: ["May slow legislative process", "Implementation costs", "Potential for delays"]
    },
    {
        num: "55", year: 2016, title: "Extension of Income Tax on High Earners", category: "Taxes", status: "Passed",
        tldr: "Extends higher personal income tax rates on high-income earners to fund education and some health care programs.",
        pros: ["Funds education programs", "Targets high incomes", "Maintains existing rates"],
        cons: ["Revenue volatility", "Taxpayer opposition", "Economic competitiveness concerns"]
    },
    {
        num: "56", year: 2016, title: "Tobacco and E-Cigarette Tax Increase", category: "Healthcare", status: "Passed",
        tldr: "Increases the cigarette tax by $2 per pack and raises taxes on other tobacco products and e-cigarettes.",
        pros: ["Reduces smoking rates", "Funds health programs", "Raises public health revenue"],
        cons: ["Regressive tax impact", "Smuggling risks", "Industry opposition"]
    },
    {
        num: "57", year: 2016, title: "Parole for Nonviolent Criminals and Juvenile Trial Rules", category: "Criminal Justice", status: "Passed",
        tldr: "Expands parole consideration for some nonviolent offenders and changes how juveniles can be tried in adult court.",
        pros: ["Supports rehabilitation", "Reduces incarceration rates", "Adjusts juvenile justice rules"],
        cons: ["Public safety concerns", "Parole process complexity", "Opposition from some victims groups"]
    },
    {
        num: "58", year: 2016, title: "English Proficiency and Multilingual Education", category: "Education", status: "Passed",
        tldr: "Modifies rules on English-only instruction to allow more bilingual and multilingual programs in public schools.",
        pros: ["Expands multilingual options", "Supports English learners", "Local flexibility"],
        cons: ["Implementation variability", "Resource needs", "Outcome concerns"]
    },
    {
        num: "59", year: 2016, title: "Advisory Question on Citizens United", category: "Government/Process", status: "Passed",
        tldr: "Advises state officials to work toward overturning the Citizens United campaign finance decision.",
        pros: ["Signals voter sentiment", "Supports campaign finance reform", "Low implementation cost"],
        cons: ["Nonbinding effect", "Symbolic measure", "Limited policy change"]
    },
    {
        num: "60", year: 2016, title: "Condoms in Adult Films", category: "Public Safety", status: "Rejected",
        tldr: "Would have required performers in adult films to use condoms and imposed related health and reporting rules.",
        pros: ["Aims to improve worker safety", "Health reporting requirements", "Clear industry rules"],
        cons: ["Enforcement challenges", "Industry opposition", "Potential legal challenges"]
    },
    {
        num: "61", year: 2016, title: "State Prescription Drug Purchases Pricing Standards", category: "Healthcare", status: "Rejected",
        tldr: "Would have limited what the state pays for prescription drugs to prices paid by the U.S. Department of Veterans Affairs.",
        pros: ["May reduce drug costs", "Uses benchmark pricing", "Potential savings"],
        cons: ["Implementation complexity", "Potential access impacts", "Legal challenges"]
    },
    {
        num: "62", year: 2016, title: "Repeal of the Death Penalty", category: "Criminal Justice", status: "Rejected",
        tldr: "Would have repealed the death penalty and replaced it with life imprisonment without the possibility of parole.",
        pros: ["Eliminates death penalty", "Reduces appeals costs", "Avoids wrongful execution risk"],
        cons: ["Opposition from some voters", "Impact on deterrence debate", "Policy change controversy"]
    },
    {
        num: "63", year: 2016, title: "Background Checks for Ammunition Sales", category: "Public Safety", status: "Passed",
        tldr: "Requires background checks for ammunition purchases and restricts large-capacity ammunition magazines.",
        pros: ["Strengthens gun safety rules", "Limits high-capacity magazines", "Adds purchase screening"],
        cons: ["Enforcement costs", "Opposition from gun rights groups", "Potential legal challenges"]
    },
    {
        num: "64", year: 2016, title: "Marijuana Legalization", category: "Criminal Justice", status: "Passed",
        tldr: "Legalizes recreational marijuana for adults, establishes taxation, and sets rules for cultivation and sale.",
        pros: ["Creates regulated market", "Generates tax revenue", "Reduces criminal penalties"],
        cons: ["Public health concerns", "Impaired driving risks", "Regulatory complexity"]
    },
    {
        num: "65", year: 2016, title: "Carryout Bag Charges", category: "Environment", status: "Rejected",
        tldr: "Would have directed money from certain carryout bag charges to a state environmental fund instead of retailers.",
        pros: ["Funds environmental programs", "Reduces plastic use", "Standardizes fee handling"],
        cons: ["Cost to consumers", "Retailer opposition", "Administrative complexity"]
    },
    {
        num: "66", year: 2016, title: "Death Penalty Procedures", category: "Criminal Justice", status: "Passed",
        tldr: "Changes procedures to speed up death penalty appeals and modifications to legal challenges.",
        pros: ["Speeds appeals process", "Clarifies procedures", "Responds to backlog concerns"],
        cons: ["Increases risk of errors", "Civil rights concerns", "Legal challenges likely"]
    },
    {
        num: "67", year: 2016, title: "Ban on Single-Use Plastic Bags", category: "Environment", status: "Passed",
        tldr: "Upholds a statewide ban on single-use plastic carryout bags and allows certain reusable bag charges.",
        pros: ["Reduces plastic waste", "Supports environmental goals", "Clear statewide standard"],
        cons: ["Costs for consumers", "Retail transition costs", "Equity concerns"]
    },
];

export default function ComparePage() {
    const [selectedProps, setSelectedProps] = useState<string[]>(["47", "36"]);
    const [showSelector, setShowSelector] = useState<number | null>(null);

    const selectedData = useMemo(() => {
        return selectedProps.map(num => propositions.find(p => p.num === num)).filter(Boolean);
    }, [selectedProps]);

    const handleSelectProp = (index: number, num: string) => {
        const newSelection = [...selectedProps];
        newSelection[index] = num;
        setSelectedProps(newSelection);
        setShowSelector(null);
    };

    const addSlot = () => {
        if (selectedProps.length < 3) {
            setSelectedProps([...selectedProps, ""]);
        }
    };

    const removeSlot = (index: number) => {
        if (selectedProps.length > 2) {
            setSelectedProps(selectedProps.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-10 animate-fade-in" style={{ paddingTop: "var(--space-xl)", paddingBottom: "var(--space-3xl)" }}>
            <div className="space-y-3">
                <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-[var(--cp-text)]">
                    Compare Propositions
                </h1>
                <p className="text-lg text-[var(--cp-muted)] leading-relaxed">
                    View side-by-side comparisons of ballot measures.
                </p>
            </div>

            {/* Slot selectors */}
            <Card className="space-y-3 relative z-30">
                <div className="flex flex-wrap items-center gap-3">
                    {selectedProps.map((num, index) => (
                        <div key={index} className="relative">
                            <Button
                                variant="secondary"
                                onClick={() => setShowSelector(showSelector === index ? null : index)}
                                className="w-44 justify-between"
                            >
                                <span className="text-accent font-semibold">
                                    {num ? `Prop ${num}` : "Select..."}
                                </span>
                                <svg className="w-4 h-4 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Button>

                            {selectedProps.length > 2 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-rose-500 hover:bg-rose-500/10"
                                    onClick={() => removeSlot(index)}
                                    aria-label="Remove"
                                >
                                    ×
                                </Button>
                            )}

                            {/* Dropdown */}
                            {showSelector === index && (
                                <div className="absolute top-full mt-2 left-0 z-50 w-64 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-doc)] p-2 shadow-soft max-h-64 overflow-y-auto">
                                    {propositions.map(p => (
                                        <button
                                            key={p.num}
                                            onClick={() => handleSelectProp(index, p.num)}
                                            disabled={selectedProps.includes(p.num) && selectedProps[index] !== p.num}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedProps.includes(p.num) && selectedProps[index] !== p.num
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-[var(--cp-surface-2)]'
                                                } ${selectedProps[index] === p.num ? 'bg-[var(--cp-surface-2)]' : ''}`}
                                        >
                                            <span className="font-medium text-[var(--cp-text)]">Prop {p.num}</span>
                                            <span className="ml-2 text-xs text-[var(--cp-muted)]">({p.year})</span>
                                            <div className="text-xs text-[var(--cp-muted)] line-clamp-1 mt-0.5">
                                                {p.title}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {selectedProps.length < 3 && (
                        <Button
                            variant="ghost"
                            onClick={addSlot}
                            className="border-2 border-dashed border-[var(--cp-border)] text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
                        >
                            + Add
                        </Button>
                    )}
                </div>
            </Card>

            {/* Comparison Table - Desktop */}
            <Card className="hidden md:block overflow-x-auto relative z-10">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--cp-border)]">
                            <th className="text-left py-3 px-4 text-[var(--cp-muted)] font-medium w-32">Aspect</th>
                            {selectedData.map((prop: any) => (
                                <th key={prop.num} className="text-left py-3 px-4">
                                    <Link href={`/measure/prop/${prop.num}`} className="hover:text-accent transition-colors">
                                        <span className="text-xl font-bold text-accent">Prop {prop.num}</span>
                                        <span className="ml-2 text-xs text-[var(--cp-muted)]">({prop.year})</span>
                                    </Link>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium">Title</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4 text-sm text-[var(--cp-text)]">
                                    {prop.title}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium">Category</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <span className="text-xs px-2 py-1 bg-[var(--cp-surface-2)] rounded-md text-[var(--cp-muted)]">
                                        {prop.category}
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium">Status</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <Badge variant={prop.status === "Active" ? "supported" : prop.status === "Passed" ? "official" : "analysis"}>
                                        {prop.status}
                                    </Badge>
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">TL;DR</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4 text-sm text-[var(--cp-text)]">
                                    {prop.tldr}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">Pros</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm space-y-1">
                                        {prop.pros.map((pro: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1 text-emerald-500">✓</span>
                                                <span className="text-[var(--cp-text)]">{pro}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">Cons</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm space-y-1">
                                        {prop.cons.map((con: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1 text-rose-500">✗</span>
                                                <span className="text-[var(--cp-text)]">{con}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </Card>

            {/* Comparison Cards - Mobile */}
            <section className="md:hidden space-y-4">
                {selectedData.map((prop: any) => (
                    <Card key={prop.num} className="space-y-3">
                        <Link href={`/measure/prop/${prop.num}`} className="block hover:text-accent transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-accent">Prop {prop.num}</span>
                                <Badge variant={prop.status === "Active" ? "supported" : "official"}>
                                    {prop.status}
                                </Badge>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-[var(--cp-text)]">
                                {prop.title}
                            </h3>
                        </Link>

                        <div className="mt-4 space-y-3">
                            <div>
                                <span className="section-title">TL;DR</span>
                                <p className="mt-1 text-sm text-[var(--cp-text)]">{prop.tldr}</p>
                            </div>

                            <div>
                                <span className="section-title text-emerald-600">Pros</span>
                                <ul className="mt-1 text-sm text-[var(--cp-text)] space-y-1">
                                    {prop.pros.map((pro: string, i: number) => (
                                        <li key={i}>✓ {pro}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <span className="section-title text-rose-500">Cons</span>
                                <ul className="mt-1 text-sm text-[var(--cp-text)] space-y-1">
                                    {prop.cons.map((con: string, i: number) => (
                                        <li key={i}>✗ {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </section>

            <div className="glass-card rounded-2xl p-8 text-center">
                <h3 className="font-heading text-lg font-bold text-[var(--cp-text)] mb-1">
                    Want to explore more?
                </h3>
                <p className="text-sm text-[var(--cp-muted)] mb-5">
                    Browse all propositions or search any policy topic.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/browse" className="text-sm font-medium text-[var(--cp-accent)] hover:underline">
                        Browse All
                    </Link>
                    <span className="text-[var(--cp-muted)]">&middot;</span>
                    <Link href="/" className="text-sm font-medium text-[var(--cp-accent)] hover:underline">
                        Search
                    </Link>
                </div>
            </div>
        </div>
    );
}
