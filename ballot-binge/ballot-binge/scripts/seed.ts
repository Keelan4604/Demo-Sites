import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Add UserProfile table if it doesn't exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserProfile" (
      id TEXT PRIMARY KEY,
      name TEXT,
      party TEXT,
      city TEXT,
      state TEXT,
      email TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clear existing data
  await prisma.swipe.deleteMany();
  await prisma.stance.deleteMany();
  await prisma.candidateTopic.deleteMany();
  await prisma.measureTopic.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.ballotMeasure.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.jurisdiction.deleteMany();

  // ==================== JURISDICTIONS ====================
  const states = await Promise.all([
    prisma.jurisdiction.create({ data: { name: "California", abbreviation: "CA", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "North Carolina", abbreviation: "NC", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Texas", abbreviation: "TX", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Illinois", abbreviation: "IL", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Michigan", abbreviation: "MI", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Minnesota", abbreviation: "MN", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "New Hampshire", abbreviation: "NH", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Oregon", abbreviation: "OR", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Rhode Island", abbreviation: "RI", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Delaware", abbreviation: "DE", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Virginia", abbreviation: "VA", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Maine", abbreviation: "ME", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "South Carolina", abbreviation: "SC", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "West Virginia", abbreviation: "WV", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Louisiana", abbreviation: "LA", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Arkansas", abbreviation: "AR", type: "state" } }),
    prisma.jurisdiction.create({ data: { name: "Massachusetts", abbreviation: "MA", type: "state" } }),
  ]);

  const [ca, nc, tx, il, mi, mn, nh, or_, ri, de, va, me, sc, wv, la, ar, ma] = states;

  // ==================== TOPICS ====================
  const topics = await Promise.all([
    prisma.topic.create({ data: { name: "Housing", slug: "housing", description: "Affordable housing and development policy", icon: "🏠" } }),
    prisma.topic.create({ data: { name: "Education", slug: "education", description: "K-12 and higher education funding and policy", icon: "📚" } }),
    prisma.topic.create({ data: { name: "Healthcare", slug: "healthcare", description: "Healthcare access and insurance policy", icon: "🏥" } }),
    prisma.topic.create({ data: { name: "Environment", slug: "environment", description: "Climate and environmental protection", icon: "🌿" } }),
    prisma.topic.create({ data: { name: "Economy", slug: "economy", description: "Jobs, taxes, and economic policy", icon: "💼" } }),
    prisma.topic.create({ data: { name: "Public Safety", slug: "public-safety", description: "Law enforcement and criminal justice", icon: "🛡️" } }),
    prisma.topic.create({ data: { name: "Transportation", slug: "transportation", description: "Roads, transit, and infrastructure", icon: "🚆" } }),
    prisma.topic.create({ data: { name: "Technology", slug: "technology", description: "Tech regulation and digital policy", icon: "💻" } }),
    prisma.topic.create({ data: { name: "Immigration", slug: "immigration", description: "Immigration and border policy", icon: "🌎" } }),
    prisma.topic.create({ data: { name: "Civil Rights", slug: "civil-rights", description: "Equality and civil liberties", icon: "⚖️" } }),
    prisma.topic.create({ data: { name: "National Security", slug: "national-security", description: "Defense and foreign policy", icon: "🦅" } }),
    prisma.topic.create({ data: { name: "Energy", slug: "energy", description: "Energy production and independence", icon: "⚡" } }),
    prisma.topic.create({ data: { name: "Gun Policy", slug: "gun-policy", description: "Firearms regulation and rights", icon: "🎯" } }),
    prisma.topic.create({ data: { name: "Agriculture", slug: "agriculture", description: "Farming, rural development, and food policy", icon: "🌾" } }),
  ]);

  const [housing, education, healthcare, environment, economy, safety, transportation, tech, immigration, civilRights, natSec, energy, guns, agriculture] = topics;

  // ==================== CANDIDATES (Real US Senators up in 2026) ====================
  // Official portrait photos from bioguide.congress.gov (public domain US govt works)
  const candidates = [
    {
      name: "Dick Durbin",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: il.id,
      shortSummary: "Senior senator from Illinois and former Senate Majority Whip known for immigration reform and criminal justice advocacy.",
      longSummary: "Dick Durbin has served in the U.S. Senate since 1997. As chair of the Judiciary Committee, he has championed the DREAM Act for undocumented youth, criminal sentencing reform, and consumer protection. He is known for working across the aisle on immigration and justice issues.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/D/D000563.jpg",
      websiteUrl: "https://www.durbin.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 1,
      topicIds: [immigration.id, safety.id, civilRights.id],
      stances: [
        { topic: "Immigration", position: "Pathway to citizenship", summary: "Author of the DREAM Act, supports comprehensive immigration reform with a pathway for undocumented youth" },
        { topic: "Criminal Justice", position: "Reform sentencing", summary: "Led bipartisan sentencing reform efforts, opposes mandatory minimums for nonviolent offenses" },
        { topic: "Consumer Protection", position: "Regulate predatory lending", summary: "Advocates for credit card fee caps and payday lending regulations" },
      ],
    },
    {
      name: "Susan Collins",
      office: "U.S. Senate",
      party: "Republican",
      jurisdictionId: me.id,
      shortSummary: "Senior senator from Maine known as a centrist Republican who frequently breaks with her party on key votes.",
      longSummary: "Susan Collins has served in the U.S. Senate since 1997. She is known for her independent streak, casting decisive votes on healthcare and judicial nominations. She chairs or serves on the Appropriations Committee and focuses on healthcare access, small business, and national security.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/C/C001035.jpg",
      websiteUrl: "https://www.collins.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 2,
      topicIds: [healthcare.id, economy.id, natSec.id],
      stances: [
        { topic: "Healthcare", position: "Protect ACA provisions", summary: "Voted to preserve ACA protections for pre-existing conditions, supports bipartisan healthcare fixes" },
        { topic: "Economy", position: "Support small business", summary: "Led PPP small business relief program, supports targeted tax relief for small employers" },
        { topic: "National Security", position: "Strong defense", summary: "Supports robust defense spending and NATO alliance commitments" },
      ],
    },
    {
      name: "Gary Peters",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: mi.id,
      shortSummary: "Senator from Michigan focused on manufacturing, auto industry, and Great Lakes environmental protection.",
      longSummary: "Gary Peters has served in the U.S. Senate since 2015. A former Navy Reserve officer, he focuses on supporting Michigan's auto industry, protecting the Great Lakes, and strengthening cybersecurity. He previously chaired the Homeland Security Committee.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/P/P000595.jpg",
      websiteUrl: "https://www.peters.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 3,
      topicIds: [economy.id, environment.id, natSec.id],
      stances: [
        { topic: "Economy", position: "Protect manufacturing", summary: "Champions auto industry and domestic manufacturing, supports Buy American provisions" },
        { topic: "Environment", position: "Protect Great Lakes", summary: "Secured billions for Great Lakes restoration and opposes water diversion projects" },
        { topic: "Cybersecurity", position: "Strengthen defenses", summary: "Led bipartisan cybersecurity legislation requiring critical infrastructure reporting of breaches" },
      ],
    },
    {
      name: "Tina Smith",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: mn.id,
      shortSummary: "Senator from Minnesota focusing on affordable housing, healthcare access, and rural economic development.",
      longSummary: "Tina Smith has served in the U.S. Senate since 2018 after serving as Minnesota's Lieutenant Governor. She serves on the Agriculture, Banking, and Health committees. Her priorities include lowering prescription drug costs, expanding affordable housing, and supporting family farmers.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/S/S001203.jpg",
      websiteUrl: "https://www.smith.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 4,
      topicIds: [housing.id, healthcare.id, agriculture.id],
      stances: [
        { topic: "Housing", position: "Expand affordable housing", summary: "Authored legislation to increase Low-Income Housing Tax Credits and fund rural housing" },
        { topic: "Healthcare", position: "Lower drug costs", summary: "Supports Medicare drug price negotiation and insulin price caps" },
        { topic: "Agriculture", position: "Support family farms", summary: "Advocates for crop insurance reform and rural broadband access" },
      ],
    },
    {
      name: "Jeanne Shaheen",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: nh.id,
      shortSummary: "Senior senator from New Hampshire and former governor focused on small business, veterans, and foreign policy.",
      longSummary: "Jeanne Shaheen has served in the U.S. Senate since 2009 after serving as New Hampshire's governor. She is the first woman in US history elected both governor and senator. She serves on Armed Services, Foreign Relations, and Appropriations committees.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/S/S001181.jpg",
      websiteUrl: "https://www.shaheen.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 5,
      topicIds: [economy.id, natSec.id, healthcare.id],
      stances: [
        { topic: "Economy", position: "Champion small business", summary: "Led bipartisan small business support programs and workforce development initiatives" },
        { topic: "Foreign Policy", position: "Strengthen alliances", summary: "Senior member of Foreign Relations Committee, strong supporter of Ukraine aid and NATO" },
        { topic: "Healthcare", position: "Lower costs", summary: "Fights to lower prescription drug costs and protect opioid treatment programs" },
      ],
    },
    {
      name: "Jeff Merkley",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: or_.id,
      shortSummary: "Progressive senator from Oregon championing affordable housing, climate action, and democracy reform.",
      longSummary: "Jeff Merkley has served in the U.S. Senate since 2009. A former state legislature speaker, he is one of the Senate's most progressive members. He has championed the Green New Deal, affordable housing investment, and ending the filibuster for democracy legislation.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/M/M001176.jpg",
      websiteUrl: "https://www.merkley.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 6,
      topicIds: [housing.id, environment.id, civilRights.id],
      stances: [
        { topic: "Housing", position: "Major federal investment", summary: "Introduced legislation for $100 billion in affordable housing construction and tenant protections" },
        { topic: "Climate", position: "Green New Deal", summary: "Co-sponsor of Green New Deal, supports ending fossil fuel subsidies and 100% clean energy" },
        { topic: "Democracy", position: "Reform the filibuster", summary: "Leading voice for filibuster reform to pass voting rights and democracy legislation" },
      ],
    },
    {
      name: "John Cornyn",
      office: "U.S. Senate",
      party: "Republican",
      jurisdictionId: tx.id,
      shortSummary: "Senior senator from Texas and former Senate Majority Whip focused on border security, gun safety, and the judiciary.",
      longSummary: "John Cornyn has served in the U.S. Senate since 2002 and previously served as Texas Attorney General. He led the bipartisan gun safety bill after the Uvalde shooting and is a key voice on border security, judicial nominations, and Texas energy interests.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/C/C001056.jpg",
      websiteUrl: "https://www.cornyn.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 7,
      topicIds: [immigration.id, guns.id, economy.id],
      stances: [
        { topic: "Immigration", position: "Secure the border", summary: "Supports increased border patrol funding, physical barriers, and technology at the southern border" },
        { topic: "Gun Policy", position: "Bipartisan safety", summary: "Led the Bipartisan Safer Communities Act after the Uvalde tragedy, expanding background checks for buyers under 21" },
        { topic: "Energy", position: "Energy independence", summary: "Supports Texas oil and gas industry and opposes regulations that would limit domestic energy production" },
      ],
    },
    {
      name: "Lindsey Graham",
      office: "U.S. Senate",
      party: "Republican",
      jurisdictionId: sc.id,
      shortSummary: "Senior senator from South Carolina known for his hawkish foreign policy and work on judicial nominations.",
      longSummary: "Lindsey Graham has served in the U.S. Senate since 2003 after serving in the House. A former Air Force JAG officer, he serves on the Judiciary and Armed Services committees. He is known for strong national defense positions and bipartisan work on immigration.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/G/G000359.jpg",
      websiteUrl: "https://www.lgraham.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 8,
      topicIds: [natSec.id, immigration.id, safety.id],
      stances: [
        { topic: "National Security", position: "Peace through strength", summary: "Advocates for increased defense spending, strong support for Israel and Ukraine military aid" },
        { topic: "Immigration", position: "Border security first", summary: "Supports border wall funding and merit-based immigration reform" },
        { topic: "Judiciary", position: "Conservative courts", summary: "Key player in confirming conservative federal judges and Supreme Court justices" },
      ],
    },
    {
      name: "Shelley Moore Capito",
      office: "U.S. Senate",
      party: "Republican",
      jurisdictionId: wv.id,
      shortSummary: "Senator from West Virginia focused on infrastructure, energy jobs, and rural development.",
      longSummary: "Shelley Moore Capito has served in the U.S. Senate since 2015, the first woman elected to the Senate from West Virginia. She serves on Appropriations and Environment committees and focuses on infrastructure investment, protecting coal and energy jobs, and expanding broadband in rural areas.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/C/C001047.jpg",
      websiteUrl: "https://www.capito.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 9,
      topicIds: [energy.id, transportation.id, economy.id],
      stances: [
        { topic: "Energy", position: "All-of-the-above", summary: "Supports coal, natural gas, and renewables, opposes regulations that harm fossil fuel jobs" },
        { topic: "Infrastructure", position: "Invest in roads and broadband", summary: "Key negotiator on bipartisan infrastructure law, champions rural broadband expansion" },
        { topic: "Economy", position: "Rural development", summary: "Fights for economic diversification in Appalachia and workforce training programs" },
      ],
    },
    {
      name: "Bill Cassidy",
      office: "U.S. Senate",
      party: "Republican",
      jurisdictionId: la.id,
      shortSummary: "Senator from Louisiana and physician focused on healthcare reform, energy policy, and coastal restoration.",
      longSummary: "Bill Cassidy has served in the U.S. Senate since 2015. A gastroenterologist by training, he brings a healthcare perspective to policy. He serves on the Finance and Energy committees and has championed bipartisan healthcare reforms, Louisiana's energy sector, and Gulf Coast restoration.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/C/C001075.jpg",
      websiteUrl: "https://www.cassidy.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 10,
      topicIds: [healthcare.id, energy.id, environment.id],
      stances: [
        { topic: "Healthcare", position: "Market-based reform", summary: "Authored alternative ACA replacement focused on patient choice and price transparency" },
        { topic: "Energy", position: "Pro-energy production", summary: "Supports expanded oil, gas, and LNG exports as vital to Louisiana economy and national security" },
        { topic: "Coastal Restoration", position: "Protect the coast", summary: "Secured billions for Gulf Coast restoration and hurricane resilience infrastructure" },
      ],
    },
    {
      name: "Tom Cotton",
      office: "U.S. Senate",
      party: "Republican",
      jurisdictionId: ar.id,
      shortSummary: "Senator from Arkansas and Army veteran known for hawkish foreign policy, tough-on-crime positions, and immigration enforcement.",
      longSummary: "Tom Cotton has served in the U.S. Senate since 2015. A Harvard Law graduate and Army infantry officer who served in Iraq and Afghanistan, he is one of the Senate's most conservative members. He serves on the Armed Services and Intelligence committees.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/C/C001095.jpg",
      websiteUrl: "https://www.cotton.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 11,
      topicIds: [natSec.id, immigration.id, safety.id],
      stances: [
        { topic: "National Security", position: "Confront China", summary: "Leading China hawk, supports decoupling critical supply chains and increasing military spending" },
        { topic: "Immigration", position: "Reduce immigration", summary: "Supports cutting legal immigration levels and mandatory E-Verify for all employers" },
        { topic: "Criminal Justice", position: "Tough on crime", summary: "Opposes sentencing reform, supports mandatory minimums and increased law enforcement funding" },
      ],
    },
    {
      name: "Ed Markey",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: ma.id,
      shortSummary: "Progressive senator from Massachusetts and co-author of the Green New Deal focused on climate, tech regulation, and consumer protection.",
      longSummary: "Ed Markey has served in the U.S. Senate since 2013 after 37 years in the House. He co-authored the Green New Deal resolution and is a leading voice on climate action, telecommunications policy, and children's internet safety. He chairs the Climate Change subcommittee.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/M/M000133.jpg",
      websiteUrl: "https://www.markey.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 12,
      topicIds: [environment.id, tech.id, civilRights.id],
      stances: [
        { topic: "Climate", position: "Green New Deal", summary: "Co-authored the Green New Deal, supports 100% clean energy economy by 2050 and environmental justice" },
        { topic: "Technology", position: "Regulate Big Tech", summary: "Authored children's online privacy legislation and net neutrality rules" },
        { topic: "Nuclear Weapons", position: "No first use", summary: "Introduced legislation requiring Congressional approval before any first-use nuclear strike" },
      ],
    },
    {
      name: "Mark Warner",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: va.id,
      shortSummary: "Senator from Virginia and former tech entrepreneur focused on technology regulation, intelligence oversight, and fiscal responsibility.",
      longSummary: "Mark Warner has served in the U.S. Senate since 2009 after serving as Virginia's governor. A former tech entrepreneur and venture capitalist, he chairs the Intelligence Committee and is known as a centrist Democrat focused on technology policy, bipartisan deal-making, and fiscal responsibility.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/W/W000805.jpg",
      websiteUrl: "https://www.warner.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 13,
      topicIds: [tech.id, natSec.id, economy.id],
      stances: [
        { topic: "Technology", position: "Regulate AI and social media", summary: "Leading voice on AI regulation, social media accountability, and data privacy legislation" },
        { topic: "Intelligence", position: "Protect national security", summary: "Chairs Intelligence Committee, focuses on cyber threats, election security, and foreign influence" },
        { topic: "Economy", position: "Fiscal responsibility", summary: "Supports bipartisan deficit reduction and has worked on tax reform across party lines" },
      ],
    },
    {
      name: "Jack Reed",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: ri.id,
      shortSummary: "Senior senator from Rhode Island and chairman of the Armed Services Committee focused on defense policy and education.",
      longSummary: "Jack Reed has served in the U.S. Senate since 1997. A West Point graduate and former Army Ranger, he chairs the Armed Services Committee. He is considered one of the Senate's foremost experts on defense and military policy and also champions education funding and affordable housing.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/R/R000122.jpg",
      websiteUrl: "https://www.reed.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 14,
      topicIds: [natSec.id, education.id, housing.id],
      stances: [
        { topic: "Defense", position: "Strong, smart defense", summary: "Chairs Armed Services Committee, advocates for military readiness while avoiding wasteful spending" },
        { topic: "Education", position: "Fund public schools", summary: "Champions increased federal investment in K-12 education and Pell Grant expansion" },
        { topic: "Housing", position: "Affordable housing investment", summary: "Supports expanding Housing Trust Fund and Section 8 voucher programs" },
      ],
    },
    {
      name: "Chris Coons",
      office: "U.S. Senate",
      party: "Democratic",
      jurisdictionId: de.id,
      shortSummary: "Senator from Delaware focused on foreign policy, manufacturing, and bipartisan criminal justice reform.",
      longSummary: "Chris Coons has served in the U.S. Senate since 2010. He serves on the Foreign Relations and Judiciary committees and is known as a bipartisan deal-maker. He focuses on American manufacturing competitiveness, international development, and criminal justice reform.",
      imageUrl: "https://bioguide.congress.gov/bioguide/photo/C/C001088.jpg",
      websiteUrl: "https://www.coons.senate.gov",
      electionDate: "2026-11-03",
      sortOrder: 15,
      topicIds: [economy.id, natSec.id, safety.id],
      stances: [
        { topic: "Economy", position: "Boost American manufacturing", summary: "Champions reshoring of manufacturing and supports the CHIPS Act for semiconductor production" },
        { topic: "Foreign Policy", position: "American leadership", summary: "Supports strong international engagement, democracy promotion, and development aid" },
        { topic: "Criminal Justice", position: "Bipartisan reform", summary: "Worked on bipartisan sentencing reform and supports reentry programs to reduce recidivism" },
      ],
    },
  ];

  // ==================== BALLOT MEASURES ====================
  const measures = [
    { title: "Affordable Housing Bond Act", measureCode: "Prop 5", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Housing", shortSummary: "Authorizes $10 billion in bonds for affordable housing construction, down payment assistance, and homeownership programs across California.", longSummary: "This proposition would authorize the state to issue $10 billion in general obligation bonds to fund affordable housing programs. The funds would be allocated to construction of affordable rental housing, down payment assistance for first-time homebuyers, housing for veterans and seniors, and infrastructure improvements for new housing developments.", yesMeans: "The state could borrow $10 billion by selling bonds to investors, using the money for housing construction and homeownership assistance programs.", noMeans: "The state would not issue $10 billion in bonds for housing programs. Existing housing programs would continue at their current funding levels.", proArguments: JSON.stringify(["California faces a severe housing shortage; this provides critical funding", "Creates thousands of construction jobs statewide", "Includes protections for veterans and seniors"]), conArguments: JSON.stringify(["Adds $16 billion in debt (including interest) to the state budget", "Bond funding is a temporary fix that doesn't address root causes", "Past housing bonds have been slow to distribute"]), sortOrder: 1, topicIds: [housing.id, economy.id] },
    { title: "Clean Energy Infrastructure Initiative", measureCode: "Prop 8", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Energy", shortSummary: "Requires California to source 90% of electricity from renewable sources by 2035 and allocates $4 billion for grid modernization.", longSummary: "This measure would accelerate California's renewable energy timeline, requiring 90% clean electricity by 2035. It allocates $4 billion from cap-and-trade revenue toward grid modernization, battery storage, and transmission infrastructure.", yesMeans: "California would accelerate its clean energy targets and invest $4 billion in grid modernization and renewable infrastructure.", noMeans: "Current clean energy targets and timelines would remain in place.", proArguments: JSON.stringify(["Accelerates transition to clean energy", "Reduces dependence on fossil fuels", "Creates green energy jobs"]), conArguments: JSON.stringify(["May increase electricity costs short-term", "Timeline may be too aggressive", "Could cause grid reliability issues"]), sortOrder: 2, topicIds: [energy.id, environment.id, economy.id] },
    { title: "School Safety and Mental Health Funding Act", measureCode: "Prop 12", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Education", shortSummary: "Increases the state sales tax by 0.25% to fund school counselors, campus security improvements, and student mental health services.", longSummary: "This proposition would increase the state sales tax rate by one-quarter cent to generate approximately $2.5 billion annually for K-12 schools for hiring counselors, improving campus security, anti-bullying programs, and crisis intervention training.", yesMeans: "A small sales tax increase would fund school mental health services and security improvements.", noMeans: "The sales tax would not increase. Schools would continue to fund these programs through existing budgets.", proArguments: JSON.stringify(["Student mental health is in crisis", "Puts counselors in every school", "10-year sunset clause"]), conArguments: JSON.stringify(["Sales taxes are regressive", "Schools already receive significant funding", "No guarantee of effective use"]), sortOrder: 3, topicIds: [education.id, healthcare.id, safety.id] },
    { title: "Criminal Justice Reform and Rehabilitation Act", measureCode: "Measure B", jurisdictionId: nc.id, electionDate: "2026-11-03", category: "Public Safety", shortSummary: "Redirects 15% of state prison funding to community-based rehabilitation, job training, and re-entry programs for nonviolent offenders.", longSummary: "This measure would require the state to redirect 15% of its annual prison system budget toward community-based alternatives for nonviolent offenders including vocational training, substance abuse treatment, and mental health services.", yesMeans: "Prison funding would shift to community rehabilitation programs with independent oversight.", noMeans: "Current prison funding and rehabilitation program levels would remain unchanged.", proArguments: JSON.stringify(["Reduces recidivism through proven programs", "Community programs cost less than incarceration", "Creates social work and counseling jobs"]), conArguments: JSON.stringify(["Could reduce prison safety resources", "May be perceived as soft on crime", "Creates new government bureaucracy"]), sortOrder: 4, topicIds: [safety.id, civilRights.id, economy.id] },
    { title: "Digital Privacy and AI Transparency Act", measureCode: "Prop 3", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Technology", shortSummary: "Requires companies to disclose AI-generated content, prohibits facial recognition in public spaces, and strengthens personal data protections.", longSummary: "This proposition establishes new digital rights protections. It requires clear labeling of AI-generated content, bans government use of facial recognition in public spaces, and strengthens data privacy by requiring explicit opt-in consent for data collection by companies operating in California.", yesMeans: "New protections would require AI content disclosure, ban public facial recognition, and strengthen data privacy.", noMeans: "Current digital privacy and AI regulations would remain unchanged.", proArguments: JSON.stringify(["Protects citizens from AI deepfakes and misinformation", "Prevents government mass surveillance", "Gives individuals real control over personal data"]), conArguments: JSON.stringify(["May hinder beneficial AI innovation", "Limits useful security applications of facial recognition", "Compliance costs burdensome for small businesses"]), sortOrder: 5, topicIds: [tech.id, civilRights.id] },
    { title: "Public Transit Expansion and Modernization", measureCode: "Prop 7", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Transportation", shortSummary: "Allocates $6.8 billion from gas tax revenue to expand bus and rail services, add bike infrastructure, and electrify transit fleets.", longSummary: "This measure would dedicate $6.8 billion over 15 years to public transportation expansion including new bus rapid transit lines, rail service extensions, protected bike lanes, and full electrification of transit fleets by 2040.", yesMeans: "Gas tax revenue would fund major public transit expansion and fleet electrification.", noMeans: "Gas tax revenues would continue under current allocation formulas with no additional transit funding.", proArguments: JSON.stringify(["Reduces traffic congestion and commute times", "Reduces air pollution and greenhouse gas emissions", "Provides more equitable transportation access"]), conArguments: JSON.stringify(["Diverts road maintenance funding", "Little benefit for rural areas", "Transit projects frequently exceed budget and timeline"]), sortOrder: 6, topicIds: [transportation.id, environment.id, economy.id] },
    { title: "Immigration Enforcement and Worker Protection Act", measureCode: "HB 1247", jurisdictionId: tx.id, electionDate: "2026-11-03", category: "Immigration", shortSummary: "Requires all employers with 10+ employees to use E-Verify, increases penalties for wage theft, and creates a state guest worker program.", longSummary: "This bill requires businesses with 10+ employees to use E-Verify for employment eligibility verification, increases penalties for wage theft regardless of immigration status, and creates a state-administered temporary guest worker program for agriculture and construction.", yesMeans: "Employers must verify work eligibility, face stronger wage theft penalties, and can access a new guest worker program.", noMeans: "Current employment verification and labor protections would remain unchanged.", proArguments: JSON.stringify(["Protects workers from unfair wage competition", "Addresses agricultural labor shortages legally", "Stronger penalties deter wage theft"]), conArguments: JSON.stringify(["Burdens small businesses with new compliance costs", "May increase agriculture and food costs", "State guest worker program difficult to administer"]), sortOrder: 7, topicIds: [immigration.id, economy.id, civilRights.id] },
    { title: "Universal Pre-K Education Expansion", measureCode: "Prop 15", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Education", shortSummary: "Provides free pre-kindergarten for all 3- and 4-year-olds in California, funded by a 1.5% tax on corporate profits over $5 million.", longSummary: "This proposition would establish universal pre-K for all 3- and 4-year-olds, funded by a 1.5% surcharge on corporate profits exceeding $5 million annually, expected to generate approximately $3 billion per year.", yesMeans: "All 3- and 4-year-olds get free pre-K, funded by a tax on large corporate profits.", noMeans: "Current pre-K programs continue with existing funding, no new corporate tax.", proArguments: JSON.stringify(["Early education dramatically improves long-term outcomes", "Helps working families afford childcare", "Only taxes large corporations, not small businesses"]), conArguments: JSON.stringify(["May reduce business investment in California", "Difficult to hire enough qualified pre-K teachers quickly", "Some families prefer private or home-based education"]), sortOrder: 8, topicIds: [education.id, economy.id] },
    { title: "Property Tax Relief for Seniors Act", measureCode: "SJR 14", jurisdictionId: tx.id, electionDate: "2026-11-03", category: "Economy", shortSummary: "Freezes property tax assessments for homeowners aged 65+ and provides a $25,000 homestead exemption increase for all homeowners.", longSummary: "This constitutional amendment would freeze property tax valuations at current levels for homeowners aged 65 and older, preventing tax increases from rising property values. It also increases the general homestead exemption by $25,000 for all homeowners, reducing the tax burden on primary residences statewide.", yesMeans: "Senior property taxes would be frozen and all homeowners would see a $25,000 increase in their homestead exemption.", noMeans: "Current property tax assessment rules and exemption levels would remain unchanged.", proArguments: JSON.stringify(["Helps seniors on fixed incomes stay in their homes", "Reduces property tax burden for all homeowners", "Prevents displacement of long-time residents"]), conArguments: JSON.stringify(["Reduces local government revenue for schools and services", "Benefits wealthy homeowners more than renters", "Could shift tax burden to commercial properties and younger homeowners"]), sortOrder: 9, topicIds: [economy.id, housing.id] },
    { title: "Minimum Wage Increase Act", measureCode: "Prop 1", jurisdictionId: mi.id, electionDate: "2026-11-03", category: "Economy", shortSummary: "Raises Michigan's minimum wage to $18/hour by 2028 and eliminates the tipped wage exemption over three years.", longSummary: "This proposition would gradually increase Michigan's minimum wage from the current rate to $18 per hour by 2028, with annual inflation adjustments thereafter. It also phases out the lower tipped minimum wage over three years, requiring all workers to receive the full minimum wage.", yesMeans: "The minimum wage would rise to $18/hour by 2028 and tipped workers would receive the full minimum wage.", noMeans: "Current minimum wage rates and tipped wage exemption would remain unchanged.", proArguments: JSON.stringify(["Lifts hundreds of thousands of workers out of poverty", "Eliminates the unfair two-tiered wage system for tipped workers", "Increases consumer spending power in the local economy"]), conArguments: JSON.stringify(["May cause job losses or reduced hours for low-wage workers", "Could increase menu prices and hurt small restaurants", "Tipped workers may see reduced tips if customers adjust behavior"]), sortOrder: 10, topicIds: [economy.id, civilRights.id] },
    { title: "Renewable Energy Portfolio Standard", measureCode: "HB 2050", jurisdictionId: va.id, electionDate: "2026-11-03", category: "Energy", shortSummary: "Requires Virginia utilities to generate 80% of electricity from renewable sources by 2035, with full transition to clean energy by 2045.", longSummary: "This bill mandates that Virginia's electric utilities transition to 80% renewable energy generation by 2035 and 100% by 2045. It includes provisions for energy storage requirements, job transition programs for fossil fuel workers, and rate protections for low-income households.", yesMeans: "Virginia utilities must transition to 80% renewable by 2035 and 100% clean energy by 2045.", noMeans: "Current voluntary clean energy goals would remain without binding requirements.", proArguments: JSON.stringify(["Creates thousands of clean energy construction and maintenance jobs", "Reduces air pollution and public health costs", "Protects low-income ratepayers with built-in rate caps"]), conArguments: JSON.stringify(["Could increase electricity rates during transition period", "Aggressive timeline may challenge grid reliability", "Disadvantages Virginia's existing natural gas investments"]), sortOrder: 11, topicIds: [energy.id, environment.id, economy.id] },
    { title: "Ranked Choice Voting Initiative", measureCode: "Question 3", jurisdictionId: me.id, electionDate: "2026-11-03", category: "Elections", shortSummary: "Expands ranked choice voting to all state and local elections in Maine, including presidential elections and party primaries.", longSummary: "This measure would expand Maine's existing ranked choice voting system (currently used for federal races) to all state and local elections, including governor, state legislature, city councils, and school boards. Voters would rank candidates in order of preference, with instant runoff rounds eliminating the lowest vote-getters.", yesMeans: "All Maine elections would use ranked choice voting, allowing voters to rank candidates by preference.", noMeans: "Ranked choice voting would continue only for federal races; state and local elections would keep the current system.", proArguments: JSON.stringify(["Eliminates the spoiler effect and wasted votes", "Encourages more civil campaigns and coalition-building", "Gives independent and third-party candidates a fair chance"]), conArguments: JSON.stringify(["More complex ballot could confuse some voters", "Slower results due to tabulation rounds", "May reduce accountability of elected officials to party platforms"]), sortOrder: 12, topicIds: [civilRights.id] },
    { title: "Universal Background Check Expansion", measureCode: "Measure 114", jurisdictionId: or_.id, electionDate: "2026-11-03", category: "Gun Policy", shortSummary: "Requires background checks for all firearm transfers including private sales, establishes a permit-to-purchase system, and bans magazines over 10 rounds.", longSummary: "This measure closes the private sale loophole by requiring universal background checks for all firearm transfers. It creates a permit-to-purchase system requiring safety training and a background check before buying any firearm. It also prohibits the sale, transfer, or possession of ammunition magazines capable of holding more than 10 rounds.", yesMeans: "All gun sales would require background checks, buyers would need permits, and high-capacity magazines would be banned.", noMeans: "Current firearm purchase rules would remain, including the private sale exemption.", proArguments: JSON.stringify(["Universal checks prevent guns from reaching prohibited buyers", "Permit system ensures buyers have basic safety training", "High-capacity magazine bans reduce mass shooting casualties"]), conArguments: JSON.stringify(["Permit system creates delays and barriers for law-abiding citizens", "Magazine ban affects millions of legally-owned firearms", "Enforcement of private sale checks is nearly impossible"]), sortOrder: 13, topicIds: [guns.id, safety.id, civilRights.id] },
    { title: "Water Infrastructure and Drought Relief Bond", measureCode: "Prop 21", jurisdictionId: ca.id, electionDate: "2026-11-03", category: "Environment", shortSummary: "Authorizes $7.5 billion in bonds for water recycling, desalination plants, dam repairs, and drought resilience infrastructure.", longSummary: "This proposition would authorize the state to issue $7.5 billion in general obligation bonds to fund water infrastructure projects including water recycling facilities, desalination plants, groundwater recharge, aging dam repairs, and drought contingency programs for agricultural and urban water districts.", yesMeans: "California could borrow $7.5 billion for water recycling, desalination, and drought resilience projects.", noMeans: "The state would not issue bonds for water infrastructure. Existing water programs would continue at current levels.", proArguments: JSON.stringify(["California's water infrastructure is aging and drought is increasing", "Creates diverse water supply sources reducing dependence on snowpack", "Protects agriculture and urban water security for decades"]), conArguments: JSON.stringify(["Adds $12 billion in total costs including interest to state debt", "Desalination is energy-intensive and environmentally controversial", "Past water bonds have been slow to fund approved projects"]), sortOrder: 14, topicIds: [environment.id, agriculture.id, economy.id] },
    { title: "Recreational Marijuana Legalization Act", measureCode: "HB 768", jurisdictionId: nc.id, electionDate: "2026-11-03", category: "Civil Rights", shortSummary: "Legalizes recreational marijuana for adults 21+, establishes a regulated market with state licensing, and expunges prior possession convictions.", longSummary: "This bill would legalize the possession and use of marijuana for adults 21 and older, establish a state-regulated licensing system for cultivation, processing, and retail sales, impose a 15% excise tax on sales, and automatically expunge criminal records for prior marijuana possession convictions.", yesMeans: "Adults 21+ could legally purchase and possess marijuana, a regulated market would be established, and prior possession records would be expunged.", noMeans: "Marijuana would remain illegal for recreational use in North Carolina under current state law.", proArguments: JSON.stringify(["Generates significant tax revenue for state programs", "Reduces racial disparities in marijuana enforcement", "Regulated market is safer than illicit market"]), conArguments: JSON.stringify(["May increase youth access despite age restrictions", "Impaired driving concerns with limited testing technology", "Federal-state legal conflict creates business banking challenges"]), sortOrder: 15, topicIds: [civilRights.id, economy.id, safety.id] },
  ];

  // ==================== INSERT DATA ====================
  console.log("Inserting measures...");
  for (const m of measures) {
    const { topicIds, ...data } = m;
    const created = await prisma.ballotMeasure.create({ data });
    for (const tid of topicIds) {
      await prisma.measureTopic.create({ data: { measureId: created.id, topicId: tid } });
    }
  }

  console.log("Inserting candidates...");
  for (const c of candidates) {
    const { topicIds, stances, ...data } = c;
    const created = await prisma.candidate.create({ data });
    for (const tid of topicIds) {
      await prisma.candidateTopic.create({ data: { candidateId: created.id, topicId: tid } });
    }
    for (const s of stances) {
      await prisma.stance.create({ data: { ...s, candidateId: created.id } });
    }
  }

  console.log("Seeded successfully!");
  console.log(`  ${candidates.length} candidates (real US Senators)`);
  console.log(`  ${measures.length} ballot measures`);
  console.log(`  ${topics.length} topics`);
  console.log(`  ${states.length} states`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
